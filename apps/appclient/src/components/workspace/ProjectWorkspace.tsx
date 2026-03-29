import React, { useState, useEffect } from 'react';
import { CompanyCategory } from '@/store/useAppStore';
import { PHWorkspace } from './PHWorkspace';
import { EOWorkspace } from './EOWorkspace';
import { KOLWorkspace } from './KOLWorkspace';
import { Loader2, AlertCircle } from 'lucide-react';

interface ProjectWorkspaceProps {
  projectId: string;
  projectCategory: CompanyCategory | string;
}

export const ProjectWorkspace = ({ projectId, projectCategory }: ProjectWorkspaceProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  useEffect(() => {
    // Simulasi Fetching Data Hono API untuk Workspace Proyek Spesifik
    // Endpoint: api.orlandmanagement.com/api/v1/projects/:id/workspace
    let isMounted = true;
    
    setTimeout(() => {
      if (isMounted) {
        // Mock data
        setWorkspaceData({ status: 'active', synced_at: new Date().toISOString() });
        setIsLoading(false);
      }
    }, 800);

    return () => { isMounted = false; };
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-sm font-bold">Menyiapkan Ruang Kerja Operasional...</p>
      </div>
    );
  }

  // CERDAS SWITCH CASE (MULTI-TENANT WORKSPACES)
  switch (projectCategory) {
    case 'PH':
      return <PHWorkspace projectId={projectId} data={workspaceData} />;
    
    case 'EO':
      return <EOWorkspace projectId={projectId} data={workspaceData} />;
    
    case 'KOL':
    case 'BRAND':
      return <KOLWorkspace projectId={projectId} data={workspaceData} />;
      
    default:
      return (
        <div className="bg-red-50 text-red-600 p-8 rounded-2xl flex items-center justify-center gap-4 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={32} />
          <div>
            <h3 className="font-bold text-lg">Kategori Perusahaan Tidak Dikenal</h3>
            <p className="text-sm opacity-80">Gagal meload komponen operasi. Harap update profil Onboarding Anda.</p>
          </div>
        </div>
      );
  }
};
