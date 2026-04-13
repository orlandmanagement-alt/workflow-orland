import React from 'react';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-red-800">{message}</p>
        {onClose && (
          <button onClick={onClose} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
