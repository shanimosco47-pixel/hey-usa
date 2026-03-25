import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Send, ArrowRight, Sparkles, WifiOff, Zap, History, Mic, MicOff } from 'lucide-react'
import { getBotResponseAsync, BOT_NAME, BOT_SUBTITLE, isAIMode, initConversationFromDb } from './botEngine'
import type { MessageCard } from './botEngine'
import { useAppData } from '@/contexts/AppDataContext'
import { MotiAvatar } from '@/components/shared/MotiRobot'
import * as db from '@/lib/database'
import { TRIP_START_DATE } from '@/constants'
import { triggerEmailScan } from '@/lib/emailScan'
import { ChatMarkdown } from './components/ChatMarkdown'
import { WeatherCard } from './components/WeatherCard'
import { BudgetCard } from './components/BudgetCard'
import { ItineraryCard } from './components/ItineraryCard'
import { DriveCard } from './components/DriveCard'
import { useVoiceInput } from './hooks/useVoiceInput'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  hasAction?: boolean
  card?: MessageCard
  quickActions?: string[]
}

function getSmartSuggestions(data: {
  tasksTotal: number
  tasksDone: number
  packingPercent: number
  budgetPercent: number
  daysUntilTrip: number
}): string[] {
  const suggestions: string[] = []
  const d = data.daysUntilTrip

  // Timeline-aware suggestions
  if (d <= 0) {
    // During the trip
    suggestions.push('מה התכנית להיום?')
    suggestions.push('מה מזג האוויר היום?')
    suggestions.push('תמליץ על מסעדה קרובה')
    suggestions.push('כמה זמן נסיעה לעצירה הבאה?')
  } else if (d <= 14) {
    // Last 2 weeks
    suggestions.push('תעשה לי רשימת last minute!')
    suggestions.push('מה עוד חסר לארוז?')
    suggestions.push('תזכיר לי על המסמכים')
  } else if (d <= 90) {
    // 1-3 months
    if (data.packingPercent < 50) suggestions.push('עזור לי עם רשימת האריזה')
    if (data.budgetPercent > 70) suggestions.push('איפה אפשר לחסוך בתקציב?')
    suggestions.push('מה עוד חסר לנו לפני הטיול?')
  } else if (d <= 180) {
    // 3-6 months
    suggestions.push('מה צריך להזמין עכשיו?')
    suggestions.push('תבדוק שהתקציב מאוזן')
    suggestions.push('תוסיף עצירה ביום 5: ביקור במוזיאון')
  } else {
    // 6+ months
    suggestions.push('מה הדבר הכי חשוב לסגור עכשיו?')
    suggestions.push('תזכיר לי על ESTA ודרכונים')
    suggestions.push('עדכן תקציב ביטוח ל-3000')
  }

  // State-based suggestions
  if (data.tasksDone < data.tasksTotal && d > 0) {
    suggestions.push(`נשארו ${data.tasksTotal - data.tasksDone} משימות, מה הכי דחוף?`)
  }

  // Always add some exploration options
  suggestions.push('תכנן לי יום מושלם ביוסמיטי')
  suggestions.push('כמה זמן נסיעה מוגאס לגרנד קניון?')
  suggestions.push('מה המסלול המלא?')

  // Return first 6 unique
  return [...new Set(suggestions)].slice(0, 6)
}

function BotAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <MotiAvatar size={size} />
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 max-w-[85%]">
      <BotAvatar size="sm" />
      <div
        className="rounded-[16px] rounded-br-[4px] px-4 py-3 bg-white"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-apple-tertiary"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AIBadge() {
  const aiAvailable = isAIMode()
  return (
    <div
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        aiAvailable
          ? 'bg-purple-50 text-purple-600'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      {aiAvailable ? (
        <>
          <Sparkles className="h-2.5 w-2.5" />
          AI
        </>
      ) : (
        <>
          <WifiOff className="h-2.5 w-2.5" />
          בסיסי
        </>
      )}
    </div>
  )
}

function MessageCardRenderer({ card }: { card: MessageCard }) {
  switch (card.type) {
    case 'weather':
      return <WeatherCard data={card.data} />
    case 'budget':
      return <BudgetCard data={card.data} />
    case 'itinerary':
      return <ItineraryCard data={card.data} />
    case 'drive':
      return <DriveCard data={card.data} />
    default:
      return null
  }
}

