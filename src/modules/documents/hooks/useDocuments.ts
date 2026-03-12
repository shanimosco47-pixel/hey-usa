import { useState, useMemo, useCallback } from 'react'
import type { Document } from '@/types'
import { sampleDocuments } from '../data/sampleDocuments'

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const addDocument = useCallback((doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const newDoc: Document = {
      ...doc,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    }
    setDocuments((prev) => [newDoc, ...prev])
    return newDoc
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const updateDocument = useCallback((id: string, changes: Partial<Document>) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...changes, updated_at: new Date().toISOString() } : d,
      ),
    )
  }, [])

  const filteredDocuments = useMemo(() => {
    let result = documents

    if (activeCategory !== 'all') {
      result = result.filter((d) => d.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q)) ||
          d.category.toLowerCase().includes(q),
      )
    }

    return result
  }, [documents, activeCategory, searchQuery])

  return {
    documents: filteredDocuments,
    allDocuments: documents,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    addDocument,
    deleteDocument,
    updateDocument,
  }
}
