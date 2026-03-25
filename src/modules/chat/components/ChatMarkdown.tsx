import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'dompurify'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: ({ children }) => <h1 className="text-headline font-semibold mb-1 mt-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-headline font-semibold mb-1 mt-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-body font-semibold mb-0.5 mt-1.5">{children}</h3>,
  p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pr-4 mb-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pr-4 mb-1.5 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ios-blue underline">
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <pre dir="ltr" className="bg-surface-primary rounded-apple-sm p-2 my-1.5 overflow-x-auto text-[13px]">
          <code>{children}</code>
        </pre>
      )
    }
    return (
      <code dir="ltr" className="bg-surface-primary rounded-apple-sm px-1 py-0.5 text-[13px]">
        {children}
      </code>
    )
  },
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-r-2 border-ios-blue/30 pr-3 my-1.5 text-apple-secondary">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-1.5">
      <table className="w-full text-[13px] border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-start border-b border-black/10 pb-1 pr-2 font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-black/5 py-1 pr-2">{children}</td>
  ),
  hr: () => <hr className="my-2 border-black/10" />,
}

interface ChatMarkdownProps {
  text: string
  className?: string
}

export function ChatMarkdown({ text, className }: ChatMarkdownProps) {
  const sanitized = DOMPurify.sanitize(text)
  return (
    <div className={`text-[15px] leading-relaxed ${className || ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {sanitized}
      </ReactMarkdown>
    </div>
  )
}
