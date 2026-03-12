import type {
  FamilyMember,
  FamilyMemberId,
  TaskStatus,
  TaskPriority,
} from './types';

// ─── Family Members ─────────────────────────────────────────────────

export const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'aba', name: 'אבא', name_en: 'Dad', avatar_emoji: '👨', color: '#4a90d9' },
  { id: 'ima', name: 'אמא', name_en: 'Mom', avatar_emoji: '👩', color: '#e8735e' },
  { id: 'kid1', name: 'ילד 1', name_en: 'Kid 1', avatar_emoji: '👦', color: '#2d7d46' },
  { id: 'kid2', name: 'ילד 2', name_en: 'Kid 2', avatar_emoji: '👧', color: '#f5c542' },
  { id: 'kid3', name: 'ילד 3', name_en: 'Kid 3', avatar_emoji: '🧒', color: '#6c5ce7' },
];

export function getFamilyMember(id: FamilyMemberId): FamilyMember {
  const member = FAMILY_MEMBERS.find((m) => m.id === id);
  if (!member) throw new Error(`Unknown family member: ${id}`);
  return member;
}

// ─── Trip Dates ─────────────────────────────────────────────────────

export const TRIP_START_DATE = '2026-09-11';
export const TRIP_END_DATE = '2026-09-30';

// ─── Task Statuses ──────────────────────────────────────────────────

export const TASK_STATUSES: Record<
  TaskStatus,
  { label: string; color: string; icon: string }
> = {
  todo: { label: 'לביצוע', color: '#e17055', icon: 'circle' },
  in_progress: { label: 'בתהליך', color: '#fdcb6e', icon: 'clock' },
  done: { label: 'הושלם', color: '#00b894', icon: 'check-circle' },
  waiting: { label: 'ממתין', color: '#636e72', icon: 'pause-circle' },
};

// ─── Task Priorities ────────────────────────────────────────────────

export const TASK_PRIORITIES: Record<
  TaskPriority,
  { label: string; color: string; icon: string }
> = {
  low: { label: 'נמוכה', color: '#636e72', icon: 'arrow-down' },
  medium: { label: 'בינונית', color: '#4a90d9', icon: 'minus' },
  high: { label: 'גבוהה', color: '#e17055', icon: 'arrow-up' },
  urgent: { label: 'דחופה', color: '#c44d34', icon: 'alert-triangle' },
};

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
};

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
};

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
};

// ─── App Settings ───────────────────────────────────────────────────

export const APP_PIN = '1234';

// ─── Module Navigation ──────────────────────────────────────────────

export interface ModuleNavItem {
  icon: string;
  label: string;
  path: string;
}

export const MODULE_NAV: ModuleNavItem[] = [
  { icon: 'layout-dashboard', label: 'דשבורד', path: '/' },
  { icon: 'check-square', label: 'משימות', path: '/tasks' },
  { icon: 'calendar-days', label: 'לוח זמנים', path: '/itinerary' },
  { icon: 'map', label: 'מפה', path: '/map' },
  { icon: 'wallet', label: 'תקציב', path: '/budget' },
  { icon: 'luggage', label: 'אריזה', path: '/packing' },
  { icon: 'file-text', label: 'מסמכים', path: '/documents' },
  { icon: 'camera', label: 'תמונות', path: '/photos' },
  { icon: 'book-open', label: 'בלוג', path: '/blog' },
  { icon: 'music', label: 'פלייליסט', path: '/playlist' },
];
