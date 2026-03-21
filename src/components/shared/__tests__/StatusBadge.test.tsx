import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders the correct label for "todo" status', () => {
    render(<StatusBadge status="todo" />)
    expect(screen.getByText('לביצוע')).toBeInTheDocument()
  })

  it('renders the correct label for "in-progress" status', () => {
    render(<StatusBadge status="in-progress" />)
    expect(screen.getByText('בתהליך')).toBeInTheDocument()
  })

  it('renders the correct label for "in_progress" status', () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText('בתהליך')).toBeInTheDocument()
  })

  it('renders the correct label for "done" status', () => {
    render(<StatusBadge status="done" />)
    expect(screen.getByText('בוצע')).toBeInTheDocument()
  })

  it('renders the correct label for "waiting" status', () => {
    render(<StatusBadge status="waiting" />)
    expect(screen.getByText('ממתין')).toBeInTheDocument()
  })

  it('falls back to raw status string for unknown status', () => {
    render(<StatusBadge status="unknown-status" />)
    expect(screen.getByText('unknown-status')).toBeInTheDocument()
  })

  it('renders with sm size class', () => {
    const { container } = render(<StatusBadge status="todo" size="sm" />)
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-xs')
  })

  it('renders with md size class by default', () => {
    const { container } = render(<StatusBadge status="todo" />)
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-sm')
  })
})
