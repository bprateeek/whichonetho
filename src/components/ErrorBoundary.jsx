import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl">😵</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Something went wrong
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              We hit an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={this.handleRefresh}
              className="inline-block py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
