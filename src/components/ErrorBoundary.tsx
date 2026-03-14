import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      
      try {
        // Check if it's a Firestore permission error JSON
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          errorMessage = "You don't have permission to perform this action. Please make sure you are signed in.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-earth-50 p-8 rounded-3xl border border-earth-100 max-w-md">
            <h2 className="text-2xl font-serif font-bold text-earth-900 mb-4">Oops!</h2>
            <p className="text-earth-700 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-sage-500 text-white rounded-xl hover:bg-sage-600 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
