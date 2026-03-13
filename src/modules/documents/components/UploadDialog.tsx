import { useState, useRef, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { Upload, X, FileText, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import { DOCUMENT_CATEGORIES } from '@/lib/constants'
import type { Document, FamilyMemberId } from '@/types'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => void
}

const categoryEntries = Object.entries(DOCUMENT_CATEGORIES)
const memberEntries = Object.entries(FAMILY_MEMBERS)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadDialog({ open, onOpenChange, onUpload }: UploadDialogProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [memberId, setMemberId] = useState('')
  const [notes, setNotes] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = useCallback(() => {
    setTitle('')
    setCategory('')
    setMemberId('')
    setNotes('')
    setExpiryDate('')
    setSelectedFile(null)
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file)
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
        setTitle(nameWithoutExt)
      }
    },
    [title],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !category) return

    const doc: Omit<Document, 'id' | 'created_at' | 'updated_at'> = {
      title: title.trim(),
      category,
      family_member_id: (memberId as FamilyMemberId) || undefined,
      notes: notes.trim() || undefined,
      expiry_date: expiryDate || undefined,
      file_url: selectedFile ? `/documents/${selectedFile.name}` : undefined,
      file_type: selectedFile?.type || 'application/pdf',
      file_size: selectedFile?.size || 0,
    }

    onUpload(doc)
    resetForm()
    onOpenChange(false)
  }, [title, category, memberId, notes, expiryDate, selectedFile, onUpload, resetForm, onOpenChange])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetForm()
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetForm],
  )

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-x-4 top-[50%] z-50 max-h-[85vh] w-auto max-w-lg translate-y-[-50%] overflow-y-auto rounded-apple-lg bg-surface-primary p-6 shadow-xl sm:inset-x-auto sm:start-[50%] sm:translate-x-[50%] sm:-translate-y-[50%] rtl:sm:-translate-x-[50%]"
          dir="rtl"
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-bold text-apple-primary">
              העלאת מסמך
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-apple-secondary transition-colors hover:bg-black/[0.04]"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'mb-4 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors',
              isDragging
                ? 'border-ios-blue bg-ios-blue/5'
                : 'border-black/[0.06] bg-white/40 hover:border-ios-blue/50',
            )}
          >
            {selectedFile ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-ios-blue" />
                <div className="text-right">
                  <p className="text-sm font-medium text-apple-primary">{selectedFile.name}</p>
                  <p className="text-xs text-apple-secondary">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-lg p-1 text-apple-secondary hover:bg-black/[0.04]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-apple-secondary" />
                <p className="text-sm text-apple-secondary">גרור קובץ לכאן</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-ios-blue px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ios-blue/80"
                >
                  בחר קובץ
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleInputChange}
            />
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            {/* Title */}
            <div>
              <label htmlFor="doc-title" className="mb-1 block text-sm font-medium text-apple-primary">
                כותרת
              </label>
              <input
                id="doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="שם המסמך"
                className="w-full rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-sm font-medium text-apple-primary">קטגוריה</label>
              <Select.Root value={category} onValueChange={setCategory} dir="rtl">
                <Select.Trigger
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30',
                    category ? 'text-apple-primary' : 'text-apple-tertiary',
                  )}
                >
                  <Select.Value placeholder="בחר קטגוריה" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-apple-secondary" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-[60] overflow-hidden rounded-xl border border-black/[0.06] bg-surface-primary shadow-lg"
                    position="popper"
                    sideOffset={4}
                    dir="rtl"
                  >
                    <Select.Viewport className="p-1">
                      {categoryEntries.map(([key, val]) => (
                        <Select.Item
                          key={key}
                          value={key}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-apple-primary outline-none data-[highlighted]:bg-black/[0.04]"
                        >
                          <Select.ItemIndicator>
                            <Check className="h-4 w-4 text-ios-blue" />
                          </Select.ItemIndicator>
                          <Select.ItemText>{val.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Family member */}
            <div>
              <label className="mb-1 block text-sm font-medium text-apple-primary">
                בן משפחה (אופציונלי)
              </label>
              <Select.Root value={memberId} onValueChange={setMemberId} dir="rtl">
                <Select.Trigger
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30',
                    memberId ? 'text-apple-primary' : 'text-apple-tertiary',
                  )}
                >
                  <Select.Value placeholder="כל המשפחה" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-apple-secondary" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-[60] overflow-hidden rounded-xl border border-black/[0.06] bg-surface-primary shadow-lg"
                    position="popper"
                    sideOffset={4}
                    dir="rtl"
                  >
                    <Select.Viewport className="p-1">
                      {memberEntries.map(([key, member]) => (
                        <Select.Item
                          key={key}
                          value={key}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-apple-primary outline-none data-[highlighted]:bg-black/[0.04]"
                        >
                          <Select.ItemIndicator>
                            <Check className="h-4 w-4 text-ios-blue" />
                          </Select.ItemIndicator>
                          <Select.ItemText>
                            {member.emoji} {member.name}
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Expiry date */}
            <div>
              <label htmlFor="doc-expiry" className="mb-1 block text-sm font-medium text-apple-primary">
                תאריך תפוגה (אופציונלי)
              </label>
              <input
                id="doc-expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="doc-notes" className="mb-1 block text-sm font-medium text-apple-primary">
                הערות (אופציונלי)
              </label>
              <textarea
                id="doc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="פרטים נוספים..."
                className="w-full resize-none rounded-lg border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || !category}
              className="flex-1 rounded-xl bg-ios-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ios-blue/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              העלה מסמך
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-xl border border-black/[0.06] glass px-4 py-2.5 text-sm font-medium text-apple-secondary transition-colors hover:bg-black/[0.04]"
              >
                ביטול
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
