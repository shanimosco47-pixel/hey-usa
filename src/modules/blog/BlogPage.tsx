import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Calendar,
  Tag,
  Edit3,
  Trash2,
  Save,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { getFamilyMember } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { useAppData } from '@/contexts/AppDataContext'
import type { BlogPost, FamilyMemberId } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

// Moti's writing prompt suggestions
const MOTI_PROMPTS = [
  { title: 'הנחיתה באמריקה!', starter: 'היום נחתנו בלוס אנג\'לס! הרגע שירדנו מהמטוס...', tags: 'לוס אנג\'לס, טיסה', emoji: '✈️' },
  { title: 'הרכב הראשון שלנו', starter: 'הקרוואן הזה ענק! כשנכנסנו בפעם הראשונה...', tags: 'קרוואן, התחלה', emoji: '🚐' },
  { title: 'לאס וגאס בלילה', starter: 'לאס וגאס בלילה זה משהו אחר לגמרי. האורות, הקולות...', tags: 'לאס וגאס, לילה', emoji: '🎰' },
  { title: 'פארק זאיון — ההליכה בקניון', starter: 'ההליכה דרך הקניון הצר של זאיון הייתה מדהימה. המים...', tags: 'זאיון, טיול, טבע', emoji: '🏔️' },
  { title: 'שקיעה בגרנד קניון', starter: 'עמדנו על שפת הגרנד קניון וראינו את השקיעה. הצבעים...', tags: 'גרנד קניון, שקיעה', emoji: '🌅' },
  { title: 'מה למדתי היום', starter: 'דבר מעניין שגיליתי היום בטיול...', tags: 'חוויות, למידה', emoji: '💡' },
  { title: 'הארוחה הכי טובה', starter: 'האוכל האמריקאי הוא סיפור בפני עצמו! היום אכלנו...', tags: 'אוכל, חוויות', emoji: '🍔' },
  { title: 'כוכבים במדבר', starter: 'בלילה, רחוק מכל עיר, ראינו כוכבים כמו שמעולם לא ראינו...', tags: 'מדבר, לילה, כוכבים', emoji: '🌌' },
  { title: 'גשר הזהב!', starter: 'סן פרנסיסקו! הגשר האדום המפורסם נראה בדיוק כמו בסרטים...', tags: 'סן פרנסיסקו, גשר הזהב', emoji: '🌉' },
  { title: 'היום האחרון — סיכום הטיול', starter: '20 ימים חלפו כמו רגע. מהרגע שנחתנו ב-LAX ועד...', tags: 'סיכום, זיכרונות', emoji: '🇺🇸' },
]

