import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, className = '', message }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
    <Loader2 size={size} className="animate-spin text-blue-600" />
    {message && <p className="text-slate-600 dark:text-slate-400">{message}</p>}
  </div>
);

export default LoadingSpinner;
