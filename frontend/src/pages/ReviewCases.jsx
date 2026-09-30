import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PipelineTracker from '../components/PipelineTracker';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertTriangle, ArrowRight, UserPlus } from 'lucide-react';

export default function ReviewCases({ showBanner, userRole }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModalCase, setAssignModalCase] = useState(null);
  const [officerName, setOfficerName] = useState('Field Officer Anoop Kumar');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cases');
      setCases(response.data);
    } catch (err) {
      console.error('Error fetching cases:', err);
      if (showBanner) showBanner('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const pendingCount = cases.filter(
    (c) => c.stage !== 'ALERTS_FIRED' && c.stage !== 'REJECTED'
  ).length;

  const hasOverduePending = cases.some((c) => {
    if (c.stage === 'ALERTS_FIRED' || c.stage === 'REJECTED') return false;
    const flaggedDate = new Date(c.flagged_at || c.created_at);
    const diffDays = (new Date() - flaggedDate) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  });

  const handleAssignSubmit = async () => {
    if (!assignModalCase) return;
    setActionLoading(true);
    try {
      await api.post(`/cases/${assignModalCase.id}/assign-field-officer`, {
        officer_name: officerName,
        visit_date: visitDate,
      });
      if (showBanner) showBanner(`Field Officer ${officerName} assigned!`, 'success');
      setAssignModalCase(null);
      fetchCases();
    } catch (err) {
      console.error('Error assigning field officer:', err);
      if (showBanner) showBanner('Failed to assign field officer.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionButton = (c) => {
    switch (c.stage) {
      case 'PENDING':
        return (
          <button
            onClick={() => setAssignModalCase(c)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] text-white font-bold text-xs rounded transition-all shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign Field Officer
          </button>
        );
      case 'FIELD_ASSIGNED':
        return (
          <span className="inline-block px-3 py-1.5 bg-gray-200 text-gray-600 font-bold text-xs rounded cursor-not-allowed">
            Awaiting Field Visit
          </span>
        );
      case 'FIELD_SUBMITTED':
        return (
          <button
            onClick={() => navigate(`/cases/${c.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#000080] text-[#000080] hover:bg-[#000080] hover:text-white font-bold text-xs rounded transition-all"
          >
            Review Field Report
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'BDO_REVIEW':
        return (
          <button
            onClick={() => navigate(`/cases/${c.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#000080] text-white hover:bg-blue-900 font-bold text-xs rounded transition-all"
          >
            {userRole === 'BDO' ? 'Give BDO Decision' : 'BDO Decision Pending'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'COLLECTOR_REVIEW':
        return (
          <button
            onClick={() => navigate(`/cases/${c.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#000080] text-[#000080] hover:bg-[#000080] hover:text-white font-bold text-xs rounded transition-all"
          >
            Review as Collector
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'SDMA_APPROVED':
        return (
          <button
            onClick={() => navigate(`/cases/${c.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#138808] text-white hover:bg-[#0e6906] font-bold text-xs rounded transition-all"
          >
            Final Approval — SDMA
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'ALERTS_FIRED':
        return (
          <span className="inline-block px-3 py-1.5 bg-[#138808] text-white font-bold text-xs rounded shadow-xs">
            Completed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-block px-3 py-1.5 bg-[#333333] text-white font-bold text-xs rounded">
            Rejected
          </span>
        );
      case 'MORE_INFO_NEEDED':
        return (
          <button
            onClick={() => navigate(`/cases/${c.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#F57C00] text-[#F57C00] hover:bg-orange-50 font-bold text-xs rounded transition-all"
          >
            Review Requested Info
          </button>
        );
      default:
        return (
          <button
            onClick={() => navigate(`/cases/${c.id}`)}
            className="px-3 py-1.5 border border-[#000080] text-[#000080] font-bold text-xs rounded"
          >
            View Details
          </button>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#000080]">Case Queue — Government Approval Lifecycle</h1>
        <span className="px-3 py-1 bg-[#FF9933] text-white font-bold text-sm rounded-full shadow-xs">
          {pendingCount} Active Cases
        </span>
      </div>

      {/* Warning banner */}
      {hasOverduePending && (
        <div className="flex items-center gap-3 bg-[#FFF3E0] border-l-4 border-[#F57C00] p-4 rounded-r-md text-[#F57C00] font-medium text-sm shadow-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>Some cases have not been reviewed in over 7 days. Please prioritize field verification & approval.</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" color="text-navy-blue" />
            <span className="text-sm font-semibold">Loading Case Queue...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3.5 px-4">Village & District</th>
                <th className="py-3.5 px-4 text-center">Families</th>
                <th className="py-3.5 px-4">AI Recommendation</th>
                <th className="py-3.5 px-4">Approval Pipeline Stage</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#000080]">{c.village_name}</div>
                    <div className="text-xs text-gray-500">{c.district}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-gray-800">
                    {c.families_affected}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-800">
                    {c.recommended_action}
                  </td>
                  <td className="py-3.5 px-4">
                    <PipelineTracker currentStage={c.stage} />
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {renderActionButton(c)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Field Officer Modal */}
      {assignModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-300">
            <h3 className="text-lg font-bold text-[#000080]">
              Assign Field Officer — {assignModalCase.village_name}
            </h3>
            <p className="text-xs text-gray-600">
              Select an inspector to perform physical ground verification and count affected families.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Field Officer Name</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Scheduled Visit Date</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAssignModalCase(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-[#FF9933] hover:bg-[#e68a2e] rounded shadow-xs flex items-center gap-1.5"
              >
                {actionLoading && <LoadingSpinner size="sm" color="text-white" />}
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
