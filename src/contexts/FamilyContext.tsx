/**
 * FamilyContext - convenience re-export for family member selection.
 *
 * The family member selection state lives inside AuthContext.
 * This module re-exports the relevant pieces so consumers can
 * import from a semantically clear location.
 */
export { useAuth as useFamilyContext } from '@/contexts/AuthContext'
