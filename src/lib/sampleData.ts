// Sample data IDs all follow predictable patterns.
// This utility identifies them so we can visually mark them in the UI.

const SAMPLE_PREFIXES = [
  'doc-',      // sample documents
  'photo-',    // sample photos
  'expense-',  // sample expenses
  'task-',     // sample tasks
  'post-',     // sample blog posts
  'song-',     // sample playlist items
  'pack-',     // sample packing items
  'note-sample-', // sample notes
]

export function isSampleData(id: string): boolean {
  return SAMPLE_PREFIXES.some((prefix) => id.startsWith(prefix))
}
