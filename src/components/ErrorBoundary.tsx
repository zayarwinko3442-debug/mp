import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Movie Perfect:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('movie_perfect_posters_v1');
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-white">Movie Perfect - Display Issue</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Browser cache သို့မဟုတ် သိမ်းဆည်းထားသော အချက်အလက် ကွဲလွဲမှုကြောင့် မျက်နှာပြင် ပြသရန် အခက်အခဲရှိနေပါသည်။
            </p>
            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-rose-300 text-left break-words overflow-x-auto max-h-28">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-colors"
              >
                🔄 Refresh ပြုလုပ်ရန်
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs border border-zinc-700 transition-colors"
              >
                🧹 Cache ရှင်းပြီး ပြန်လည်စတင်ရန်
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
