import type { FamilyMemberId, FamilyMember } from '@/lib/types'
import type { StatusConfig } from '@/types'

export { PIE_COLORS, DAY_COLORS, ROUTE_COLORS } from './chartColors'

export const APP_PIN = '1234'

// ─── Family Members ─────────────────────────────────────────────────

export const FAMILY_MEMBERS: Record<FamilyMemberId, FamilyMember> = {
  aba: {
    id: 'aba',
    name: 'אבא',
    name_en: 'Dad',
    emoji: '👨',
    avatar_emoji: '👨',
    initials: 'א',
    color: '#007AFF',
    colorEnd: '#5856D6',
  },
  ima: {
    id: 'ima',
    name: 'אמא',
    name_en: 'Mom',
    emoji: '👩',
    avatar_emoji: '👩',
    initials: 'א',
    color: '#FF2D55',
    colorEnd: '#FF6B81',
  },
  kid1: {
    id: 'kid1',
    name: 'ילד 1',
    name_en: 'Kid 1',
    emoji: '👦',
    avatar_emoji: '👦',
    initials: 'י1',
    color: '#34C759',
    colorEnd: '#30D158',
  },
  kid2: {
    id: 'kid2',
    name: 'ילד 2',
    name_en: 'Kid 2',
    emoji: '👧',
    avatar_emoji: '👧',
    initials: 'י2',
    color: '#FF9500',
    colorEnd: '#FFB340',
  },
  kid3: {
    id: 'kid3',
    name: 'ילד 3',
    name_en: 'Kid 3',
    emoji: '🧒',
    avatar_emoji: '🧒',
    initials: 'י3',
    color: '#5856D6',
    colorEnd: '#AF52DE',
  },
  moti: {
    id: 'moti',
    name: 'מוטי',
    name_en: 'Moti',
    emoji: '🤖',
    avatar_emoji: '🤖',
    initials: 'מ',
    color: '#8E8E93',
    colorEnd: '#C7C7CC',
  },
}

/** Array view of FAMILY_MEMBERS for iteration */
export const FAMILY_MEMBERS_LIST: FamilyMember[] = Object.values(FAMILY_MEMBERS)

export function getFamilyMember(id: FamilyMemberId): FamilyMember {
  const member = FAMILY_MEMBERS[id];
  if (!member) throw new Error(`Unknown family member: ${id}`);
  return member;
}

// ─── Trip Dates ─────────────────────────────────────────────────────

export const TRIP_START_DATE = '2026-09-10'
export const TRIP_END_DATE = '2026-09-30'

// ─── Expense Categories ─────────────────────────────────────────────

export const EXPENSE_CATEGORIES: Record<
  string,
  { label: string; icon: string }
> = {
  flights: { label: 'טיסות', icon: 'plane' },
  accommodation: { label: 'לינה', icon: 'bed' },
  food: { label: 'אוכל', icon: 'utensils' },
  transport: { label: 'תחבורה', icon: 'car' },
  attractions: { label: 'אטרקציות', icon: 'ticket' },
  shopping: { label: 'קניות', icon: 'shopping-bag' },
  communication: { label: 'תקשורת', icon: 'phone' },
  insurance: { label: 'ביטוח', icon: 'shield' },
  other: { label: 'אחר', icon: 'more-horizontal' },
}

// ─── Packing Categories ─────────────────────────────────────────────

export const PACKING_CATEGORIES: Record<string, { label: string }> = {
  clothing: { label: 'ביגוד' },
  toiletries: { label: 'טואלטיקה' },
  electronics: { label: 'אלקטרוניקה' },
  documents: { label: 'מסמכים' },
  medicine: { label: 'תרופות' },
  entertainment: { label: 'בידור' },
  snacks: { label: 'חטיפים' },
  other: { label: 'אחר' },
}

// ─── Document Categories ────────────────────────────────────────────

export const DOCUMENT_CATEGORIES: Record<string, { label: string }> = {
  passport: { label: 'דרכון' },
  visa: { label: 'ויזה' },
  insurance: { label: 'ביטוח' },
  flights: { label: 'טיסות' },
  accommodation: { label: 'לינה' },
  car_rental: { label: 'השכרת רכב' },
  attractions: { label: 'אטרקציות' },
  medical: { label: 'רפואי' },
  other: { label: 'אחר' },
}

// ─── UI Constants ───────────────────────────────────────────────────

export const STATUS_MAP: Record<string, StatusConfig> = {
  todo: {
    label: 'לביצוע',
    color: 'text-white',
    bg: 'bg-status-todo',
  },
  'in-progress': {
    label: 'בתהליך',
    color: 'text-white',
    bg: 'bg-status-progress',
  },
  in_progress: {
    label: 'בתהליך',
    color: 'text-white',
    bg: 'bg-status-progress',
  },
  done: {
    label: 'בוצע',
    color: 'text-white',
    bg: 'bg-status-done',
  },
  waiting: {
    label: 'ממתין',
    color: 'text-white',
    bg: 'bg-status-waiting',
  },
}

export const NAV_ITEMS = [
  { path: '/', label: 'בית', icon: 'Home' },
  { path: '/tasks', label: 'משימות', icon: 'ClipboardCheck' },
  { path: '/itinerary', label: 'לוח זמנים', icon: 'CalendarDays' },
  { path: '/campsites', label: 'לינות', icon: 'Tent' },
  { path: '/documents', label: 'מסמכים', icon: 'FolderOpen' },
  { path: '/map', label: 'מפה', icon: 'MapPinned' },
  { path: '/photos', label: 'תמונות', icon: 'ImagePlus' },
  { path: '/blog', label: 'בלוג', icon: 'Notebook' },
  { path: '/budget', label: 'תקציב', icon: 'Wallet' },
  { path: '/entertainment', label: 'בידור', icon: 'Headphones' },
  { path: '/packing', label: 'אריזה', icon: 'Luggage' },
  { path: '/notes', label: 'פתקים', icon: 'StickyNote' },
  { path: '/locations', label: 'יעדים', icon: 'MapPin' },
  { path: '/chat', label: 'מוטי', icon: 'Bot' },
] as const

export const BOTTOM_TAB_ITEMS = [
  { path: '/', label: 'בית', icon: 'Home' },
  { path: '/tasks', label: 'משימות', icon: 'ClipboardCheck' },
  { path: '/map', label: 'מפה', icon: 'MapPinned' },
  { path: '/photos', label: 'תמונות', icon: 'ImagePlus' },
] as const

export const MORE_MENU_ITEMS = [
  { path: '/itinerary', label: 'לוח זמנים', icon: 'CalendarDays' },
  { path: '/campsites', label: 'לינות', icon: 'Tent' },
  { path: '/documents', label: 'מסמכים', icon: 'FolderOpen' },
  { path: '/blog', label: 'בלוג', icon: 'Notebook' },
  { path: '/budget', label: 'תקציב', icon: 'Wallet' },
  { path: '/entertainment', label: 'בידור', icon: 'Headphones' },
  { path: '/packing', label: 'אריזה', icon: 'Luggage' },
  { path: '/notes', label: 'פתקים', icon: 'StickyNote' },
  { path: '/locations', label: 'יעדים', icon: 'MapPin' },
  { path: '/chat', label: 'מוטי', icon: 'Bot' },
] as const
