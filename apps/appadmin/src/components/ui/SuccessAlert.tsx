import React from 'react';

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onDismiss }) => (
  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start justify-between gap-4">
    <div className="flex items-start gap-3 flex-1">
      <div className="mt-0.5 text-green-600 dark:text-green-400">✓</div>
      <div>
        <h3 className="font-semibold text-green-900 dark:text-green-200">Success</h3>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">{message}</p>
      </div>
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium text-sm"
      >
        ✕
      </button>
    )}
  </div>
);

export default SuccessAlert;
