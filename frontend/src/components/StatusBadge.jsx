import React from 'react';

export default function StatusBadge({ status, dangerLevel }) {
  // Danger Level flat pills
  if (dangerLevel) {
    switch (dangerLevel) {
      case 'EVACUATE_NOW':
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#C62828] text-white">
            Evacuate Now
          </span>
        );
      case 'NEEDS_ATTENTION':
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#F57C00] text-white">
            Needs Attention
          </span>
        );
      case 'KEEP_WATCHING':
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-gray-500 text-white">
            Keep Watching
          </span>
        );
      default:
        return null;
    }
  }

  // Case Status flat pills
  if (status) {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#138808] text-white">
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#333333] text-white">
            Rejected
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#000080] text-white">
            Escalated
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#FF9933] text-white">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-gray-400 text-white">
            {status}
          </span>
        );
    }
  }

  return null;
}
