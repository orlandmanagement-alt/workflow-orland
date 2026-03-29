import { MapPin, Calendar, DollarSign, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Project } from '@/types/project.types';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const isHighMatch = (project.matchScore || 0) >= 80;
  
  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-500 transition-all duration-300 overflow-hidden group">
      <div className="h-32 bg-slate-100 dark:bg-slate-800/50 relative">
        {project.moodboardUrl ? (
          <img src={project.moodboardUrl} alt="Moodboard" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-brand-500/10 to-purple-500/10 dark:from-brand-900/20 dark:to-purple-900/20">
            <span className="font-bold text-slate-300 dark:text-slate-700 text-xl tracking-widest uppercase">Open Casting</span>
          </div>
        )}
        
        {project.matchScore && (
          <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md ${isHighMatch ? 'bg-green-500/90 text-white' : 'bg-orange-500/90 text-white'}`}>
            <CheckCircle2 size={14} />
            {project.matchScore}% Match
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1 rounded-md">
            {project.clientName}
          </span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
            {project.roles?.length || 0} Roles
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 leading-tight">
          {project.title}
        </h3>

        <div className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{project.shootingDates?.start} - {project.shootingDates?.end}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">TBA (Jabodetabek)</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {project.payment?.currency} {project.payment?.amount?.toLocaleString()} <span className="text-xs font-normal text-slate-500">/{project.payment?.type}</span>
            </span>
          </div>
        </div>

        {project.mismatchReason && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 dark:text-red-300">
              <span className="font-bold block mb-0.5">Role Mismatch</span>
              {project.mismatchReason}
            </div>
          </div>
        )}

        <Link 
          to={`/jobs/board/${project.id}`}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm hover:scale-[1.02] shadow-md transition-all active:scale-95"
        >
          Lihat Detail <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};
