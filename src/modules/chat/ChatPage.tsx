import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Send,
  ArrowRight,
  Sparkles,
  WifiOff,
  Zap,
  History,
  Mic,
  MicOff,
  MessageCircle,
  Paperclip,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  getBotResponseAsync,
  BOT_NAME,
  BOT_SUBTITLE,
  isAIMode,
  initConversationFromDb,
} from './botEngine'
import type { MessageCard } from './botEngine'
import { useAppData } from '@/contexts/AppDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { MotiAvatar } from '@/components/shared/MotiRobot'
import * as db from '@/lib/database'
import { TRIP_START_DATE } from '@/constants'
import { triggerEmailScan } from '@/lib/emailScan'
import { suggestDocumentMeta } from '@/modules/documents/utils/suggestDocumentMeta'
import { LOCATIONS } from '@/data/locations'
import { DOCUMENT_CATEGORIES } from '@/constants'
import { useCampsiteBookings } from '@/modules/campsites/hooks/useCampsiteBookings'
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
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium ${
        aiAvailable ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
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

const ChatBubble = memo(function ChatBubble({
  msg,
  onQuickAction,
}: {
  msg: Message
  onQuickAction: (text: string) => void
}) {
  return (
    <motion.div
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
            <span className="text-caption font-bold uppercase tracking-wide">פעולה בוצעה</span>
          </div>
        )}
        {msg.sender === 'user' ? (
          <p className="text-body leading-relaxed whitespace-pre-line" dir="auto">
            {msg.text}
          </p>
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
                onClick={() => onQuickAction(qa)}
                className="flex items-center gap-1 rounded-full border border-ios-purple/20 bg-ios-purple/10 px-2.5 py-1 text-caption font-medium text-ios-purple hover:bg-ios-purple/20 transition-colors"
              >
                <Zap className="h-2.5 w-2.5" />
                {qa}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
})

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
  const {
    executeMotiAction,
    buildMotiContext,
    changeLog,
    tasks,
    packingItems,
    expenses,
    budgetSettings,
  } = useAppData()
  const { currentMember } = useAuth()
  const navigate = useNavigate()
  const { bookings, updateBooking } = useCampsiteBookings()

  const tasksTotal = tasks.length
  const tasksDone = tasks.filter((t) => t.status === 'done').length
  const packedCount = packingItems.filter((p) => p.is_packed).length
  const packingPercent =
    packingItems.length > 0 ? Math.round((packedCount / packingItems.length) * 100) : 0
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const budgetPercent =
    budgetSettings.total_budget > 0
      ? Math.round((totalSpent / budgetSettings.total_budget) * 100)
      : 0
  const daysUntilTrip = Math.max(
    0,
    Math.ceil((new Date(TRIP_START_DATE).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )

  const suggestions = useMemo(
    () =>
      getSmartSuggestions({
        tasksTotal,
        tasksDone,
        packingPercent,
        budgetPercent,
        daysUntilTrip,
      }),
    [tasksTotal, tasksDone, packingPercent, budgetPercent, daysUntilTrip],
  )

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
        setMessages([
          {
            id: 'welcome',
            text: `אהלן! אני **${BOT_NAME}** — ${BOT_SUBTITLE}. 😏\n\nשאלו אותי כל דבר על הטיול!`,
            sender: 'bot',
            timestamp: new Date(),
          },
        ])
      } finally {
        if (!cancelled) setIsLoadingHistory(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
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

  /**
   * Detect if pasted text is a booking confirmation email.
   * Handles multiple formats: Xanterra (Yellowstone), Recreation.gov, Booking.com, etc.
   * Returns parsed data or null.
   */
  const parseBookingConfirmation = useCallback(
    (text: string) => {
      const MONTH_NAMES: Record<string, string> = {
        jan: '01',
        january: '01',
        feb: '02',
        february: '02',
        mar: '03',
        march: '03',
        apr: '04',
        april: '04',
        may: '05',
        jun: '06',
        june: '06',
        jul: '07',
        july: '07',
        aug: '08',
        august: '08',
        sep: '09',
        sept: '09',
        september: '09',
        oct: '10',
        october: '10',
        nov: '11',
        november: '11',
        dec: '12',
        december: '12',
      }

      /** Parse "Sep 18, 2026" or "September 5, 2026" → "2026-09-18" */
      function parseMonthDate(str: string): string | undefined {
        const m = str.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/)
        if (!m) return undefined
        const monthNum = MONTH_NAMES[m[1].toLowerCase()]
        if (!monthNum) return undefined
        return `${m[3]}-${monthNum}-${m[2].padStart(2, '0')}`
      }

      /** Parse "9/18/2026" → "2026-09-18" */
      function parseSlashDate(str: string): string | undefined {
        const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
        if (!m) return undefined
        return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
      }

      // Must contain confirmation/reservation keywords
      const hasConfirmationKeywords =
        /(?:confirmation|itinerary\s*#|reservation\s*(?:status|total|details|confirmation)|check.?in|check.?out|your\s+reservation)/i.test(
          text,
        )
      // Must contain dates in some format
      const hasDatePattern =
        /\d{1,2}\/\d{1,2}\/\d{4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{4}/i.test(
          text,
        )

      if (!hasConfirmationKeywords || !hasDatePattern) return null

      // ── Extract confirmation/reservation number ──
      // Matches: "Itinerary # 20452131", "reservation 0853039963-1", "Confirmation #ABC123"
      const confMatch = text.match(/(?:itinerary|confirmation|reservation)\s*#?\s*([\d][\d-]{4,})/i)
      const confirmationNum = confMatch ? confMatch[1] : undefined

      // ── Collect all dates in the text ──
      const allDates: { date: string; index: number }[] = []
      // Slash format: 9/12/2026
      for (const m of text.matchAll(/(\d{1,2}\/\d{1,2}\/\d{4})/gi)) {
        const d = parseSlashDate(m[1])
        if (d) allDates.push({ date: d, index: m.index! })
      }
      // Month name format: Sep 18, 2026
      for (const m of text.matchAll(
        /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{4})/gi,
      )) {
        const d = parseMonthDate(m[1])
        if (d) allDates.push({ date: d, index: m.index! })
      }
      allDates.sort((a, b) => a.index - b.index)

      // Find check-in: first date that's Sep 2026
      let checkIn: string | undefined
      let checkOut: string | undefined
      const tripDates = allDates.filter((d) => d.date.startsWith('2026-09'))
      if (tripDates.length >= 2) {
        checkIn = tripDates[0].date
        checkOut = tripDates[1].date
      } else if (tripDates.length === 1) {
        checkIn = tripDates[0].date
      }

      // ── Extract cost ──
      // "Reservation Total $51.51" or "refund of $20.00"
      const costMatch = text.match(
        /(?:reservation\s+total|lodging\s+total|order\s+total|total\s+cost)[^$]*\$(\d+(?:\.\d{2})?)/i,
      )
      const cost = costMatch ? parseFloat(costMatch[1]) : undefined

      // ── Extract cancellation deadline ──
      let cancellationDeadline: string | undefined
      // "cancelled after Saturday September 5, 2026"
      const cancelAfter = text.match(
        /cancell?(?:ed|ation)\s+(?:after|on\s+or\s+after)\s+\w+,?\s+(\w+\s+\d{1,2},?\s*\d{4})/i,
      )
      if (cancelAfter) cancellationDeadline = parseMonthDate(cancelAfter[1])
      // "cancel on or before Wed, Sep 16, 2026" → deadline is that date
      if (!cancellationDeadline) {
        const cancelBefore = text.match(
          /cancel[^]*?on\s+or\s+before\s+\w+,?\s+(\w+\s+\d{1,2},?\s*\d{4})/i,
        )
        if (cancelBefore) cancellationDeadline = parseMonthDate(cancelBefore[1])
      }

      // ── Extract cancellation refund amount ──
      const refundMatch = text.match(/(?:refund|penalty)[^$]*\$(\d+(?:\.\d{2})?)/i)
      const refundAmount = refundMatch ? parseFloat(refundMatch[1]) : undefined

      // ── Extract location/campground name ──
      const campgroundPatterns = [
        /(?:north|south|canyon|madison|grant|bridge bay|mammoth|tower|indian creek|pebble creek|slough creek|norris|lewis lake|watchman|lava point|upper pines|lower pines|north pines|crane flat|hodgdon meadow|wawona|bridalveil creek)\s*(?:campground|camp)?/i,
      ]
      let locationName: string | undefined
      for (const pat of campgroundPatterns) {
        const m = text.match(pat)
        if (m) {
          locationName = m[0].trim()
          break
        }
      }
      // Also try the first prominent name in the email (e.g., "North Campground (UT)")
      if (!locationName) {
        const namedCamp = text.match(
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:campground|camp|lodge)/i,
        )
        if (namedCamp) locationName = namedCamp[0].trim()
      }

      // ── Detect park/area ──
      const isYellowstone = /yellowstone/i.test(text)
      const isYosemite = /yosemite/i.test(text)
      const isZion = /zion/i.test(text)
      const isBryce = /bryce/i.test(text)
      const isGrandTeton = /grand\s*teton|jenny\s*lake|colter\s*bay|gros\s*ventre/i.test(text)
      const isLasVegas = /las\s*vegas/i.test(text)
      const isMammoth = /mammoth\s*lakes/i.test(text)
      const isDenver = /denver/i.test(text)
      const isSF = /san\s*francisco|oakland|marin/i.test(text)
      const area = isYellowstone
        ? 'Yellowstone NP'
        : isYosemite
          ? 'Yosemite NP'
          : isZion
            ? 'Zion NP'
            : isBryce
              ? 'Bryce Canyon'
              : isGrandTeton
                ? 'Grand Teton'
                : isLasVegas
                  ? 'Las Vegas'
                  : isMammoth
                    ? 'Mammoth Lakes'
                    : isDenver
                      ? 'Denver'
                      : isSF
                        ? 'San Francisco'
                        : undefined

      // ── Detect accommodation type ──
      const isRV = /\brv\b|camper|motorhome|recreational\s+vehicle/i.test(text)
      const isCamp = /campground|camping|campsite/i.test(text)
      const type = isRV || isCamp ? 'campground' : 'hotel'

      if (!checkIn) return null

      // Try to match to existing booking by date
      const matchingBooking = bookings.find(
        (b) =>
          b.check_in === checkIn &&
          b.priority === 'primary' &&
          (b.status === 'not_open' || b.status === 'pending' || b.status === 'waitlist'),
      )

      return {
        confirmationNum,
        checkIn,
        checkOut,
        cost,
        cancellationDeadline,
        refundAmount,
        locationName,
        area,
        type: type as 'rv_park' | 'campground' | 'hotel',
        matchingBooking,
      }
    },
    [bookings],
  )

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    // ── Check for pasted booking confirmation ──
    const booking = parseBookingConfirmation(text)
    if (booking) {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        text: text.length > 200 ? text.slice(0, 200) + '...' : text,
        sender: 'user',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      // Persist user message
      db.insertChatMessage({
        id: userMsg.id,
        role: 'user',
        content: userMsg.text,
        has_action: false,
        created_at: new Date().toISOString(),
      }).catch(() => {})

      await new Promise((r) => setTimeout(r, 1000))

      const parts: string[] = ['🔍 זיהיתי אישור הזמנה!', '']

      // Update existing booking if found
      if (booking.matchingBooking) {
        const updates: Record<string, unknown> = { status: 'confirmed' }
        if (booking.confirmationNum) updates.confirmation = `#${booking.confirmationNum}`
        if (booking.cost) updates.cost = booking.cost
        if (booking.cancellationDeadline)
          updates.cancellation_deadline = booking.cancellationDeadline
        if (booking.refundAmount !== undefined) updates.refund_amount = booking.refundAmount
        if (booking.locationName) updates.location = booking.locationName

        updateBooking(booking.matchingBooking.id, updates)

        parts.push(`✅ עדכנתי את **${booking.matchingBooking.location}** לסטטוס **מאושר**`)
        if (booking.confirmationNum) parts.push(`🔖 מספר אישור: **#${booking.confirmationNum}**`)
        if (booking.cost) parts.push(`💰 עלות: **$${booking.cost}**`)
        if (booking.cancellationDeadline) {
          const d = new Date(booking.cancellationDeadline + 'T00:00:00')
          parts.push(`⏰ ביטול עד: **${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}**`)
        }
        if (booking.checkIn && booking.checkOut) {
          const inD = new Date(booking.checkIn + 'T00:00:00')
          const outD = new Date(booking.checkOut + 'T00:00:00')
          parts.push(`📅 ${inD.getDate()} — ${outD.getDate()} ספטמבר`)
        }
      } else {
        parts.push('⚠️ לא מצאתי הזמנה קיימת שתואמת לתאריך הזה.')
        if (booking.locationName) parts.push(`📍 מיקום: **${booking.locationName}**`)
        if (booking.checkIn) parts.push(`📅 צ׳ק-אין: **${booking.checkIn}**`)
        if (booking.confirmationNum) parts.push(`🔖 אישור: **#${booking.confirmationNum}**`)
      }

      // Also create a document
      const locationId = booking.area?.includes('Yellowstone')
        ? 'yellowstone'
        : booking.area?.includes('Yosemite')
          ? 'yosemite'
          : booking.area?.includes('Zion')
            ? 'zion'
            : booking.area?.includes('Bryce')
              ? 'bryce-canyon'
              : undefined

      executeMotiAction({
        type: 'ADD_DOCUMENT',
        document: {
          title: `אישור הזמנה — ${booking.locationName || booking.area || 'לינה'}`,
          category: 'accommodation',
          locationId,
          notes: booking.confirmationNum
            ? `Confirmation #${booking.confirmationNum}`
            : 'אישור הזמנה מהמייל',
          status: 'reserved',
          visit_date: booking.checkIn,
        },
      })
      parts.push('')
      parts.push('📄 שמרתי גם כמסמך בדף המסמכים.')

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        text: parts.join('\n'),
        sender: 'bot',
        timestamp: new Date(),
        hasAction: true,
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)

      db.insertChatMessage({
        id: botMsg.id,
        role: 'assistant',
        content: botMsg.text,
        has_action: true,
        created_at: new Date().toISOString(),
      }).catch(() => {})
      return
    }

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
      // Build context with campsite bookings included
      const bookingsSummary = bookings
        .filter((b) => b.priority === 'primary')
        .map(
          (b) =>
            `  ${b.check_in} — ${b.location} (${b.area}) — ${b.status === 'confirmed' ? '✅ מאושר' : b.status === 'not_open' ? '❌ לא הוזמן' : b.status}${b.confirmation ? ` #${b.confirmation}` : ''}`,
        )
        .join('\n')
      const fullContext =
        buildMotiContext() +
        '\n\n## הזמנות לינה\n' +
        bookingsSummary +
        '\n\nאם משתמש שולח אישור הזמנה — השתמש ב-add_document כדי לשמור אותו. חלץ מספר אישור, תאריכים, עלות, מיקום.'

      const response = await getBotResponseAsync(text, fullContext, currentMember || undefined)

      // Execute any actions Moti returned
      if (response.actions.length > 0) {
        for (const action of response.actions) {
          if (action.type === 'ASK_CLARIFICATION') continue // question is in the text
          if (action.type === 'SEARCH_EMAIL') {
            // Fire email scan in background; Edge Function posts Moti notification to chat_messages
            triggerEmailScan('targeted', action.query)
              .then(() => {
                // Refresh chat messages so Moti's notification appears
                db.fetchChatMessages(200)
                  .then((history) => {
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
                  })
                  .catch(() => {})
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

  // Stable ref for sendMessage so memoized ChatBubble doesn't re-render
  const sendMessageRef = useRef(sendMessage)
  sendMessageRef.current = sendMessage
  const stableSendMessage = useCallback((text: string) => sendMessageRef.current(text), [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      // Reset input so the same file can be re-selected
      e.target.value = ''

      const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
      const meta = suggestDocumentMeta(title)
      const category = meta.category || 'other'
      const locationId = meta.locationId || undefined
      const locationDef = locationId ? LOCATIONS.find((l) => l.id === locationId) : undefined
      const categoryLabel = DOCUMENT_CATEGORIES[category]?.label || category

      // Read file as data URL for storage
      const fileUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      // Show user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        text: `📎 העלאת מסמך: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      // Create document via MotiAction
      const docAction = {
        type: 'ADD_DOCUMENT' as const,
        document: {
          title,
          category,
          locationId: locationId || undefined,
          file_url: fileUrl,
          file_type: file.type,
          file_size: file.size,
          notes: `הועלה דרך מוטי`,
        },
      }
      executeMotiAction(docAction)

      // Build Moti's response
      const parts: string[] = [`📄 שמרתי את המסמך **"${title}"**`]
      parts.push(`📂 קטגוריה: **${categoryLabel}**`)
      if (locationDef) {
        parts.push(`📍 קישרתי ליעד: **${locationDef.emoji} ${locationDef.nameHe}**`)
      }
      parts.push('')
      parts.push('אפשר למצוא אותו בדף המסמכים. רוצים שאקשר אותו למשהו נוסף? 😊')

      // Short delay for natural feel
      await new Promise((r) => setTimeout(r, 800))

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        text: parts.join('\n'),
        sender: 'bot',
        timestamp: new Date(),
        hasAction: true,
        quickActions: locationDef ? undefined : ['קשר ליעד', 'זה אישור לינה', 'זה כרטיס טיסה'],
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)

      // Persist messages
      db.insertChatMessage({
        id: userMsg.id,
        role: 'user',
        content: userMsg.text,
        has_action: false,
        created_at: new Date().toISOString(),
      }).catch(() => {})
      db.insertChatMessage({
        id: botMsg.id,
        role: 'assistant',
        content: botMsg.text,
        has_action: true,
        created_at: new Date().toISOString(),
      }).catch(() => {})
    },
    [executeMotiAction],
  )

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
            <h2 className="text-headline font-semibold text-apple-primary leading-tight">
              {BOT_NAME}
            </h2>
            <AIBadge />
          </div>
          <p className="text-subhead text-apple-secondary">{BOT_SUBTITLE}</p>
        </div>
        <button
          onClick={() => navigate('/chat/log')}
          className="relative flex h-9 w-9 items-center justify-center rounded-apple bg-ios-purple/10 text-ios-purple hover:bg-ios-purple/20 transition-colors"
          title="יומן שינויים"
        >
          <History className="h-4 w-4" />
          {changeLog.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-500 px-1 text-caption font-bold text-white">
              {changeLog.length}
            </span>
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isTyping && (
          <EmptyState
            icon={MessageCircle}
            title="היי! אני מוטי"
            description="שאלו אותי כל דבר על הטיול"
          />
        )}
        {hasOlderMessages && (
          <div className="flex justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-subhead font-medium text-apple-secondary hover:bg-surface-primary transition-colors"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            >
              <History className="h-3.5 w-3.5" />
              הצג הודעות ישנות ({messages.length - visibleCount} נוספות)
            </button>
          </div>
        )}
        <AnimatePresence initial={false}>
          {visibleMessages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} onQuickAction={stableSendMessage} />
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
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
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-subhead font-medium transition-colors ${
                    isAction
                      ? 'border-ios-purple/20 bg-ios-purple/10 text-ios-purple hover:bg-ios-purple/20'
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-primary text-apple-secondary hover:bg-black/[0.06] transition-colors"
            aria-label="העלאת מסמך"
          >
            <Paperclip className="h-[18px] w-[18px]" />
          </motion.button>
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
            dir="auto"
            className="flex-1 rounded-2xl bg-surface-primary px-4 py-2.5 text-body text-apple-primary placeholder:text-apple-tertiary outline-none focus:ring-2 focus:ring-ios-blue/20 transition-shadow disabled:opacity-60 resize-none max-h-32 overflow-y-auto"
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
              {voice.isListening ? (
                <MicOff className="h-[18px] w-[18px]" />
              ) : (
                <Mic className="h-[18px] w-[18px]" />
              )}
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
