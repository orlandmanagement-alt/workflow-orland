import React from 'react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start justify-between gap-4">
    <div className="flex items-start gap-3 flex-1">
      <div className="mt-0.5 text-red-600 dark:text-red-400">⚠️</div>
      <div>
        <h3 className="font-semibold text-red-900 dark:text-red-200">Error</h3>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{message}</p>
      </div>
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm"
      >
        ✕
      </button>
    )}
  </div>
);

export default ErrorAlert;
