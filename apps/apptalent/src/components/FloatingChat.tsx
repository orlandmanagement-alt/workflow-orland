import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FloatingChat() {
  const hasUnreadMessages = true; // Simulasi ada pesan masuk

  return (
    <Link to="/messages" className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[90] group animate-in slide-in-from-bottom-5">
        <div className="relative h-14 w-14 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-600/30 group-hover:scale-110 group-hover:bg-brand-700 transition-all border-2 border-white dark:border-slate-800">
            <MessageSquare size={24} />
            {hasUnreadMessages && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
            )}
        </div>
    </Link>
  );
}
