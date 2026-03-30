import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import type { Task } from '@/lib/types'

interface AttentionItem {
  task: Task
  reason: string
  color: string
}

interface AttentionItemsProps {
  items: AttentionItem[]
}

export function AttentionItems({ items }: AttentionItemsProps) {
  if (items.length === 0) return null

  return (
    <div
      className="rounded-apple-lg overflow-hidden"
      style={{
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
        background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%)',
        borderInlineStart: '4px solid #FF9500',
      }}
    >
      <div className="px-4 pt-3.5 pb-1 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-apple-sm bg-ios-orange/10">
          <AlertTriangle className="h-4 w-4 text-ios-orange" strokeWidth={2.2} />
        </div>
        <h3 className="text-body font-bold text-passport-slate">דורש תשומת לב</h3>
        <span className="ms-auto text-caption font-semibold rounded-full px-2 py-0.5 bg-ios-orange/10 text-ios-orange">
          {items.length}
        </span>
      </div>
      <div className="px-4 pb-3 pt-1">
        {items.map((item, i) => (
          <Link to="/tasks" key={item.task.id}>
            <div
              className={`flex items-center gap-2.5 py-2 ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span
                className="shrink-0 text-caption font-bold rounded-full px-2 py-0.5 text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.reason}
              </span>
              <span className="text-subhead text-passport-slate truncate flex-1">
                {item.task.title}
              </span>
              {item.task.due_date && (
                <span className="text-caption text-apple-secondary shrink-0 font-medium tabular-nums">
                  {new Date(item.task.due_date + 'T00:00:00').toLocaleDateString('he-IL', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
