import { render, screen } from '@testing-library/react'
import { PageErrorBoundary } from '@/components/shared/PageErrorBoundary'

// A component that always throws
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Child content</div>
}

// Suppress console.error for expected error boundary logs
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('[PageErrorBoundary]') || msg.includes('The above error')) return
    originalConsoleError(...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})

describe('PageErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <PageErrorBoundary>
        <div>Hello world</div>
      </PageErrorBoundary>,
    )
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('shows default fallback message when child throws', () => {
    render(
      <PageErrorBoundary>
        <ThrowingChild shouldThrow />
      </PageErrorBoundary>,
    )
    expect(screen.getByText('משהו השתבש')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('shows custom fallback message when provided', () => {
    render(
      <PageErrorBoundary fallbackMessage="Custom error message">
        <ThrowingChild shouldThrow />
      </PageErrorBoundary>,
    )
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('shows a retry button in the error fallback', () => {
    render(
      <PageErrorBoundary>
        <ThrowingChild shouldThrow />
      </PageErrorBoundary>,
    )

    // Error state is shown with retry button
    expect(screen.getByText('משהו השתבש')).toBeInTheDocument()
    const retryButton = screen.getByText('נסה שוב')
    expect(retryButton).toBeInTheDocument()
    expect(retryButton.tagName).toBe('BUTTON')
  })
})
