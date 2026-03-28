import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const [errorMSG, setErrorMSG] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const role = (params.get('role') || '').toLowerCase(); // FIX HURUF KECIL
      const userId = params.get('user_id');
      const name = params.get('name');
      const email = params.get('email');

      if (token && role) {
        if (role !== 'client') {
          alert("Akses Ditolak: Akun Anda terdaftar sebagai Talent. Mengalihkan...");
          localStorage.clear();
          window.location.replace('https://talent.orlandmanagement.com/');
          return;
        }

        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';
          // Verifikasi keaslian JWT dengan AppAPI
          await axios.get(`${API_URL}/auth/verify-session`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Simpan ke Zustand useAuthStore (orland-auth-storage)
          login(token, { id: userId, name, email, role: 'client' });
          
          // Pembersihan residual
          localStorage.removeItem('orland-auth-client');

          navigate('/dashboard', { replace: true });
        } catch (err) {
          setErrorMSG("Sesi validasi JWT gagal. Silakan login kembali ke SSO.");
          setTimeout(() => {
            window.location.replace('https://sso.orlandmanagement.com/');
          }, 3000);
        }

      } else {
        window.location.replace('https://sso.orlandmanagement.com/');
      }
    };

    verifyToken();
  }, [navigate, location, login]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#071122]">
      <div className="text-center animate-pulse">
        {errorMSG ? (
            <h2 className="text-xl font-bold text-red-500 mb-2">{errorMSG}</h2>
        ) : (
            <h2 className="text-xl font-bold text-brand-600 mb-2">Membuka Command Center...</h2>
        )}
      </div>
    </div>
  );
}
