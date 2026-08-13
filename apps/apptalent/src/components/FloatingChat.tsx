import { MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function FloatingChat() {
  const location = useLocation();
  const hasUnreadMessages = true;

  // Sembunyikan floating icon jika sedang berada di halaman pesan
  if (location.pathname === '/messages') return null;

  return (
    <Link to="/messages" className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-[90] group animate-in slide-in-from-bottom-5">
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#00a884]/40 group-hover:scale-110 transition-all border-[3px] border-white dark:border-[#0b141a]">
            <MessageSquare size={26} className="fill-white/20" />
            {hasUnreadMessages && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-white dark:border-[#0b141a] rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">2</span>
            )}
        </div>
    </Link>
  );
}
