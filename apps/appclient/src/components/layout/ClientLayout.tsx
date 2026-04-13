import React from 'react';
import { useAuthStore } from '@/store/useAppStore';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated || false;
  const user = authStore.user || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Orland Client</h1>
            </div>
            <div className="flex items-center">
              {isAuthenticated && user ? (
                <span className="text-sm text-gray-700">{user.full_name || user.email}</span>
              ) : (
                <span className="text-sm text-gray-700">Not authenticated</span>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
