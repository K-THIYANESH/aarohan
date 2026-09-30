import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#000080] mb-2">{title || 'Confirm Action'}</h3>
        <p className="text-sm text-gray-700 leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#FF9933] hover:bg-[#e68a2e] rounded-md shadow-md transition-all disabled:opacity-50"
          >
            {loading && <LoadingSpinner size="sm" color="text-white" />}
            Yes, Approve & Send
          </button>
        </div>
      </div>
    </div>
  );
}
