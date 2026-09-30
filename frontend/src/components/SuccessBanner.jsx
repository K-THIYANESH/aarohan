import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function SuccessBanner({ message, type = 'success', onClose }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-lg border text-sm font-medium transition-all transform duration-300 animate-slide-down ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
          : 'bg-red-50 text-red-800 border-red-300'
      }`}
      style={{
        backgroundColor: isSuccess ? '#E8F5E9' : '#FFEBEE',
        color: isSuccess ? '#138808' : '#C62828',
        borderColor: isSuccess ? '#A5D6A7' : '#EF9A9A',
      }}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#138808]" />
      ) : (
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#C62828]" />
      )}
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-gray-500 hover:text-gray-700 font-bold"
        >
          ×
        </button>
      )}
    </div>
  );
}
