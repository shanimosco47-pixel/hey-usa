import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, ArrowRight, Sparkles, WifiOff, Zap, History } from 'lucide-react'
import { getBotResponseAsync, BOT_NAME, BOT_SUBTITLE, isAIMode, initConversationFromDb } from './botEngine'
import { useAppData } from '@/contexts/AppDataContext'
import * as db from '@/lib/database'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  hasAction?: boolean
}

const SUGGESTIONS = [
  'מה הדבר הכי חשוב לסגור לפני הטיול?',
  'תכנן לי יום מושלם בלאס וגאס עם ילדים',
  'מה התקציב שלנו?',
  'עדכן תקציב ביטוח ל-3000',
  'מה המסלול המלא?',
  'תוסיף עצירה ביום 5: ביקור במוזיאון',
]

function BotAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const px = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <div
      className={`${px} rounded-full flex items-center justify-center shrink-0`}
      style={{
        background: 'linear-gradient(145deg, #1d1d1f, #3a3a3c)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <Bot className="h-5 w-5 text-white/90" strokeWidth={1.8} />
    </div>
  )
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

export default function ChatPage() {
  const { executeMotiAction, changeLog } = useAppData()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

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
      const response = await getBotResponseAsync(text)

      // Execute any actions Moti returned
      if (response.actions.length > 0) {
        for (const action of response.actions) {
          executeMotiAction(action)
        }
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        hasAction: response.actions.length > 0,
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

  const showSuggestions = messages.length <= 1 && !isTyping

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
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
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
                <p
                  className="text-[15px] leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
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
            {SUGGESTIONS.map((s) => {
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isTyping ? 'מוטי חושב...' : 'שאלו את מוטי או בקשו עדכון...'}
            disabled={isTyping}
            className="flex-1 rounded-full bg-surface-primary px-4 py-2.5 text-[15px] text-apple-primary placeholder:text-apple-tertiary outline-none focus:ring-2 focus:ring-ios-blue/20 transition-shadow disabled:opacity-60"
          />
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
