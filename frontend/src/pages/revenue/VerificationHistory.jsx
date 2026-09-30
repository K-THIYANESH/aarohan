import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { History } from 'lucide-react';

export default function VerificationHistory({ showBanner }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get('/audit');
        // Filter revenue actions or show all system logs
        const revenueLogs = response.data.filter(l => 
          l.role === 'REVENUE_OFFICER' || 
          l.role === 'Revenue Officer' ||
          l.action.toLowerCase().includes('survey') ||
          l.action.toLowerCase().includes('verification')
        );
        setLogs(revenueLogs.length > 0 ? revenueLogs : response.data);
      } catch (err) {
        console.error('Error fetching verification history:', err);
        if (showBanner) showBanner('Failed to load verification history.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-[#000080]" />
          <h1 className="text-2xl font-bold text-[#000080]">Verification History</h1>
        </div>
        <p className="text-xs font-semibold text-gray-500 mt-1">
          This record is part of the official audit trail for land acquisition proceedings.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" color="text-navy-blue" />
            <span className="text-sm font-semibold">Loading Revenue Record...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Site / Survey Number</th>
                <th className="py-3.5 px-4">What Changed</th>
                <th className="py-3.5 px-4">Officer Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs font-medium text-gray-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    No revenue verification actions recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {new Date(l.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#000080]">{l.village_or_site}</td>
                    <td className="py-3 px-4 text-gray-900">{l.action}</td>
                    <td className="py-3 px-4 font-bold text-gray-800">{l.performed_by}</td>
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
