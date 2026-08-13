import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full mb-4">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-xl font-bold dark:text-white mb-2">Waduh, Terjadi Masalah!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Halaman ini gagal dimuat. Jangan khawatir, tim teknis kami sudah diberitahu.</p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center px-6 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
          >
            <RefreshCcw size={18} className="mr-2" /> Segarkan Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
