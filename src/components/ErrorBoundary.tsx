import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/stories';
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfaf7] dark:bg-slate-950 px-6 py-12 transition-colors duration-300 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-center relative overflow-hidden">
            
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

            {/* Error icon circle */}
            <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-brand mx-auto mb-6 shadow-sm">
              <i className="ri-error-warning-fill text-3xl"></i>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Something went off-page
            </h1>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 font-serif italic mt-3 leading-relaxed">
              "Every story has its twists, but this chapter encountered an unexpected turn."
            </p>

            {this.state.error && (
              <div className="mt-6 text-left bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 max-h-40 overflow-y-auto">
                <p className="text-xs font-mono font-bold text-red-500 truncate">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[10px] font-mono text-slate-400 dark:text-slate-550 mt-2 whitespace-pre-wrap leading-tight">
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-brand text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/15 hover:scale-105 active:scale-95 transition-transform"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs uppercase tracking-widest rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform"
              >
                Go to Feed
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
