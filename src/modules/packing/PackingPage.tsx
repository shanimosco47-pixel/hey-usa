import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Plus,
  Check,
  Shirt,
  Droplets,
  Smartphone,
  FileText,
  Pill,
  Gamepad2,
  Cookie,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { PACKING_CATEGORIES, FAMILY_MEMBERS, getFamilyMember } from '@/lib/constants'
import { SAMPLE_PACKING_ITEMS } from './data/samplePacking'
import type { PackingItem, FamilyMemberId } from '@/lib/types'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  clothing: Shirt,
  toiletries: Droplets,
  electronics: Smartphone,
  documents: FileText,
  medicine: Pill,
  entertainment: Gamepad2,
  snacks: Cookie,
  other: MoreHorizontal,
}

export default function PackingPage() {
  const [items, setItems] = useState<PackingItem[]>(SAMPLE_PACKING_ITEMS)
  const [filterMember, setFilterMember] = useState<FamilyMemberId | 'all'>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(PACKING_CATEGORIES)),
  )
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'clothing',
    assigned_to: 'aba' as FamilyMemberId,
    quantity: 1,
  })

  const filtered = useMemo(
    () =>
      filterMember === 'all'
        ? items
        : items.filter((i) => i.assigned_to === filterMember),
    [items, filterMember],
  )

  const totalItems = filtered.length
  const packedItems = filtered.filter((i) => i.is_packed).length
  const packedPercent = totalItems > 0 ? (packedItems / totalItems) * 100 : 0

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, PackingItem[]> = {}
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  }, [filtered])

  function togglePacked(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_packed: !item.is_packed } : item,
      ),
    )
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function handleAddItem() {
    if (!newItem.name) return
    const item: PackingItem = {
      id: `p-${Date.now()}`,
      name: newItem.name,
      category: newItem.category,
      assigned_to: newItem.assigned_to,
      is_packed: false,
      quantity: newItem.quantity,
    }
    setItems((prev) => [...prev, item])
    setNewItem({ name: '', category: 'clothing', assigned_to: 'aba', quantity: 1 })
    setShowAddForm(false)
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h1 className="text-2xl font-bold text-apple-primary">אריזה</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="success">
          <Plus className="h-4 w-4" />
          פריט חדש
        </Button>
      </motion.div>

      {/* Progress */}
      <div className="glass rounded-apple-lg p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-apple-secondary">
            <Package className="ml-1 inline h-4 w-4" />
            {packedItems} מתוך {totalItems} ארוזים
          </span>
          <span className={cn('font-bold', packedPercent === 100 ? 'text-ios-green' : 'text-apple-primary')}>
            {packedPercent.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/[0.04]">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              packedPercent === 100 ? 'bg-ios-green' : 'bg-ios-teal',
            )}
            style={{ width: `${packedPercent}%` }}
          />
        </div>
      </div>

      {/* Family Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-apple-secondary" />
        <button
          onClick={() => setFilterMember('all')}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            filterMember === 'all'
              ? 'bg-apple-primary text-white'
              : 'glass text-apple-secondary',
          )}
        >
          כולם
        </button>
        {FAMILY_MEMBERS.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilterMember(m.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filterMember === m.id
                ? 'bg-apple-primary text-white'
                : 'glass text-apple-secondary',
            )}
          >
            {m.avatar_emoji} {m.name}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass rounded-apple-lg p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-apple-primary">פריט חדש</h3>
          <input
            type="text"
            placeholder="שם הפריט"
            value={newItem.name}
            onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newItem.category}
              onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
              className="rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary"
            >
              {Object.entries(PACKING_CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={newItem.assigned_to}
              onChange={(e) => setNewItem((p) => ({ ...p, assigned_to: e.target.value as FamilyMemberId }))}
              className="rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary"
            >
              {FAMILY_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.avatar_emoji} {m.name}</option>
              ))}
            </select>
          </div>
          <input
            type="number"
            min={1}
            placeholder="כמות"
            value={newItem.quantity}
            onChange={(e) => setNewItem((p) => ({ ...p, quantity: Number(e.target.value) }))}
            className="w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary"
          />
          <div className="flex gap-2">
            <Button onClick={handleAddItem} variant="success" className="flex-1">
              הוסף
            </Button>
            <Button onClick={() => setShowAddForm(false)} variant="secondary">
              ביטול
            </Button>
          </div>
        </div>
      )}

      {/* Category Groups */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {Object.entries(PACKING_CATEGORIES).map(([catKey, { label }]) => {
          const catItems = groupedByCategory[catKey]
          if (!catItems || catItems.length === 0) return null
          const isExpanded = expandedCategories.has(catKey)
          const catPacked = catItems.filter((i) => i.is_packed).length
          const IconComp = CATEGORY_ICONS[catKey] || Package

          return (
            <div key={catKey} className="glass rounded-apple-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(catKey)}
                className="flex w-full items-center gap-3 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04]">
                  <IconComp className="h-4 w-4 text-apple-secondary" />
                </div>
                <span className="flex-1 text-right text-sm font-bold text-apple-primary">{label}</span>
                <span className="text-xs text-apple-secondary">
                  {catPacked}/{catItems.length}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-apple-secondary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-apple-secondary" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-black/[0.06] px-3 pb-2">
                  {catItems.map((item) => {
                    const member = getFamilyMember(item.assigned_to)
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2 border-b border-black/[0.04] last:border-0"
                      >
                        <button
                          onClick={() => togglePacked(item.id)}
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                            item.is_packed
                              ? 'border-ios-green bg-ios-green text-white'
                              : 'border-apple-tertiary/30 bg-transparent',
                          )}
                        >
                          {item.is_packed && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm',
                              item.is_packed ? 'text-apple-secondary line-through' : 'text-apple-primary',
                            )}
                          >
                            {item.name}
                            {item.quantity > 1 && (
                              <span className="mr-1 text-xs text-apple-secondary">×{item.quantity}</span>
                            )}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-apple-tertiary">{item.notes}</p>
                          )}
                        </div>
                        <span className="text-xs" title={member.name}>
                          {member.avatar_emoji}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="shrink-0 rounded-lg p-1 text-apple-tertiary/30 hover:bg-ios-red/10 hover:text-ios-red"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
