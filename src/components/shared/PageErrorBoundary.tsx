import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-ios-orange" />
          <h2 className="text-lg font-bold text-apple-primary">
            {this.props.fallbackMessage || 'משהו השתבש'}
          </h2>
          <p className="text-sm text-apple-secondary">
            {this.state.error?.message || 'אירעה שגיאה בטעינת העמוד'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-apple bg-ios-blue px-4 py-2 text-sm font-medium text-white"
          >
            נסה שוב
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
