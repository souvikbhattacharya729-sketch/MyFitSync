import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = "Unable to load data",
  message = "An error occurred while fetching information from the server.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center my-4 shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4 border border-rose-200">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-rose-900 mb-1">{title}</h3>
      <p className="text-sm text-rose-700/80 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-rose-700 active:scale-95 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Request
        </button>
      )}
    </div>
  );
};
