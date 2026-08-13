import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onDismiss, className = '' }) => (
  <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3 ${className}`}>
    <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-green-800 dark:text-green-200 font-bold text-sm">{message}</p>
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
      >
        ✕
      </button>
    )}
  </div>
);

export default SuccessAlert;
