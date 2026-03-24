import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHomeRedirect = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen animated-bg paper-texture flex items-center justify-center px-4">
          <div className="glass-strong rounded-3xl p-8 max-w-xl w-full text-center">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Something Went Wrong
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              The app hit an unexpected error. You can reload the page or return to the dashboard entry point.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-glass text-white px-5 py-3 rounded-xl font-semibold"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleHomeRedirect}
                className="glass px-5 py-3 rounded-xl font-semibold text-gray-800 dark:text-gray-200"
              >
                Go To Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
