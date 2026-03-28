import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote } from 'lucide-react'
import { cn } from '@/lib/cn'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive: boolean
  children: React.ReactNode
  title: string
}

function ToolbarButton({ onClick, isActive, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-apple-sm p-1.5 transition-colors',
        isActive
          ? 'bg-ios-blue/15 text-ios-blue'
          : 'text-apple-secondary hover:bg-black/[0.04] hover:text-apple-primary dark:hover:bg-white/[0.08]',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'w-full px-4 py-3 text-sm text-apple-primary leading-relaxed min-h-[16rem] outline-none [&_p]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:mr-4 [&_ul]:list-disc [&_ol]:mr-4 [&_ol]:list-decimal [&_li]:mb-1 [&_blockquote]:border-r-2 [&_blockquote]:border-ios-blue/30 [&_blockquote]:pr-3 [&_blockquote]:text-apple-secondary [&_blockquote]:italic',
      },
    },
  })

  // Sync external content changes (e.g. when a prompt is selected)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="w-full rounded-apple-lg border border-black/[0.06] dark:border-white/[0.1] glass overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-black/[0.06] dark:border-white/[0.1] px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-black/[0.08] dark:bg-white/[0.1]" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-black/[0.08] dark:bg-white/[0.1]" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-black/[0.08] dark:bg-white/[0.1]" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className="prose-sm max-w-none" />
    </div>
  )
}
