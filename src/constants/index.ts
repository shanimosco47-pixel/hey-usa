import type { FamilyMemberId } from '@/lib/types'
import type { FamilyMember, StatusConfig } from '@/types'

export const APP_PIN = '1234'

export const FAMILY_MEMBERS: Record<FamilyMemberId, FamilyMember> = {
  aba: {
    id: 'aba',
    name: 'אבא',
    emoji: '👨',
    color: '#4a90d9',
  },
  ima: {
    id: 'ima',
    name: 'אמא',
    emoji: '👩',
    color: '#e8735e',
  },
  kid1: {
    id: 'kid1',
    name: 'ילד 1',
    emoji: '👦',
    color: '#2d7d46',
  },
  kid2: {
    id: 'kid2',
    name: 'ילד 2',
    emoji: '👧',
    color: '#f5c542',
  },
  kid3: {
    id: 'kid3',
    name: 'ילד 3',
    emoji: '🧒',
    color: '#6c5ce7',
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
    color: 'text-brown',
    bg: 'bg-status-progress',
  },
  in_progress: {
    label: 'בתהליך',
    color: 'text-brown',
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
  { path: '/tasks', label: 'משימות', icon: 'CheckSquare' },
  { path: '/itinerary', label: 'לוח זמנים', icon: 'Calendar' },
  { path: '/documents', label: 'מסמכים', icon: 'FileText' },
  { path: '/map', label: 'מפה', icon: 'Map' },
  { path: '/photos', label: 'תמונות', icon: 'Camera' },
  { path: '/blog', label: 'בלוג', icon: 'BookOpen' },
  { path: '/budget', label: 'תקציב', icon: 'DollarSign' },
  { path: '/entertainment', label: 'בידור', icon: 'Music' },
  { path: '/packing', label: 'אריזה', icon: 'Package' },
] as const

export const BOTTOM_TAB_ITEMS = [
  { path: '/', label: 'בית', icon: 'Home' },
  { path: '/tasks', label: 'משימות', icon: 'CheckSquare' },
  { path: '/map', label: 'מפה', icon: 'Map' },
  { path: '/photos', label: 'תמונות', icon: 'Camera' },
] as const

export const MORE_MENU_ITEMS = [
  { path: '/itinerary', label: 'לוח זמנים', icon: 'Calendar' },
  { path: '/documents', label: 'מסמכים', icon: 'FileText' },
  { path: '/blog', label: 'בלוג', icon: 'BookOpen' },
  { path: '/budget', label: 'תקציב', icon: 'DollarSign' },
  { path: '/entertainment', label: 'בידור', icon: 'Music' },
  { path: '/packing', label: 'אריזה', icon: 'Package' },
] as const
