import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Penyesuaian __dirname untuk ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = {
  'src/store/useAppStore.ts': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create()(persist((set) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  role: 'talent',
  login: (token, userData = null) => {
    const firstName = userData?.first_name || '';
    const lastName = userData?.last_name || '';
    const fullName = userData?.full_name || (firstName + ' ' + lastName).trim() || 'User';
    return set({ 
      token, 
      isAuthenticated: true, 
      user: { ...userData, full_name: fullName },
      role: userData?.role || userData?.user_type || 'talent'
    });
  },
  setUser: (userData) => set((state) => ({
    user: { 
      ...state.user, 
      ...userData, 
      full_name: userData.full_name || (userData.first_name + ' ' + userData.last_name).trim() 
    },
    role: userData.role || userData.user_type || state.role
  })),
  logout: () => set({ token: null, isAuthenticated: false, user: null, role: 'talent' }),
}), { name: 'orland-auth-storage' }));`,

  'src/lib/api.ts': `import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

export const api = axios.create({
  baseURL: 'https://api.orlandmanagement.com/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      performCleanLogout();
    }
    return Promise.reject(err);
  }
);`,

  'src/lib/auth/logout.ts': `export const performCleanLogout = async () => {
  try {
    await fetch('https://sso.orlandmanagement.com/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {}
  localStorage.removeItem('orland-auth-storage');
  sessionStorage.clear();
  window.location.replace('https://sso.orlandmanagement.com/');
};`,

  'src/pages/auth/callback.tsx': `import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const isProcessed = useRef(false);

  useEffect(() => {
    if (isProcessed.current) return;
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      isProcessed.current = true;
      login(token, { 
        id: params.get('user_id'), 
        name: params.get('name'), 
        email: params.get('email'), 
        role: params.get('role') 
      });
      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, []);

  return <div className="h-screen flex items-center justify-center font-bold">Memverifikasi Sesi Aman...</div>;
}`,

  'src/components/layout/DashboardLayout.tsx': `import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

export default function DashboardLayout() {
  const { login, isAuthenticated } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('https://sso.orlandmanagement.com/api/auth/me', { method: 'GET', credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        login(data.token || 'active', data.user);
        setIsVerifying(false);
      } catch (e) {
        performCleanLogout();
      }
    }
    checkAuth();
  }, []);

  if (isVerifying) return <div className="h-screen flex items-center justify-center font-bold animate-pulse">Menghubungkan Portal Keamanan...</div>;
  return <Outlet />;
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log('✅ Updated: ' + filePath);
});

console.log('--- SELESAI: Jalur Auth Telah Diperbarui ---');