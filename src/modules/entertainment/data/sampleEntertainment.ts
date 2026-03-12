import type { PlaylistItem } from '@/lib/types'

export const SAMPLE_PLAYLIST: PlaylistItem[] = [
  {
    id: 'song-1',
    title: 'On The Road Again',
    artist: 'Willie Nelson',
    added_by: 'aba',
    votes: [
      { member_id: 'aba', vote: 'up' },
      { member_id: 'ima', vote: 'up' },
      { member_id: 'kid1', vote: 'up' },
    ],
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'song-2',
    title: 'Life Is A Highway',
    artist: 'Rascal Flatts',
    added_by: 'kid1',
    votes: [
      { member_id: 'kid1', vote: 'up' },
      { member_id: 'kid2', vote: 'up' },
      { member_id: 'kid3', vote: 'up' },
    ],
    created_at: '2026-08-02T10:00:00Z',
  },
  {
    id: 'song-3',
    title: 'Route 66',
    artist: 'Nat King Cole',
    added_by: 'aba',
    votes: [
      { member_id: 'aba', vote: 'up' },
      { member_id: 'ima', vote: 'up' },
    ],
    created_at: '2026-08-03T10:00:00Z',
  },
  {
    id: 'song-4',
    title: 'Hotel California',
    artist: 'Eagles',
    added_by: 'ima',
    votes: [
      { member_id: 'aba', vote: 'up' },
      { member_id: 'ima', vote: 'up' },
      { member_id: 'kid1', vote: 'down' },
    ],
    created_at: '2026-08-04T10:00:00Z',
  },
  {
    id: 'song-5',
    title: 'Take Me Home, Country Roads',
    artist: 'John Denver',
    added_by: 'kid2',
    votes: [
      { member_id: 'kid2', vote: 'up' },
      { member_id: 'kid3', vote: 'up' },
      { member_id: 'aba', vote: 'up' },
      { member_id: 'ima', vote: 'up' },
    ],
    created_at: '2026-08-05T10:00:00Z',
  },
  {
    id: 'song-6',
    title: 'Don\'t Stop Believin\'',
    artist: 'Journey',
    added_by: 'ima',
    votes: [
      { member_id: 'ima', vote: 'up' },
      { member_id: 'kid1', vote: 'up' },
    ],
    created_at: '2026-08-06T10:00:00Z',
  },
  {
    id: 'song-7',
    title: 'Born To Be Wild',
    artist: 'Steppenwolf',
    added_by: 'aba',
    votes: [{ member_id: 'aba', vote: 'up' }],
    created_at: '2026-08-07T10:00:00Z',
  },
]

export const ROAD_TRIP_GAMES = [
  {
    id: 'game-1',
    name: 'אני רואה',
    description: 'בוחרים דבר שרואים ואומרים "אני רואה משהו שמתחיל ב..." והשאר מנחשים',
    minAge: 4,
    icon: '👁️',
  },
  {
    id: 'game-2',
    name: 'לוחיות רישוי',
    description: 'מחפשים לוחיות רישוי ממדינות שונות - מי שמוצא הכי הרבה מנצח!',
    minAge: 6,
    icon: '🚗',
  },
  {
    id: 'game-3',
    name: '20 שאלות',
    description: 'אחד חושב על משהו והשאר שואלים עד 20 שאלות של כן/לא כדי לנחש',
    minAge: 6,
    icon: '❓',
  },
  {
    id: 'game-4',
    name: 'סיפור משותף',
    description: 'כל אחד מוסיף משפט לסיפור - יוצא מצחיק ומפתיע!',
    minAge: 5,
    icon: '📖',
  },
  {
    id: 'game-5',
    name: 'שירים בשרשרת',
    description: 'שרים שיר, וצריך להתחיל שיר חדש עם האות האחרונה של השיר הקודם',
    minAge: 7,
    icon: '🎵',
  },
  {
    id: 'game-6',
    name: 'חידון ארה"ב',
    description: 'שאלות על ארצות הברית - בירות מדינות, אטרקציות, היסטוריה',
    minAge: 8,
    icon: '🇺🇸',
  },
]

export const USA_TRIVIA = [
  { question: 'מה בירת ארצות הברית?', answer: 'וושינגטון DC', category: 'גיאוגרפיה' },
  { question: 'כמה מדינות יש בארה"ב?', answer: '50', category: 'כללי' },
  { question: 'מה הנהר הארוך ביותר בארה"ב?', answer: 'מיזורי', category: 'גיאוגרפיה' },
  { question: 'באיזו שנה הוקמה ארצות הברית?', answer: '1776', category: 'היסטוריה' },
  { question: 'מה הפארק הלאומי הראשון שהוקם?', answer: 'ילוסטון', category: 'טבע' },
  { question: 'כמה כוכבים יש בדגל ארה"ב?', answer: '50 (אחד לכל מדינה)', category: 'כללי' },
  { question: 'מה העיר הגדולה ביותר בארה"ב?', answer: 'ניו יורק', category: 'גיאוגרפיה' },
  { question: 'מה שם הקניון המפורסם באריזונה?', answer: 'גרנד קניון', category: 'טבע' },
  { question: 'מי היה הנשיא הראשון של ארה"ב?', answer: 'ג\'ורג\' וושינגטון', category: 'היסטוריה' },
  { question: 'איזה מדבר נמצא בנבדה/קליפורניה?', answer: 'עמק המוות (Death Valley)', category: 'טבע' },
]
