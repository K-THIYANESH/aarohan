import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ReadOnlyNotifications from '../../components/ReadOnlyNotifications';
import { ArrowLeft, CheckCircle2, AlertOctagon, Edit3, ShieldAlert } from 'lucide-react';

export default function SiteLandRecords({ showBanner }) {
  const { siteId } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Survey record edit inline state
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editForm, setEditForm] = useState({
    ownership_status: 'GOVERNMENT_LAND',
    acquisition_status: 'IN_PROGRESS',
    notes: '',
  });

  const fetchSiteDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/revenue/sites/${siteId}`);
      setSite(response.data);
    } catch (err) {
      console.error('Error fetching site land records:', err);
      if (showBanner) showBanner('Failed to load site land records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteDetail();
  }, [siteId]);

  const handleUpdateRecord = async (recordId) => {
    setActionLoading(true);
    try {
      await api.put(`/revenue/survey-records/${recordId}`, {
        ...editForm,
        verified_by: 'Revenue Officer M. K. Pillai',
      });
      if (showBanner) showBanner('Survey record updated.', 'success');
      setEditingRecordId(null);
      fetchSiteDetail();
    } catch (err) {
      console.error('Error updating survey record:', err);
      if (showBanner) showBanner('Failed to update record.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteVerification = async () => {
    setActionLoading(true);
    try {
      const response = await api.post(`/revenue/sites/${siteId}/complete-verification?officer_name=Revenue Officer M. K. Pillai`);
      setSite(response.data);
      if (showBanner) showBanner('Site land verification finalized for district meeting.', 'success');
    } catch (err) {
      console.error('Error completing verification:', err);
      if (showBanner) showBanner('Failed to complete verification.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" color="text-navy-blue" />
        <p className="text-gray-600 font-semibold text-sm">Loading Land Survey Records...</p>
      </div>
    );
  }

  if (!site) return null;

  const surveyRecords = site.survey_records || [];
  const verifiedCount = surveyRecords.filter((r) => r.ownership_status !== 'UNKNOWN').length;
  const totalCount = surveyRecords.length;
  const hasDisputes = surveyRecords.some((r) => r.ownership_status === 'DISPUTED');
  const allVerified = totalCount === 0 || verifiedCount === totalCount;

  const getOwnershipBadge = (status) => {
    switch (status) {
      case 'CLEAR':
        return <span className="px-2.5 py-0.5 bg-[#138808] text-white text-xs font-bold rounded">Clear</span>;
      case 'GOVERNMENT_LAND':
        return <span className="px-2.5 py-0.5 bg-blue-700 text-white text-xs font-bold rounded">Government Land</span>;
      case 'DISPUTED':
        return <span className="px-2.5 py-0.5 bg-[#C62828] text-white text-xs font-bold rounded">Disputed</span>;
      case 'FOREST_LAND':
        return <span className="px-2.5 py-0.5 bg-[#F57C00] text-white text-xs font-bold rounded">Forest Land</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-gray-400 text-white text-xs font-bold rounded">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-xs font-semibold text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-[#000080] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Land Verification Tasks
        </Link>
        <span>&gt;</span>
        <span className="text-gray-800 font-bold">{site.name}</span>
      </nav>

      {/* Top Header Card */}
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h1 className="text-2xl font-black text-[#000080]">{site.name}</h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              District: {site.district} • Capacity: <span className="font-bold text-gray-900">{site.capacity_families} families</span> • Linked Village: <span className="font-bold text-[#000080]">{site.linked_village_name}</span>
            </p>
          </div>
          <span className="px-3 py-1 bg-[#138808] text-white text-xs font-bold rounded-full">
            Rank: {site.rank_label}
          </span>
        </div>

        {/* AHP Score & Hazard Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200 space-y-1">
            <span className="font-bold text-[#000080] block uppercase">AHP Suitability Assessment</span>
            <p className="text-gray-800 font-medium leading-relaxed">{site.ahp_score_summary}</p>
          </div>

          <div className={`p-4 rounded-lg border space-y-1 ${site.site_hazard_score < 0.30 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'}`}>
            <span className="font-bold block uppercase">Site Own Hazard Risk Score</span>
            <span className="text-2xl font-black">{site.site_hazard_score}</span>
            <span className="text-[11px] block font-semibold">
              {site.site_hazard_score < 0.30 ? '✓ Safe — Below 0.30 Threshold' : '✗ Disqualified — Exceeds 0.30 Threshold'}
            </span>
          </div>
        </div>

        {/* AHP Breakdown Table */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">AHP Suitability Breakdown</h3>
          <table className="w-full text-left text-xs border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100 font-bold text-gray-700">
                <th className="p-2 border">Criterion</th>
                <th className="p-2 border text-center">Weight</th>
                <th className="p-2 border text-center">Score</th>
                <th className="p-2 border">What This Means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {site.ahp_breakdown.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-2 border font-bold text-gray-900">{row.criterion}</td>
                  <td className="p-2 border text-center font-mono">{row.weight}</td>
                  <td className="p-2 border text-center font-bold text-[#000080]">{row.score}</td>
                  <td className="p-2 border text-gray-700">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Land Records Survey Table */}
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wider">
          Land Records Survey Table — Survey Numbers Verification
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700 uppercase">
                <th className="p-3">Survey Number</th>
                <th className="p-3">Recorded Owner</th>
                <th className="p-3">Ownership Status</th>
                <th className="p-3">Acquisition Status</th>
                <th className="p-3">Officer Notes</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {surveyRecords.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-[#000080]">{r.survey_number}</td>
                  <td className="p-3 font-bold text-gray-900">{r.recorded_owner}</td>
                  <td className="p-3">{getOwnershipBadge(r.ownership_status)}</td>
                  <td className="p-3 font-semibold text-gray-800">{r.acquisition_status}</td>
                  <td className="p-3 text-gray-600 max-w-xs">{r.notes || '—'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        if (editingRecordId === r.id) {
                          setEditingRecordId(null);
                        } else {
                          setEditingRecordId(r.id);
                          setEditForm({
                            ownership_status: r.ownership_status,
                            acquisition_status: r.acquisition_status,
                            notes: r.notes || '',
                            dispute_details: '',
                          });
                        }
                      }}
                      className="px-3 py-1 border border-[#000080] text-[#000080] font-bold rounded hover:bg-blue-50"
                    >
                      {editingRecordId === r.id ? 'Cancel' : 'Update'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inline Edit Form Modal / Overlay */}
        {editingRecordId && (
          <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-[#000080] uppercase">Update Survey Record</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Ownership Status</label>
                <select
                  value={editForm.ownership_status}
                  onChange={(e) => setEditForm({ ...editForm, ownership_status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded bg-white"
                >
                  <option value="CLEAR">Clear</option>
                  <option value="GOVERNMENT_LAND">Government Land</option>
                  <option value="DISPUTED">Disputed</option>
                  <option value="FOREST_LAND">Forest Land</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Acquisition Status</label>
                <select
                  value={editForm.acquisition_status}
                  onChange={(e) => setEditForm({ ...editForm, acquisition_status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded bg-white"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ACQUIRED">Acquired</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>

            {editForm.ownership_status === 'DISPUTED' && (
              <div>
                <label className="block font-bold text-red-700 text-xs mb-1">Dispute Details (Required)</label>
                <input
                  type="text"
                  value={editForm.dispute_details || ''}
                  onChange={(e) => setEditForm({ ...editForm, dispute_details: e.target.value })}
                  className="w-full p-2 border border-red-300 rounded bg-white text-xs text-red-900 font-medium"
                  placeholder="Explain nature of ownership dispute (required by system)..."
                  required
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-gray-700 text-xs mb-1">Officer Notes</label>
              <input
                type="text"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded bg-white text-xs"
                placeholder="Enter title dispute details or NOC notes..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingRecordId(null)}
                className="px-3 py-1.5 bg-gray-200 text-xs font-semibold rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRecord(editingRecordId)}
                disabled={actionLoading}
                className="px-4 py-1.5 bg-[#000080] text-white text-xs font-bold rounded shadow-xs"
              >
                Save Updates
              </button>
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs font-bold">
          <span>
            {verifiedCount} of {totalCount} survey numbers verified. {hasDisputes ? '1 dispute unresolved.' : '0 disputes.'}
          </span>
          <span className="text-[#000080]">Acquisition Complexity: High</span>
        </div>
      </div>

      {/* Read-Only Notifications Log */}
      <ReadOnlyNotifications
        notifications={[
          { time: '11:00 AM', who: 'Revenue Inspector Wayanad', role: 'Revenue', channel: 'SMS', status: 'Delivered' }
        ]}
      />

      {/* Bottom Complete Verification Button */}
      <div className="pt-2">
        <button
          onClick={handleCompleteVerification}
          disabled={!allVerified || actionLoading}
          className={`w-full py-4 font-black text-sm rounded-lg shadow-md transition-all ${
            hasDisputes
              ? 'bg-[#F57C00] hover:bg-[#e06c00] text-white'
              : allVerified
              ? 'bg-[#138808] hover:bg-[#0e6906] text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasDisputes
            ? 'Mark Complete — Disputes Noted (District Meeting Will Be Informed)'
            : 'Mark Verification Complete'}
        </button>
      </div>
    </div>
  );
}
