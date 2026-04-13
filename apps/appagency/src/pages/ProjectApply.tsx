import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MultiTalentSubmissionFlow } from '../components/multiTalent/MultiTalentSubmissionFlow';
import { useAuthStore } from '../store/useAppStore';

export default function ProjectApply() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const resolvedProjectId = projectId || 'unknown-project';
  const projectName = searchParams.get('name') || `Project ${resolvedProjectId}`;

  const agencyId = useMemo(() => {
    const candidate = user?.id;
    return candidate ? String(candidate) : 'agency-default';
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6 backdrop-blur-xl">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Project Apply</h1>
        <p className="mt-1 text-sm text-amber-500/80">
          Pilih banyak talent dari roster agensi untuk diajukan ke satu proyek klien.
        </p>
      </div>

      <MultiTalentSubmissionFlow
        projectId={resolvedProjectId}
        projectName={projectName}
        agencyId={agencyId}
      />
    </div>
  );
}
