import { useState, useMemo } from 'react'
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brown">אריזה</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          פריט חדש
        </button>
      </div>

      {/* Progress */}
      <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brown-light">
            <Package className="ml-1 inline h-4 w-4" />
            {packedItems} מתוך {totalItems} ארוזים
          </span>
          <span className={cn('font-bold', packedPercent === 100 ? 'text-sage' : 'text-brown')}>
            {packedPercent.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-sand-dark">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              packedPercent === 100 ? 'bg-sage' : 'bg-sky',
            )}
            style={{ width: `${packedPercent}%` }}
          />
        </div>
      </div>

      {/* Family Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-brown-light" />
        <button
          onClick={() => setFilterMember('all')}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            filterMember === 'all'
              ? 'bg-brown text-white'
              : 'bg-white/60 text-brown-light',
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
                ? 'bg-brown text-white'
                : 'bg-white/60 text-brown-light',
            )}
          >
            {m.avatar_emoji} {m.name}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-2xl bg-white/90 p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-brown">פריט חדש</h3>
          <input
            type="text"
            placeholder="שם הפריט"
            value={newItem.name}
            onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newItem.category}
              onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
              className="rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown"
            >
              {Object.entries(PACKING_CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={newItem.assigned_to}
              onChange={(e) => setNewItem((p) => ({ ...p, assigned_to: e.target.value as FamilyMemberId }))}
              className="rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown"
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
            className="w-full rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddItem}
              className="flex-1 rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white"
            >
              הוסף
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-xl bg-sand-dark px-4 py-2 text-sm font-medium text-brown-light"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Category Groups */}
      <div className="space-y-2">
        {Object.entries(PACKING_CATEGORIES).map(([catKey, { label }]) => {
          const catItems = groupedByCategory[catKey]
          if (!catItems || catItems.length === 0) return null
          const isExpanded = expandedCategories.has(catKey)
          const catPacked = catItems.filter((i) => i.is_packed).length
          const IconComp = CATEGORY_ICONS[catKey] || Package

          return (
            <div key={catKey} className="rounded-2xl bg-white/80 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(catKey)}
                className="flex w-full items-center gap-3 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-dark/50">
                  <IconComp className="h-4 w-4 text-brown-light" />
                </div>
                <span className="flex-1 text-right text-sm font-bold text-brown">{label}</span>
                <span className="text-xs text-brown-light">
                  {catPacked}/{catItems.length}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-brown-light" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-brown-light" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-sand-dark/30 px-3 pb-2">
                  {catItems.map((item) => {
                    const member = getFamilyMember(item.assigned_to)
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2 border-b border-sand-dark/10 last:border-0"
                      >
                        <button
                          onClick={() => togglePacked(item.id)}
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                            item.is_packed
                              ? 'border-sage bg-sage text-white'
                              : 'border-brown-light/30 bg-transparent',
                          )}
                        >
                          {item.is_packed && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm',
                              item.is_packed ? 'text-brown-light line-through' : 'text-brown',
                            )}
                          >
                            {item.name}
                            {item.quantity > 1 && (
                              <span className="mr-1 text-xs text-brown-light">×{item.quantity}</span>
                            )}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-brown-light/70">{item.notes}</p>
                          )}
                        </div>
                        <span className="text-xs" title={member.name}>
                          {member.avatar_emoji}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="shrink-0 rounded-lg p-1 text-brown-light/30 hover:bg-terracotta/10 hover:text-terracotta"
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
      </div>
    </div>
  )
}
