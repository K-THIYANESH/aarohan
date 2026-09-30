import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuditRecord({ showBanner, userRole }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLog = async () => {
      setLoading(true);
      try {
        const response = await api.get('/audit');
        setLogs(response.data);
      } catch (err) {
        console.error('Error fetching activity record:', err);
        if (showBanner) showBanner('Failed to load activity record.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLog();
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#000080]">Activity Record</h1>
        <p className="text-xs font-semibold text-gray-500 mt-1">
          This is your official record. Every action you take is logged with your name and timestamp.
        </p>
      </div>

      {/* Formal Register Table */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" color="text-navy-blue" />
            <span className="text-sm font-semibold">Loading Activity Log...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap">Date & Time</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Village or Site</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs font-medium text-gray-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-bold leading-snug">{log.action}</td>
                    <td className="py-3 px-4 font-bold text-[#000080] whitespace-nowrap">
                      {log.village_or_site}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs">{log.details || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
