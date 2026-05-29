import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

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
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught SmartPay360 error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('spay_chats');
      localStorage.removeItem('spay_tx');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
          {/* Ambient light flares */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-[#3b82f6]/10 rounded-full blur-[160px]"></div>
            <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] bg-[#ef4444]/15 rounded-full blur-[140px]"></div>
          </div>

          <div className="max-w-md w-full p-8 rounded-[2.5rem] bg-slate-900/80 backdrop-blur-2xl border border-red-500/10 shadow-2xl relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 animate-pulse border border-red-500/20">
              <AlertOctagon size={32} />
            </div>

            <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2 leading-none">
              Resilience Recovery
            </h1>
            <p className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest mb-4">
              Fault Tolerance Intercepted
            </p>

            <p className="text-xs text-slate-400 leading-relaxed font-semibold uppercase tracking-wider mb-6 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl w-full">
              {this.state.error?.message || "An unexpected render deviation occurred. The system self-healed and state is synchronized correctly."}
            </p>

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={14} /> Reset and Self-Heal Now
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
