import React from 'react';

export default function LoadingSpinner({ size = 'md', color = 'text-saffron' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className="inline-flex items-center justify-center">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} ${color} border-t-transparent rounded-full animate-spin`}
        style={{ borderStyle: 'solid' }}
      ></div>
    </div>
  );
}
