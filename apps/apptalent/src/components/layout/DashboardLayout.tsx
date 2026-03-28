import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { performCleanLogout } from '@/lib/auth/logout'; // Import Sweeper

// Asumsi struktur dasar layout Anda
export default function DashboardLayout() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const authData = localStorage.getItem('orland-auth-talent');
    try {
      const parsed = JSON.parse(authData || '');
      if (parsed?.state?.token && parsed?.state?.role === 'talent') {
        setIsAuthorized(true);
      } else {
        throw new Error("Invalid Token");
      }
    } catch (e) {
      // Jika token hilang atau ghost data, tendang!
      performCleanLogout();
    }
  }, [navigate]);

  if (!isAuthorized) return null; // Jangan render apa-apa saat menendang

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071122]">
      {/* Tombol Logout Sementara (Pasang ikon/style sesuai selera Anda nanti) */}
      <header className="p-4 bg-white dark:bg-slate-900 border-b flex justify-between">
         <span className="font-bold">Talent Portal</span>
         <button onClick={performCleanLogout} className="text-red-500 text-sm font-bold">Logout</button>
      </header>
      
      <main className="p-4">
        <Outlet /> {/* Rute anak-anak akan muncul di sini */}
      </main>
    </div>
  );
}
