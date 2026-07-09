import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; message?: string; }

/**
 * Catches render/runtime errors in the page subtree so a single broken screen
 * shows a friendly fallback instead of blanking the whole app. Keyed by route
 * in App.tsx so navigating elsewhere clears the error automatically.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Surface in the console for debugging; never crash the tree.
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="card max-w-sm w-full text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3 text-2xl">
              ⚠️
            </div>
            <p className="text-body text-white">This screen hit a snag</p>
            <p className="text-caption text-gray mt-1 break-words">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 w-full rounded-xl brand-gradient text-[#fff] py-2.5 text-body font-semibold active:opacity-80"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
