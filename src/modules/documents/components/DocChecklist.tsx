import { useAppData } from '@/contexts/AppDataContext'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ChecklistItem {
  category: string
  label: string
  required: boolean
  description: string
}

const REQUIRED_DOCS: ChecklistItem[] = [
  { category: 'passport', label: 'דרכונים', required: true, description: '5 דרכונים בתוקף' },
  { category: 'visa', label: 'ESTA', required: true, description: 'אישור כניסה לארה"ב לכל בני המשפחה' },
  { category: 'insurance', label: 'ביטוח נסיעות', required: true, description: 'ביטוח מקיף לכל המשפחה' },
  { category: 'flights', label: 'טיסות', required: true, description: 'כרטיסי טיסה הלוך וחזור' },
  { category: 'car_rental', label: 'השכרת רכב', required: true, description: 'אישור הזמנת קרוואן/רכב' },
  { category: 'accommodation', label: 'לינה', required: false, description: 'הזמנות מלונות ו-Airbnb' },
  { category: 'attractions', label: 'אטרקציות', required: false, description: 'הזמנות לאטרקציות ופארקים' },
  { category: 'medical', label: 'רפואי', required: false, description: 'מרשמים, ביטוח רפואי' },
]

export function DocChecklist() {
  const { documents } = useAppData()

  const checklist = REQUIRED_DOCS.map((item) => {
    const docs = documents.filter((d) => d.category === item.category)
    const hasDoc = docs.length > 0
    return { ...item, hasDoc, count: docs.length }
  })

  const completedCount = checklist.filter((c) => c.hasDoc).length

  return (
    <div className="glass rounded-apple-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-headline text-apple-primary">רשימת מסמכים</h3>
        <span className="text-caption text-apple-secondary">
          {completedCount}/{checklist.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {checklist.map((item) => (
          <div key={item.category} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                item.hasDoc ? 'bg-ios-green/10' : 'bg-black/[0.04]',
              )}
            >
              {item.hasDoc ? (
                <Check className="h-4 w-4 text-ios-green" />
              ) : (
                <Circle className="h-4 w-4 text-apple-tertiary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('text-body', item.hasDoc ? 'text-apple-primary' : 'text-apple-secondary')}>
                  {item.label}
                </span>
                {item.required && !item.hasDoc && (
                  <span className="text-caption text-ios-red">חובה</span>
                )}
                {item.count > 0 && (
                  <span className="text-caption text-apple-secondary">({item.count})</span>
                )}
              </div>
              <p className="text-caption text-apple-tertiary">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
