import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Landmark, AlertTriangle, ArrowRight } from 'lucide-react';

export default function LandVerificationTasks({ showBanner }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const response = await api.get('/revenue/sites');
        setSites(response.data);
      } catch (err) {
        console.error('Error fetching land verification tasks, using fallback:', err);
        setSites([
          { id: 1, name: "Kalpetta Model Relocation Township", district: "Wayanad", verification_status: "COMPLETED", pending_days: 2 },
          { id: 2, name: "Meppadi Safe Ridge Housing Colony", district: "Wayanad", verification_status: "IN_PROGRESS", pending_days: 9 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-[#138808] text-white text-xs font-bold rounded-full">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">In Progress</span>;
      case 'BLOCKED':
        return <span className="px-3 py-1 bg-[#C62828] text-white text-xs font-bold rounded-full">Blocked (Disputes)</span>;
      default:
        return <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">Not Started</span>;
    }
  };

  const pendingSiteWarning = sites.find((s) => s.pending_days > 7 && s.verification_status !== 'COMPLETED');

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#000080] text-white rounded-lg">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#000080]">Land Verification Tasks</h1>
          <p className="text-xs font-semibold text-gray-500">
            Relocation site land record survey and title verification for Revenue Officer M. K. Pillai.
          </p>
        </div>
      </div>

      {/* Pending >7 days Warning Notice */}
      {pendingSiteWarning && (
        <div className="flex items-center gap-3 bg-[#FFF3E0] border-l-4 border-[#F57C00] p-4 rounded-r-md text-[#F57C00] font-medium text-xs shadow-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>
            Land verification for <strong>{pendingSiteWarning.name}</strong> has been pending for{' '}
            <strong>{pendingSiteWarning.pending_days} days</strong>. District meeting cannot proceed without this.
          </span>
        </div>
      )}

      {/* Task List Table */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" color="text-navy-blue" />
            <span className="text-sm font-semibold">Loading Land Tasks...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3.5 px-4">Relocation Site Name</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4">Linked Village</th>
                <th className="py-3.5 px-4 text-center">Survey Numbers</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {sites.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#000080]">{s.name}</td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">{s.district}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">{s.linked_village_name}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                    {s.survey_records ? s.survey_records.length : 3}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(s.verification_status)}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/revenue/sites/${s.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#000080] text-white hover:bg-blue-900 font-bold text-xs rounded transition-all shadow-xs"
                    >
                      {s.verification_status === 'COMPLETED' ? 'View Record' : 'Start Verification'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
