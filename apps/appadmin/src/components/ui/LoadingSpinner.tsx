import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} border-slate-300 dark:border-slate-600 border-t-brand-600 dark:border-t-brand-500 rounded-full animate-spin`}
      />
      {message && <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
