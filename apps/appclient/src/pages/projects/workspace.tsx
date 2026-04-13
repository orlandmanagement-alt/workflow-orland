import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store/useAppStore';
import { ProjectWorkspace } from '@/components/workspace/ProjectWorkspace';
import { ArrowLeft } from 'lucide-react';

export default function WorkspaceHost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Kategori ditarik dari AuthStore karena ini Single-Tenant per Client Login
  const companyCategory = useAppStore(state => state.companyCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071122] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <button 
          onClick={() => navigate(`/dashboard/projects/${id}`)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={16} /> Kembali ke Detail Proyek
        </button>

        {/* INJECT CERDAS WORKSPACE */}
        <div className="bg-white dark:bg-[#0b141a] rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-2 sm:p-8">
          <ProjectWorkspace projectId={id || 'UNKNOWN'} projectCategory={companyCategory || 'UNKNOWN'} />
        </div>

      </div>
    </div>
  );
}
