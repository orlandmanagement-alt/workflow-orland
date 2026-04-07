import React, { useEffect, useState } from 'react';

export function Toast({ message, onClose, duration = 3000 }: { message: string, onClose: () => void, duration?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300); // Wait for transition before unmounting
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
        {message}
      </div>
    </div>
  );
}
