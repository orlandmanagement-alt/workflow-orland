import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message?: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, title, onDismiss, className = '' }) => (
  <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 ${className}`}>
    <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      {title && <p className="text-red-700 dark:text-red-300 font-bold text-sm">{title}</p>}
      {message && <p className="text-red-800 dark:text-red-200 font-bold text-sm">{message}</p>}
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
      >
        ✕
      </button>
    )}
  </div>
);

export default ErrorAlert;
