import type { FamilyMemberId } from '@/lib/types'
import type { FamilyMember, StatusConfig } from '@/types'

export const APP_PIN = '1234'

export const FAMILY_MEMBERS: Record<FamilyMemberId, FamilyMember> = {
  aba: {
    id: 'aba',
    name: 'אבא',
    emoji: '👨',
    initials: 'א',
    color: '#007AFF',
    colorEnd: '#5856D6',
  },
  ima: {
    id: 'ima',
    name: 'אמא',
    emoji: '👩',
    initials: 'א',
    color: '#FF2D55',
    colorEnd: '#FF6B81',
  },
  kid1: {
    id: 'kid1',
    name: 'ילד 1',
    emoji: '👦',
    initials: 'י1',
    color: '#34C759',
    colorEnd: '#30D158',
  },
  kid2: {
    id: 'kid2',
    name: 'ילד 2',
    emoji: '👧',
    initials: 'י2',
    color: '#FF9500',
    colorEnd: '#FFB340',
  },
  kid3: {
    id: 'kid3',
    name: 'ילד 3',
    emoji: '🧒',
    initials: 'י3',
    color: '#5856D6',
    colorEnd: '#AF52DE',
  },
}

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
  { path: '/documents', label: 'מסמכים', icon: 'FolderOpen' },
  { path: '/map', label: 'מפה', icon: 'MapPinned' },
  { path: '/photos', label: 'תמונות', icon: 'ImagePlus' },
  { path: '/blog', label: 'בלוג', icon: 'Notebook' },
  { path: '/budget', label: 'תקציב', icon: 'Wallet' },
  { path: '/entertainment', label: 'בידור', icon: 'Headphones' },
  { path: '/packing', label: 'אריזה', icon: 'Luggage' },
] as const

export const BOTTOM_TAB_ITEMS = [
  { path: '/', label: 'בית', icon: 'Home' },
  { path: '/tasks', label: 'משימות', icon: 'ClipboardCheck' },
  { path: '/map', label: 'מפה', icon: 'MapPinned' },
  { path: '/photos', label: 'תמונות', icon: 'ImagePlus' },
] as const

export const MORE_MENU_ITEMS = [
  { path: '/itinerary', label: 'לוח זמנים', icon: 'CalendarDays' },
  { path: '/documents', label: 'מסמכים', icon: 'FolderOpen' },
  { path: '/blog', label: 'בלוג', icon: 'Notebook' },
  { path: '/budget', label: 'תקציב', icon: 'Wallet' },
  { path: '/entertainment', label: 'בידור', icon: 'Headphones' },
  { path: '/packing', label: 'אריזה', icon: 'Luggage' },
] as const
