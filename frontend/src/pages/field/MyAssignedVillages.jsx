import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

export default function MyAssignedVillages({ showBanner }) {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssigned = async () => {
      setLoading(true);
      try {
        const response = await api.get('/field/villages');
        setVillages(response.data);
      } catch (err) {
        console.error('Error fetching assigned villages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssigned();
  }, []);

  const getStatusBadge = (v) => {
    const isPastDue = v.assigned_visit_date && new Date(v.assigned_visit_date) < new Date() && v.visit_status !== 'REPORT_SUBMITTED';

    if (v.visit_status === 'REPORT_SUBMITTED') {
      return <span className="px-3 py-1 bg-[#138808] text-white text-xs font-bold rounded-full">Report Submitted</span>;
    }
    if (isPastDue) {
      return <span className="px-3 py-1 bg-[#F57C00] text-white text-xs font-bold rounded-full flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Visit Due</span>;
    }
    if (v.visit_status === 'VISIT_SCHEDULED') {
      return <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">Visit Scheduled</span>;
    }
    return <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">Visit Pending</span>;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#000080] text-white rounded-lg">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#000080]">My Assigned Villages</h1>
          <p className="text-xs font-semibold text-gray-500">
            List of target disaster villages assigned to Field Officer Anoop Kumar for physical inspection.
          </p>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" color="text-navy-blue" />
            <span className="text-sm font-semibold">Loading Task List...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3.5 px-4">Village & District</th>
                <th className="py-3.5 px-4">AI Tier</th>
                <th className="py-3.5 px-4">Visit Status</th>
                <th className="py-3.5 px-4">Assigned Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {villages.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => navigate(`/field/evidence/${v.id}`)}
                      className="font-bold text-[#000080] hover:underline text-left"
                    >
                      {v.name}
                    </button>
                    <div className="text-xs text-gray-500">{v.district}, {v.state}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`font-bold text-xs ${v.ai_tier === 'Immediate' ? 'text-[#C62828]' : 'text-gray-800'}`}>
                      {v.ai_tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(v)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-700 font-semibold">
                    {v.assigned_visit_date ? new Date(v.assigned_visit_date).toLocaleDateString('en-IN') : 'Unassigned'}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {v.visit_status === 'REPORT_SUBMITTED' ? (
                      <button
                        onClick={() => navigate('/field/reports')}
                        className="px-3 py-1.5 border border-[#138808] text-[#138808] font-bold text-xs rounded hover:bg-emerald-50"
                      >
                        View Submitted Report
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/field/evidence/${v.id}`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] text-white font-bold text-xs rounded shadow-xs"
                      >
                        Review Evidence & Start
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
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
