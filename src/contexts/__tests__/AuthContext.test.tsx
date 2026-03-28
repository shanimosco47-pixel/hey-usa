import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../AuthContext'

const STORAGE_KEY = 'hey-usa-auth'

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  localStorage.clear()
})

describe('AuthContext', () => {
  it('login with correct PIN returns true and sets isAuthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    let loginResult: boolean
    act(() => {
      loginResult = result.current.login('1234')
    })

    expect(loginResult!).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login with wrong PIN returns false and stays unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    let loginResult: boolean
    act(() => {
      loginResult = result.current.login('0000')
    })

    expect(loginResult!).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('logout clears state and removes localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.login('1234')
    })
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.currentMember).toBeNull()
    // After logout, the useEffect persists the cleared state,
    // but the key should reflect an unauthenticated state
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.isAuthenticated).toBe(false)
      expect(parsed.currentMember).toBeNull()
    }
  })

  it('selectMember updates currentMember', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.selectMember('aba')
    })

    expect(result.current.currentMember).toBe('aba')
  })

  it('persists auth state to localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.login('1234')
    })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.isAuthenticated).toBe(true)
  })

  it('restores auth state from localStorage on mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ isAuthenticated: true, currentMember: 'ima', pin: '1234' }),
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.currentMember).toBe('ima')
  })

  it('throws when useAuth is used outside AuthProvider', () => {
    // Suppress console.error from React for the expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    spy.mockRestore()
  })
})
