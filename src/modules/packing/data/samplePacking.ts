import type { PackingItem } from '@/lib/types'

export const SAMPLE_PACKING_ITEMS: PackingItem[] = [
  // Clothing
  { id: 'p-1', name: 'חולצות', category: 'clothing', assigned_to: 'aba', is_packed: false, quantity: 7, notes: 'כולל חולצה מכופתרת אחת' },
  { id: 'p-2', name: 'מכנסיים', category: 'clothing', assigned_to: 'aba', is_packed: false, quantity: 4 },
  { id: 'p-3', name: 'חולצות', category: 'clothing', assigned_to: 'ima', is_packed: true, quantity: 7 },
  { id: 'p-4', name: 'שמלות', category: 'clothing', assigned_to: 'ima', is_packed: false, quantity: 2 },
  { id: 'p-5', name: 'חולצות', category: 'clothing', assigned_to: 'kid1', is_packed: false, quantity: 8 },
  { id: 'p-6', name: 'מכנסיים קצרים', category: 'clothing', assigned_to: 'kid1', is_packed: false, quantity: 5 },
  { id: 'p-7', name: 'חולצות', category: 'clothing', assigned_to: 'kid2', is_packed: true, quantity: 8 },
  { id: 'p-8', name: 'חולצות', category: 'clothing', assigned_to: 'kid3', is_packed: false, quantity: 8 },
  { id: 'p-9', name: 'נעלי ספורט', category: 'clothing', assigned_to: 'aba', is_packed: true, quantity: 1 },
  { id: 'p-10', name: 'סנדלים', category: 'clothing', assigned_to: 'ima', is_packed: false, quantity: 1 },
  { id: 'p-11', name: 'בגד ים', category: 'clothing', assigned_to: 'kid1', is_packed: false, quantity: 2 },
  { id: 'p-12', name: 'בגד ים', category: 'clothing', assigned_to: 'kid2', is_packed: false, quantity: 2 },
  { id: 'p-13', name: 'קפוצ\'ון', category: 'clothing', assigned_to: 'aba', is_packed: false, quantity: 1, notes: 'למזג אוויר קריר' },

  // Toiletries
  { id: 'p-20', name: 'משחת שיניים', category: 'toiletries', assigned_to: 'ima', is_packed: true, quantity: 2 },
  { id: 'p-21', name: 'שמפו', category: 'toiletries', assigned_to: 'ima', is_packed: false, quantity: 1 },
  { id: 'p-22', name: 'קרם הגנה', category: 'toiletries', assigned_to: 'ima', is_packed: true, quantity: 3 },
  { id: 'p-23', name: 'מברשות שיניים', category: 'toiletries', assigned_to: 'ima', is_packed: false, quantity: 5 },

  // Electronics
  { id: 'p-30', name: 'מטען לטלפון', category: 'electronics', assigned_to: 'aba', is_packed: true, quantity: 2 },
  { id: 'p-31', name: 'מצלמה', category: 'electronics', assigned_to: 'aba', is_packed: false, quantity: 1 },
  { id: 'p-32', name: 'טאבלט', category: 'electronics', assigned_to: 'kid1', is_packed: false, quantity: 1, notes: 'עם אוזניות' },
  { id: 'p-33', name: 'פאוור בנק', category: 'electronics', assigned_to: 'aba', is_packed: false, quantity: 2 },
  { id: 'p-34', name: 'מתאם חשמל', category: 'electronics', assigned_to: 'aba', is_packed: true, quantity: 2 },

  // Documents
  { id: 'p-40', name: 'דרכונים', category: 'documents', assigned_to: 'aba', is_packed: false, quantity: 5 },
  { id: 'p-41', name: 'ביטוח נסיעות', category: 'documents', assigned_to: 'ima', is_packed: false, quantity: 1, notes: 'העתק מודפס' },
  { id: 'p-42', name: 'רישיון נהיגה בינלאומי', category: 'documents', assigned_to: 'aba', is_packed: false, quantity: 1 },

  // Medicine
  { id: 'p-50', name: 'אקמול', category: 'medicine', assigned_to: 'ima', is_packed: true, quantity: 1 },
  { id: 'p-51', name: 'פלסטרים', category: 'medicine', assigned_to: 'ima', is_packed: false, quantity: 1 },
  { id: 'p-52', name: 'תרופות כאב בטן', category: 'medicine', assigned_to: 'ima', is_packed: false, quantity: 1 },
  { id: 'p-53', name: 'ערכת עזרה ראשונה', category: 'medicine', assigned_to: 'ima', is_packed: false, quantity: 1 },

  // Entertainment
  { id: 'p-60', name: 'משחקי קלפים', category: 'entertainment', assigned_to: 'kid2', is_packed: false, quantity: 2 },
  { id: 'p-61', name: 'ספרים', category: 'entertainment', assigned_to: 'ima', is_packed: false, quantity: 3 },
  { id: 'p-62', name: 'מחברת ציור', category: 'entertainment', assigned_to: 'kid3', is_packed: false, quantity: 1 },

  // Snacks
  { id: 'p-70', name: 'חטיפים לטיסה', category: 'snacks', assigned_to: 'ima', is_packed: false, quantity: 10 },
  { id: 'p-71', name: 'בקבוקי מים ריקים', category: 'snacks', assigned_to: 'aba', is_packed: false, quantity: 5 },
]