export default function BlogPage() {
  const { currentMember } = useAuth()
  const { blogPosts, addBlogPost, updateBlogPost, deleteBlogPost } = useAppData()
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [showPrompts, setShowPrompts] = useState(false)

  function startNewPost() {
    setSelectedPost(null)
    setEditTitle('')
    setEditContent('')
    setEditTags('')
    setShowPrompts(true)
    setIsEditing(true)
  }

  function usePrompt(prompt: typeof MOTI_PROMPTS[0]) {
    setEditTitle(prompt.title)
    setEditContent(prompt.starter)
    setEditTags(prompt.tags)
    setShowPrompts(false)
  }

  function startEditPost(post: BlogPost) {
    setSelectedPost(post)
    setEditTitle(post.title)
    setEditContent(post.content.replace(/<[^>]*>/g, ''))
    setEditTags(post.tags?.join(', ') || '')
    setIsEditing(true)
  }

  function savePost() {
    if (!editTitle.trim()) return
    const htmlContent = editContent
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => `<p>${l}</p>`)
      .join('\n')

    if (selectedPost) {
      updateBlogPost(selectedPost.id, {
        title: editTitle,
        content: htmlContent,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      })
    } else {
      addBlogPost({
        title: editTitle,
        content: htmlContent,
        author_id: (currentMember || 'aba') as FamilyMemberId,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        is_published: true,
      })
    }
    setIsEditing(false)
    setSelectedPost(null)
  }

  function deletePost(id: string) {
    deleteBlogPost(id)
    if (selectedPost?.id === id) {
      setSelectedPost(null)
      setIsEditing(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Editor view
  if (isEditing) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-sm text-apple-secondary">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </button>
          <Button onClick={savePost} variant="success">
            <Save className="h-4 w-4" />
            שמור
          </Button>
        </div>
        {/* Moti's writing prompts */}
        {!selectedPost && (
          <div className="rounded-apple-lg border border-ios-teal/20 bg-ios-teal/5 overflow-hidden">
            <button
              onClick={() => setShowPrompts((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-right"
            >
              <span className="text-lg">🤖</span>
              <span className="text-sm font-semibold text-apple-primary flex-1">מוטי מציע רעיונות לכתיבה</span>
              <Sparkles className="h-4 w-4 text-ios-teal" />
              <motion.span
                animate={{ rotate: showPrompts ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-apple-tertiary text-xs"
              >
                &#9662;
              </motion.span>
            </button>
            <AnimatePresence>
              {showPrompts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                    {MOTI_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.title}
                        onClick={() => usePrompt(prompt)}
                        className="rounded-xl bg-white/80 p-2.5 text-right shadow-sm hover:shadow-md transition-shadow border border-black/[0.04]"
                      >
                        <span className="text-lg">{prompt.emoji}</span>
                        <p className="text-xs font-semibold text-apple-primary mt-1 line-clamp-1">{prompt.title}</p>
                        <p className="text-[10px] text-apple-tertiary mt-0.5 line-clamp-1">{prompt.starter.slice(0, 40)}...</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <input
          type="text"
          placeholder="כותרת הפוסט"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full rounded-apple-lg border border-black/[0.06] glass px-4 py-3 text-lg font-bold text-apple-primary placeholder:text-apple-tertiary"
        />
        <textarea
          placeholder="כתבו את הסיפור שלכם..."
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={12}
          className="w-full rounded-apple-lg border border-black/[0.06] glass px-4 py-3 text-sm text-apple-primary placeholder:text-apple-tertiary resize-none leading-relaxed"
        />
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-apple-secondary" />
          <input
            type="text"
            placeholder="תגיות (מופרדות בפסיק)"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="flex-1 rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary"
          />
        </div>
      </div>
    )
  }

  // Reading a post
  if (selectedPost) {
    const author = getFamilyMember(selectedPost.author_id)
    return (
      <div className="space-y-4 p-4">
        <button onClick={() => setSelectedPost(null)} className="flex items-center gap-1 text-sm text-apple-secondary">
          <ArrowRight className="h-4 w-4" />
          חזרה לכל הפוסטים
        </button>
        <div className="rounded-apple-lg glass p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-apple-primary">{selectedPost.title}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-apple-secondary">
            <span>{author.avatar_emoji} {author.name}</span>
            <span>·</span>
            <span><Calendar className="ml-1 inline h-3.5 w-3.5" />{formatDate(selectedPost.created_at)}</span>
          </div>
          {selectedPost.tags && selectedPost.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedPost.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-ios-blue/10 px-2.5 py-0.5 text-xs font-medium text-ios-blue">#{tag}</span>
              ))}
            </div>
          )}
          <div
            className="mt-6 text-sm text-apple-primary leading-relaxed [&_p]:mb-3 [&_strong]:font-bold [&_ul]:mr-4 [&_ul]:list-disc [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => startEditPost(selectedPost)} variant="outline">
            <Edit3 className="h-4 w-4" />ערוך
          </Button>
          <Button onClick={() => deletePost(selectedPost.id)} variant="destructive">
            <Trash2 className="h-4 w-4" />מחק
          </Button>
        </div>
      </div>
    )
  }

  // Post list
  return (
    <div className="space-y-4 p-4">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h1 className="text-2xl font-bold text-apple-primary">
          <BookOpen className="ml-2 inline h-6 w-6" />
          יומן מסע
        </h1>
        <Button onClick={startNewPost} variant="success">
          <Plus className="h-4 w-4" />פוסט חדש
        </Button>
      </motion.div>

      {blogPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-apple-lg glass p-12 text-center shadow-sm">
          <BookOpen className="h-12 w-12 text-apple-tertiary/30" />
          <p className="mt-4 text-apple-secondary">אין פוסטים עדיין</p>
          <p className="mt-1 text-sm text-apple-tertiary">התחילו לכתוב על הטיול שלכם!</p>
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {blogPosts.map((post) => {
            const author = getFamilyMember(post.author_id)
            const excerpt = post.content.replace(/<[^>]*>/g, '').slice(0, 120)
            return (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="w-full rounded-apple-lg glass p-4 text-right shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-base font-bold text-apple-primary">{post.title}</h3>
                <p className="mt-1.5 text-sm text-apple-secondary leading-relaxed line-clamp-2">{excerpt}...</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-apple-secondary">
                    <span>{author.avatar_emoji} {author.name}</span>
                    <span>·</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-ios-blue/10 px-2 py-0.5 text-[10px] font-medium text-ios-blue">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
