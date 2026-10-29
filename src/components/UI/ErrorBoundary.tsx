import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Setlla ErrorBoundary] Uncaught runtime error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.hash = '#/explore';
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#E5E7EB] flex flex-col items-center">
            <img
              src="/images/setlla-logo.png"
              alt="Setlla"
              className="h-9 w-auto object-contain mb-6"
            />
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#F95700] flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#000004] mb-2 font-display">
              Something went wrong
            </h2>
            <p className="text-xs text-[#70798C] mb-6 leading-relaxed">
              We encountered a temporary display issue. Your account data and progress remain safe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full mb-4">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#000004] font-bold text-xs transition-all active:scale-[0.99] cursor-pointer border border-[#E5E7EB]"
              >
                Go to Explore
              </button>
            </div>

            {this.state.error && (
              <div className="w-full text-left pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="text-[11px] text-[#70798C] hover:text-[#000004] underline cursor-pointer"
                >
                  {this.state.showDetails ? 'Hide technical details' : 'View technical details'}
                </button>
                {this.state.showDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-800 break-words max-h-36 overflow-y-auto">
                    <p className="font-bold text-red-600 mb-1">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-[9px] text-slate-500 whitespace-pre-wrap">{this.state.error.stack}</pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

