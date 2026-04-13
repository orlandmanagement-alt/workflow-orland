import React from 'react';

interface SuccessAlertProps {
  message: string;
  onClose?: () => void;
}

export function SuccessAlert({ message, onClose }: SuccessAlertProps) {
  return (
    <div className="rounded-md border border-green-200 bg-green-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-green-800">{message}</p>
        {onClose && (
          <button onClick={onClose} className="text-green-600 hover:text-green-800">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
