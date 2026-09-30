import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ReadOnlyNotifications({ notifications }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-3">
      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Automatic Notifications Dispatched Log
        </h3>
        <p className="text-xs text-gray-500 italic mt-0.5">
          These alerts were sent automatically by the system. You do not need to contact these parties separately.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700 uppercase">
              <th className="py-2 px-3">Time Sent</th>
              <th className="py-2 px-3">Who Was Notified</th>
              <th className="py-2 px-3">Their Role</th>
              <th className="py-2 px-3">Channel</th>
              <th className="py-2 px-3 text-right">Delivery Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {notifications.map((n, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-2 px-3 font-mono text-gray-600">{n.time}</td>
                <td className="py-2 px-3 font-bold text-gray-900">{n.who}</td>
                <td className="py-2 px-3 text-gray-700">{n.role}</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded font-semibold text-gray-800">
                    {n.channel}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <span className="inline-flex items-center gap-1 text-[#138808] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {n.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
