import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { BottomTabs } from '../BottomTabs'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
      ),
      button: ({
        children,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        whileTap,
        ...props
      }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }) => (
        <button {...props}>{children}</button>
      ),
    },
  }
})

vi.mock('@/lib/version', () => ({
  APP_VERSION: '1.0.0-test',
  buildTimeFormatted: () => '2026-01-01',
}))

function renderBottomTabs() {
  return render(
    <MemoryRouter>
      <BottomTabs />
    </MemoryRouter>,
  )
}

describe('BottomTabs', () => {
  it('renders all main tab items', () => {
    renderBottomTabs()

    // The 4 bottom tab labels
    expect(screen.getByText('בית')).toBeInTheDocument()
    expect(screen.getByText('משימות')).toBeInTheDocument()
    expect(screen.getByText('מפה')).toBeInTheDocument()
    expect(screen.getByText('תמונות')).toBeInTheDocument()
  })

  it('renders the More button', () => {
    renderBottomTabs()
    expect(screen.getByText('עוד')).toBeInTheDocument()
  })

  it('opens the drawer when More button is clicked', async () => {
    const user = userEvent.setup()
    renderBottomTabs()

    // "עוד מודולים" heading should not be visible initially
    expect(screen.queryByText('עוד מודולים')).not.toBeInTheDocument()

    await user.click(screen.getByText('עוד'))

    // Drawer heading should now be visible
    expect(screen.getByText('עוד מודולים')).toBeInTheDocument()
  })

  it('shows all more menu items when drawer is open', async () => {
    const user = userEvent.setup()
    renderBottomTabs()

    await user.click(screen.getByText('עוד'))

    // Check a few more menu items are visible
    expect(screen.getByText('לוח זמנים')).toBeInTheDocument()
    expect(screen.getByText('תקציב')).toBeInTheDocument()
    expect(screen.getByText('אריזה')).toBeInTheDocument()
    expect(screen.getByText('מוטי')).toBeInTheDocument()
  })

  it('closes the drawer when close button is clicked', async () => {
    const user = userEvent.setup()
    renderBottomTabs()

    await user.click(screen.getByText('עוד'))
    expect(screen.getByText('עוד מודולים')).toBeInTheDocument()

    // Click close button (aria-label "סגור")
    await user.click(screen.getByLabelText('סגור'))

    expect(screen.queryByText('עוד מודולים')).not.toBeInTheDocument()
  })

  it('closes the drawer when overlay backdrop is clicked', async () => {
    const user = userEvent.setup()
    renderBottomTabs()

    await user.click(screen.getByText('עוד'))
    expect(screen.getByText('עוד מודולים')).toBeInTheDocument()

    // Click the backdrop overlay (has bg-black/20 class)
    const overlay = document.querySelector('.bg-black\\/20')
    expect(overlay).toBeTruthy()
    await user.click(overlay!)

    expect(screen.queryByText('עוד מודולים')).not.toBeInTheDocument()
  })
})
