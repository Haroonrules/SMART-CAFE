import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorData;
      try {
        errorData = JSON.parse(this.state.error?.message || '{}');
      } catch (e) {
        errorData = { error: this.state.error?.message };
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border border-red-100">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <div className="bg-red-50 p-4 rounded-md overflow-auto text-sm text-red-900 font-mono">
              {errorData.error || 'An unexpected error occurred.'}
            </div>
            {errorData.operationType && (
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Operation:</strong> {errorData.operationType}</p>
                <p><strong>Path:</strong> {errorData.path}</p>
              </div>
            )}
            <button
              className="mt-6 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
