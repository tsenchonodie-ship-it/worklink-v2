import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error in component tree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error || {};
      const details = `${err.message || 'Error'}\n\n${err.stack || ''}`;
      return (
        <div className="p-6 text-left max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold">Something went wrong.</h2>
          <p className="mt-2 text-sm text-muted-foreground">An unexpected error occurred while loading this view. Please copy the error below and share it so we can fix it.</p>
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              className="px-4 py-2 rounded border bg-white text-black"
              onClick={() => navigator.clipboard?.writeText(details)}
            >
              Copy error
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap bg-black/30 p-4 rounded text-sm overflow-auto" style={{ maxHeight: 360 }}>
            {details}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