export default function ChatPage() {
  const { executeMotiAction, buildMotiContext, changeLog, tasks, packingItems, expenses, budgetSettings } = useAppData()
  const navigate = useNavigate()

  const tasksTotal = tasks.length
  const tasksDone = tasks.filter((t) => t.status === 'done').length
  const packedCount = packingItems.filter((p) => p.is_packed).length
  const packingPercent = packingItems.length > 0 ? Math.round((packedCount / packingItems.length) * 100) : 0
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const budgetPercent = budgetSettings.total_budget > 0 ? Math.round((totalSpent / budgetSettings.total_budget) * 100) : 0
  const daysUntilTrip = Math.max(0, Math.ceil(
    (new Date(TRIP_START_DATE).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  const suggestions = useMemo(() => getSmartSuggestions({
    tasksTotal,
    tasksDone,
    packingPercent,
    budgetPercent,
    daysUntilTrip,
  }), [tasksTotal, tasksDone, packingPercent, budgetPercent, daysUntilTrip])

  const voice = useVoiceInput()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [visibleCount, setVisibleCount] = useState(2)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const hasOlderMessages = messages.length > visibleCount
  const visibleMessages = hasOlderMessages ? messages.slice(-visibleCount) : messages

  // Load chat history from Supabase on mount
  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      try {
        const history = await db.fetchChatMessages(200)

        if (cancelled) return

        if (history.length > 0) {
          // Convert DB rows to UI messages
          const loadedMessages: Message[] = history.map((msg) => ({
            id: msg.id,
            text: msg.content,
            sender: msg.role === 'user' ? 'user' : 'bot',
            timestamp: new Date(msg.created_at),
            hasAction: msg.has_action,
          }))
          setMessages(loadedMessages)

          // Initialize bot engine with last 15 messages for context
          await initConversationFromDb()
        } else {
          // No history — show welcome message
          const welcomeMsg: Message = {
            id: 'welcome',
            text: isAIMode()
              ? `אהלן! אני **${BOT_NAME}** — ${BOT_SUBTITLE}. 😏\n\nאני מחובר ל-AI ויודע לענות על **כל** שאלה על הטיול שלכם. שאלו אותי כל דבר — מאיך לארוז עד מה לעשות ביום גשום ביוסמיטי.\n\n🔧 **חדש!** אני יכול גם **לשנות דברים באתר** — תקציב, מסלול, ועוד. נסו: "עדכן תקציב ביטוח ל-3000"`
              : `אהלן! אני **${BOT_NAME}** — יועץ טיולים ציני. 😏\n\nכרגע אני עובד במצב בסיסי (לא מחובר ל-AI). שאלו אותי על הטיול — ביטוח, תקציב, מסלול, אריזה, אטרקציות...\n\n🔧 **חדש!** אני יכול גם **לשנות דברים באתר**! נסו:\n• "עדכן תקציב ביטוח ל-3000"\n• "שנה תקציב כולל ל-60000"\n• "תוסיף עצירה ביום 5: ביקור במוזיאון"`,
            sender: 'bot',
            timestamp: new Date(),
          }
          setMessages([welcomeMsg])

          // Save welcome message to DB
          db.insertChatMessage({
            id: welcomeMsg.id,
            role: 'assistant',
            content: welcomeMsg.text,
            has_action: false,
            created_at: new Date().toISOString(),
          }).catch(() => {})

          await initConversationFromDb()
        }
      } catch (err) {
        console.warn('[Moti] Failed to load chat history:', err)
        // Fallback welcome
        setMessages([{
          id: 'welcome',
          text: `אהלן! אני **${BOT_NAME}** — ${BOT_SUBTITLE}. 😏\n\nשאלו אותי כל דבר על הטיול!`,
          sender: 'bot',
          timestamp: new Date(),
        }])
      } finally {
        if (!cancelled) setIsLoadingHistory(false)
      }
    }

    loadHistory()
    return () => { cancelled = true }
  }, [])

  const scrollToBottom = useCallback((instant = false) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' })
    }, 50)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Pipe voice transcript into input
  useEffect(() => {
    if (voice.transcript) {
      setInput(voice.transcript)
    }
  }, [voice.transcript])

  // Auto-submit when voice recognition stops and there's a transcript
  useEffect(() => {
    if (!voice.isListening && voice.transcript) {
      sendMessage(voice.transcript)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.isListening])

  // Instant scroll to bottom when history finishes loading
  useEffect(() => {
    if (!isLoadingHistory) {
      scrollToBottom(true)
    }
  }, [isLoadingHistory, scrollToBottom])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Persist user message to Supabase
    db.insertChatMessage({
      id: userMsg.id,
      role: 'user',
      content: userMsg.text,
      has_action: false,
      created_at: new Date().toISOString(),
    }).catch(() => {})

    try {
      const response = await getBotResponseAsync(text, buildMotiContext())

      // Execute any actions Moti returned
      if (response.actions.length > 0) {
        for (const action of response.actions) {
          if (action.type === 'ASK_CLARIFICATION') continue // question is in the text
          if (action.type === 'SEARCH_EMAIL') {
            // Fire email scan in background; Edge Function posts Moti notification to chat_messages
            triggerEmailScan('targeted', action.query)
              .then(() => {
                // Refresh chat messages so Moti's notification appears
                db.fetchChatMessages(200).then((history) => {
                  if (history.length > 0) {
                    setMessages(
                      history.map((msg) => ({
                        id: msg.id,
                        text: msg.content,
                        sender: msg.role === 'user' ? 'user' : 'bot',
                        timestamp: new Date(msg.created_at),
                        hasAction: msg.has_action,
                      })),
                    )
                  }
                }).catch(() => {})
              })
              .catch(() => {})
            continue
          }
          const error = executeMotiAction(action)
          if (error) {
            response.text += `\n\n⚠️ ${error}`
          }
        }
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        hasAction: response.actions.length > 0,
        card: response.card,
        quickActions: response.quickActions,
      }
      setMessages((prev) => [...prev, botMsg])

      // Persist bot message to Supabase
      db.insertChatMessage({
        id: botMsg.id,
        role: 'assistant',
        content: botMsg.text,
        has_action: response.actions.length > 0,
        created_at: new Date().toISOString(),
      }).catch(() => {})
    } catch {
      const errorMsg: Message = {
        id: `bot-${Date.now()}`,
        text: 'אוי, משהו השתבש... 😅 נסו שוב?',
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const showSuggestions = visibleMessages.length <= 1 && !isTyping

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-[calc(100dvh-8rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black/[0.06] border-t-purple-500" />
        <p className="text-sm text-apple-secondary mt-3">טוען את ההיסטוריה...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.04]">
        <BotAvatar />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-semibold text-apple-primary leading-tight">{BOT_NAME}</h1>
            <AIBadge />
          </div>
          <p className="text-[12px] text-apple-secondary">{BOT_SUBTITLE}</p>
        </div>
        <button
          onClick={() => navigate('/chat/log')}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors"
          title="יומן שינויים"
        >
          <History className="h-4 w-4" />
          {changeLog.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-bold text-white">
              {changeLog.length}
            </span>
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {hasOlderMessages && (
          <div className="flex justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[13px] font-medium text-apple-secondary hover:bg-surface-primary transition-colors"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            >
              <History className="h-3.5 w-3.5" />
              הצג הודעות ישנות ({messages.length - visibleCount} נוספות)
            </button>
          </div>
        )}
        <AnimatePresence initial={false}>
          {visibleMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`flex items-end gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse max-w-[85%] mr-0 ml-auto' : 'max-w-[85%]'
              }`}
            >
              {msg.sender === 'bot' && <BotAvatar size="sm" />}
              <div
                className={`rounded-[16px] px-4 py-3 ${
                  msg.sender === 'user'
                    ? 'bg-apple-primary text-white rounded-bl-[4px]'
                    : msg.hasAction
                      ? 'bg-gradient-to-br from-purple-50 to-white text-apple-primary rounded-br-[4px] ring-1 ring-purple-200'
                      : 'bg-white text-apple-primary rounded-br-[4px]'
                }`}
                style={
                  msg.sender === 'bot' && !msg.hasAction
                    ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
                    : msg.hasAction
                      ? { boxShadow: '0 2px 8px rgba(88,86,214,0.1)' }
                      : undefined
                }
              >
                {msg.hasAction && (
                  <div className="flex items-center gap-1 mb-1.5 text-purple-600">
                    <Zap className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">פעולה בוצעה</span>
                  </div>
                )}
                {msg.sender === 'user' ? (
                  <p className="text-[15px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                ) : (
                  <ChatMarkdown text={msg.text} />
                )}
                {msg.card && <MessageCardRenderer card={msg.card} />}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-black/5">
                    {msg.quickActions.map((qa) => (
                      <motion.button
                        key={qa}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => sendMessage(qa)}
                        className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <Zap className="h-2.5 w-2.5" />
                        {qa}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TypingIndicator />
          </motion.div>
        )}

        {/* Suggestion chips */}
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-wrap gap-2 pt-2"
          >
            {suggestions.map((s) => {
              const isAction = s.startsWith('עדכן') || s.startsWith('תוסיף') || s.startsWith('שנה')
              return (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(s)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    isAction
                      ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                      : 'border-black/[0.08] bg-white text-apple-primary hover:bg-surface-primary'
                  }`}
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                >
                  {isAction && <Zap className="h-3 w-3" />}
                  {s}
                  {!isAction && <ArrowRight className="h-3 w-3 text-apple-tertiary" />}
                </motion.button>
              )
            })}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-black/[0.04] px-4 py-3 pb-safe bg-white/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder={isTyping ? 'מוטי חושב...' : 'שאלו את מוטי או בקשו עדכון...'}
            disabled={isTyping}
            rows={1}
            className="flex-1 rounded-2xl bg-surface-primary px-4 py-2.5 text-[15px] text-apple-primary placeholder:text-apple-tertiary outline-none focus:ring-2 focus:ring-ios-blue/20 transition-shadow disabled:opacity-60 resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          {voice.isSupported && (
            <motion.button
              type="button"
              onClick={voice.toggle}
              whileTap={{ scale: 0.9 }}
              animate={voice.isListening ? { scale: [1, 1.1, 1] } : {}}
              transition={voice.isListening ? { duration: 1, repeat: Infinity } : {}}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                voice.isListening
                  ? 'bg-ios-red text-white'
                  : 'bg-surface-primary text-apple-secondary hover:bg-black/[0.06]'
              }`}
            >
              {voice.isListening ? <MicOff className="h-[18px] w-[18px]" /> : <Mic className="h-[18px] w-[18px]" />}
            </motion.button>
          )}
          <motion.button
            type="submit"
            disabled={!input.trim() || isTyping}
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-apple-primary text-white disabled:opacity-30 transition-opacity"
          >
            <Send className="h-[18px] w-[18px]" strokeWidth={2} />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
