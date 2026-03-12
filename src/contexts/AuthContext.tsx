import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { APP_PIN } from '@/constants'
import type { FamilyMemberId } from '@/types'

interface AuthState {
  isAuthenticated: boolean
  currentMember: FamilyMemberId | null
  pin: string
}

interface AuthContextValue extends AuthState {
  login: (pin: string) => boolean
  logout: () => void
  selectMember: (id: FamilyMemberId) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'hey-usa-auth'

function loadPersistedAuth(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as AuthState
      return parsed
    }
  } catch {
    // Ignore parse errors
  }
  return { isAuthenticated: false, currentMember: null, pin: '' }
}

function persistAuth(state: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadPersistedAuth)

  useEffect(() => {
    persistAuth(state)
  }, [state])

  const login = useCallback((enteredPin: string): boolean => {
    if (enteredPin === APP_PIN) {
      setState((prev) => ({ ...prev, isAuthenticated: true, pin: enteredPin }))
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    const cleared: AuthState = {
      isAuthenticated: false,
      currentMember: null,
      pin: '',
    }
    setState(cleared)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const selectMember = useCallback((id: FamilyMemberId) => {
    setState((prev) => ({ ...prev, currentMember: id }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, selectMember }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
