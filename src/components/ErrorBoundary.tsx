import { Component, useState } from 'react';
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

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('App error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/stories';
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#F6F9FC] px-4 py-8 font-sans flex items-center justify-center">
        <main className="w-full max-w-xl" role="alert">
          <div className="rounded-3xl bg-[#A8DCFF] p-6 sm:p-10 shadow-sm border border-sky-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Error
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Something went wrong.
            </h1>

            <p className="mt-3 text-base text-slate-800 leading-relaxed">
              An error occurred while loading this page. Please reload the page or go back.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={this.handleReload}
                className="rounded-full bg-[#D9F26B] px-6 py-3 text-sm font-bold text-slate-950 hover:bg-[#c9e35b] transition-colors"
              >
                Reload page
              </button>

              <button
                onClick={this.handleHome}
                className="rounded-full bg-[#0A0A0A] px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Go to stories
              </button>
            </div>

            {/* Technical details only visible in development */}
            {import.meta.env.DEV && this.state.error && (
              <ErrorDetails error={this.state.error} />
            )}
          </div>
        </main>
      </div>
    );
  }
}

function ErrorDetails({ error }: { error: Error }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${error.name}: ${error.message}\n${error.stack || ''}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <details className="mt-6 border-t border-slate-900/10 pt-4">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-950">
        Debug information (Dev Only)
      </summary>

      <div className="mt-3 rounded-xl bg-white/70 p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-bold text-slate-900">
            {error.name}: {error.message}
          </span>
          <button
            onClick={handleCopy}
            type="button"
            className="rounded bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-300"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {error.stack && (
          <pre className="max-h-32 overflow-auto text-[11px] font-mono text-slate-600 whitespace-pre-wrap">
            {error.stack.split('\n').slice(0, 3).join('\n')}
          </pre>
        )}
      </div>
    </details>
  );
}