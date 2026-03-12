import { useState } from 'react'
import {
  BookOpen,
  Plus,
  Calendar,
  Tag,
  Edit3,
  Trash2,
  Save,
  ArrowRight,
} from 'lucide-react'
import { getFamilyMember } from '@/lib/constants'
import { SAMPLE_BLOG_POSTS } from './data/samplePosts'
import type { BlogPost, FamilyMemberId } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

export default function BlogPage() {
  const { currentMember } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>(SAMPLE_BLOG_POSTS)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')

  function startNewPost() {
    setSelectedPost(null)
    setEditTitle('')
    setEditContent('')
    setEditTags('')
    setIsEditing(true)
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
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id
            ? {
                ...p,
                title: editTitle,
                content: htmlContent,
                tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
                updated_at: new Date().toISOString(),
              }
            : p,
        ),
      )
    } else {
      const newPost: BlogPost = {
        id: `post-${Date.now()}`,
        title: editTitle,
        content: htmlContent,
        author_id: (currentMember || 'aba') as FamilyMemberId,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setPosts((prev) => [newPost, ...prev])
    }
    setIsEditing(false)
    setSelectedPost(null)
  }

  function deletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
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
          <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-sm text-brown-light">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </button>
          <button onClick={savePost} className="flex items-center gap-1.5 rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white">
            <Save className="h-4 w-4" />
            שמור
          </button>
        </div>
        <input
          type="text"
          placeholder="כותרת הפוסט"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full rounded-2xl border border-sand-dark bg-white/80 px-4 py-3 text-lg font-bold text-brown placeholder:text-brown-light/50"
        />
        <textarea
          placeholder="כתבו את הסיפור שלכם..."
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={12}
          className="w-full rounded-2xl border border-sand-dark bg-white/80 px-4 py-3 text-sm text-brown placeholder:text-brown-light/50 resize-none leading-relaxed"
        />
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-brown-light" />
          <input
            type="text"
            placeholder="תגיות (מופרדות בפסיק)"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="flex-1 rounded-xl border border-sand-dark bg-white/80 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50"
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
        <button onClick={() => setSelectedPost(null)} className="flex items-center gap-1 text-sm text-brown-light">
          <ArrowRight className="h-4 w-4" />
          חזרה לכל הפוסטים
        </button>
        <div className="rounded-2xl bg-white/80 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-brown">{selectedPost.title}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-brown-light">
            <span>{author.avatar_emoji} {author.name}</span>
            <span>·</span>
            <span><Calendar className="ml-1 inline h-3.5 w-3.5" />{formatDate(selectedPost.created_at)}</span>
          </div>
          {selectedPost.tags && selectedPost.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedPost.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sky/10 px-2.5 py-0.5 text-xs font-medium text-sky">#{tag}</span>
              ))}
            </div>
          )}
          <div
            className="mt-6 text-sm text-brown leading-relaxed [&_p]:mb-3 [&_strong]:font-bold [&_ul]:mr-4 [&_ul]:list-disc [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => startEditPost(selectedPost)} className="flex items-center gap-1.5 rounded-xl bg-sky/10 px-4 py-2 text-sm font-medium text-sky">
            <Edit3 className="h-4 w-4" />ערוך
          </button>
          <button onClick={() => deletePost(selectedPost.id)} className="flex items-center gap-1.5 rounded-xl bg-terracotta/10 px-4 py-2 text-sm font-medium text-terracotta">
            <Trash2 className="h-4 w-4" />מחק
          </button>
        </div>
      </div>
    )
  }

  // Post list
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brown">
          <BookOpen className="ml-2 inline h-6 w-6" />
          יומן מסע
        </h1>
        <button onClick={startNewPost} className="flex items-center gap-1.5 rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white">
          <Plus className="h-4 w-4" />פוסט חדש
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/80 p-12 text-center shadow-sm">
          <BookOpen className="h-12 w-12 text-brown-light/30" />
          <p className="mt-4 text-brown-light">אין פוסטים עדיין</p>
          <p className="mt-1 text-sm text-brown-light/70">התחילו לכתוב על הטיול שלכם!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const author = getFamilyMember(post.author_id)
            const excerpt = post.content.replace(/<[^>]*>/g, '').slice(0, 120)
            return (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="w-full rounded-2xl bg-white/80 p-4 text-right shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-base font-bold text-brown">{post.title}</h3>
                <p className="mt-1.5 text-sm text-brown-light leading-relaxed line-clamp-2">{excerpt}...</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-brown-light">
                    <span>{author.avatar_emoji} {author.name}</span>
                    <span>·</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-sky/10 px-2 py-0.5 text-[10px] font-medium text-sky">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
