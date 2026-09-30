import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import PipelineTracker from '../components/PipelineTracker';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import {
  ShieldAlert, ArrowLeft, Send, CheckCircle2, Clock,
  FileCheck, AlertOctagon, UserCheck, MapPin, Camera, AlertCircle
} from 'lucide-react';

export default function CaseDetail({ showBanner, userRole }) {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('field_report'); // 'ai_evidence' | 'field_report'

  const [selectedSiteId, setSelectedSiteId] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvedSuccessData, setApprovedSuccessData] = useState(null);

  // Decision forms input states
  const [inputMode, setInputMode] = useState(null); // 'MORE_INFO' | 'REJECT' | 'ESCALATE'
  const [notesInput, setNotesInput] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fetchCaseDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cases/${id}`);
      setCaseData(response.data);
      if (response.data.top_relocation_sites && response.data.top_relocation_sites.length > 0) {
        setSelectedSiteId(response.data.top_relocation_sites[0].id);
      }
    } catch (err) {
      console.error('Error loading case detail:', err);
      if (showBanner) showBanner('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const handleBdoDecision = async (decision) => {
    if ((decision === 'REJECT' || decision === 'MORE_INFO') && !notesInput.trim()) {
      if (showBanner) showBanner('Please provide notes/reason for your decision', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const response = await api.post(`/cases/${id}/bdo-decision`, {
        decision: decision,
        notes: notesInput,
        reviewed_by: 'BDO Vythiri — K. Ramesh',
        more_info_request: notesInput,
      });
      setCaseData(response.data);
      setInputMode(null);
      setNotesInput('');
      if (showBanner) showBanner(`BDO decision recorded: ${decision}`, 'success');
    } catch (err) {
      console.error('Error recording BDO decision:', err);
      if (showBanner) showBanner('Failed to record BDO decision.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollectorDecision = async (decision) => {
    if ((decision === 'REJECT' || decision === 'MORE_INFO') && !notesInput.trim()) {
      if (showBanner) showBanner('Please provide notes/reason for your decision', 'error');
      return;
    }

    if (decision === 'APPROVE') {
      setIsConfirmModalOpen(true);
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post(`/cases/${id}/collector-decision`, {
        decision: decision,
        notes: notesInput,
        reviewed_by: 'District Collector R. Sharma',
        approved_site_id: selectedSiteId,
        more_info_request: notesInput,
      });
      setCaseData(response.data);
      setInputMode(null);
      setNotesInput('');
      if (showBanner) showBanner(`Collector decision recorded: ${decision}`, 'success');
    } catch (err) {
      console.error('Error recording Collector decision:', err);
      if (showBanner) showBanner('Failed to record Collector decision.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollectorDirectApproveConfirm = async () => {
    setActionLoading(true);
    try {
      const response = await api.post(`/cases/${id}/collector-decision`, {
        decision: 'APPROVE',
        notes: notesInput || 'Approved directly by District Collector based on verified field report.',
        reviewed_by: 'District Collector R. Sharma',
        approved_site_id: selectedSiteId,
      });
      setCaseData(response.data);
      setApprovedSuccessData(response.data);
      setIsConfirmModalOpen(false);
      if (showBanner) showBanner('Evacuation Approved & Emergency Alerts Dispatched!', 'success');
    } catch (err) {
      console.error('Error approving case:', err);
      if (showBanner) showBanner('Failed to approve evacuation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSdmaDecision = async (decision) => {
    if (decision === 'APPROVE') {
      setIsConfirmModalOpen(true);
      return;
    }

    if (decision === 'REJECT' && !notesInput.trim()) {
      if (showBanner) showBanner('Please provide rejection reason', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post(`/cases/${id}/sdma-decision`, {
        decision: decision,
        notes: notesInput,
        reviewed_by: 'SDMA Member Secretary — A. K. Varma',
        approved_site_id: selectedSiteId,
      });
      setCaseData(response.data);
      setInputMode(null);
      if (showBanner) showBanner('SDMA Decision recorded', 'success');
    } catch (err) {
      console.error('Error recording SDMA decision:', err);
      if (showBanner) showBanner('Failed to record SDMA decision.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSdmaApproveConfirm = async () => {
    setActionLoading(true);
    try {
      const response = await api.post(`/cases/${id}/sdma-decision`, {
        decision: 'APPROVE',
        notes: 'Final State Approval granted. Disaster relocation authorized.',
        reviewed_by: 'SDMA Member Secretary — A. K. Varma',
        approved_site_id: selectedSiteId,
      });
      setCaseData(response.data);
      setApprovedSuccessData(response.data);
      setIsConfirmModalOpen(false);
      if (showBanner) showBanner('SDMA Final Approval Granted & Alerts Fired!', 'success');
    } catch (err) {
      console.error('Error approving case:', err);
      if (showBanner) showBanner('Failed to approve evacuation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" color="text-navy-blue" />
        <p className="text-gray-600 font-semibold text-sm">Loading Case Details...</p>
      </div>
    );
  }

  if (!caseData) return null;

  const { village, stage, status, field_report, top_relocation_sites } = caseData;

  // Full-page green success state after approval
  if (approvedSuccessData || stage === 'ALERTS_FIRED') {
    const siteObj = top_relocation_sites.find((s) => s.id === selectedSiteId) || top_relocation_sites[0];
    const timestampNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        <div className="bg-[#E8F5E9] border-2 border-[#138808] rounded-xl p-8 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 bg-[#138808] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-[#138808]">OFFICIAL EVACUATION ORDER APPROVED</h2>
          <p className="text-gray-700 font-medium max-w-xl mx-auto text-sm">
            Final approval recorded by <span className="font-bold">{caseData.sdma_reviewed_by || caseData.collector_reviewed_by || 'Authority'}</span>. Automated emergency alert broadcasts dispatched.
          </p>

          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto text-left border border-emerald-200 shadow-xs space-y-4 mt-6">
            <h3 className="text-sm font-bold text-[#000080] uppercase tracking-wider border-b border-gray-200 pb-2">
              Legal Approval Chain Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Village & District</span>
                <span className="font-bold text-gray-800">{village.name}, {village.district}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Field Count vs AI</span>
                <span className="font-bold text-gray-800">
                  {field_report ? field_report.actual_families_count : village.families_affected} Families
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">BDO Escalated By</span>
                <span className="font-bold text-gray-800">{caseData.bdo_reviewed_by || 'BDO Vythiri'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Collector Escalated By</span>
                <span className="font-bold text-gray-800">{caseData.collector_reviewed_by || 'Collector Wayanad'}</span>
              </div>
            </div>

            <div className="pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Parties Notified & Dispatch Log</h4>
              <div className="space-y-2">
                {caseData.notified_parties &&
                  caseData.notified_parties.map((party, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200 text-xs font-medium">
                      <span className="text-gray-800 font-bold">{party}</span>
                      <span className="text-[#138808] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched {timestampNow}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-4">
            <Link
              to="/approved"
              className="px-6 py-2.5 bg-[#138808] hover:bg-[#0e6906] text-white font-bold rounded-lg text-sm shadow-md"
            >
              View Approved Actions & Audit Chain
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-sm"
            >
              Return to Case Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate family difference if field report exists
  const aiFamilies = village.families_affected;
  const fieldFamilies = field_report ? field_report.actual_families_count : null;
  const familyDiff = fieldFamilies !== null ? fieldFamilies - aiFamilies : 0;
  const showDiffWarning = fieldFamilies !== null && Math.abs(familyDiff) / aiFamilies > 0.05;

  return (
    <div className="space-y-6 pb-28">
      {/* Breadcrumb */}
      <nav className="text-xs font-semibold text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-[#000080] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Case Queue
        </Link>
        <span>&gt;</span>
        <span className="text-gray-800 font-bold">{village.name}, {village.district}</span>
      </nav>

      {/* Header with Pipeline Tracker */}
      <div className="bg-white rounded-lg p-5 border border-gray-300 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#000080]">{village.name}</h1>
            <p className="text-xs font-semibold text-gray-500">
              {village.district}, {village.state} • Danger Level: <span className="font-bold text-[#C62828]">{village.danger_level}</span>
            </p>
          </div>
          <div className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded border border-gray-300">
            Active Role: <span className="text-[#FF9933] uppercase">{userRole}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <PipelineTracker currentStage={stage} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-300 gap-2">
        <button
          onClick={() => setActiveTab('field_report')}
          className={`px-5 py-2.5 text-sm font-bold border-b-3 transition-all flex items-center gap-2 ${
            activeTab === 'field_report'
              ? 'border-[#FF9933] text-[#FF9933] bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Field Report (Ground Truth)
          {field_report && <span className="w-2 h-2 rounded-full bg-[#138808]"></span>}
        </button>
        <button
          onClick={() => setActiveTab('ai_evidence')}
          className={`px-5 py-2.5 text-sm font-bold border-b-3 transition-all flex items-center gap-2 ${
            activeTab === 'ai_evidence'
              ? 'border-[#FF9933] text-[#FF9933] bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          AI Data Evidence
        </button>
      </div>

      {/* TAB 1 — AI EVIDENCE */}
      {activeTab === 'ai_evidence' && (
        <div className="space-y-4">
          {/* Government Warning Banner */}
          <div className="bg-[#FFF3E0] border-l-4 border-[#F57C00] p-4 rounded-r-md text-[#F57C00] text-xs font-bold flex items-center gap-2 shadow-xs">
            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
            <span>This is AI-generated evidence. A field visit is required before any approval can be given.</span>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-4">
            <h3 className="font-bold text-[#000080] text-sm">AI Flagged Evidence Bullets</h3>
            <ul className="space-y-2 text-xs text-gray-800">
              {village.evidence.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#FF9933] font-bold">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2 — FIELD REPORT */}
      {activeTab === 'field_report' && (
        <div className="space-y-6">
          {!field_report ? (
            <div className="bg-white rounded-lg p-10 border border-gray-300 text-center space-y-3">
              <Clock className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800">Field Visit Not Yet Completed</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                A field officer must physically visit the village, count affected families, and submit an on-ground inspection report before BDO or Collector review.
              </p>
              <div className="pt-2">
                <Link
                  to="/field"
                  className="px-5 py-2 bg-[#FF9933] text-white font-bold text-xs rounded hover:bg-[#e68a2e] shadow-xs"
                >
                  Go to Field Officer Portal to Submit Report
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Field Visit Metadata Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-[#000080] uppercase tracking-wider block">
                      Official Inspection Record
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      Submitted by {field_report.submitted_by}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded border border-gray-300">
                    Visited on {field_report.visit_date} • GPS: {field_report.gps_coordinates}
                  </div>
                </div>

                {/* Family Count Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200">
                    <span className="text-xs text-gray-500 font-medium block">Physical Ground Count</span>
                    <span className="text-2xl font-black text-[#000080]">
                      {field_report.actual_families_count} <span className="text-xs font-normal text-gray-600">families</span>
                    </span>
                    {showDiffWarning && (
                      <span className="ml-2 text-xs font-bold text-[#C62828] bg-red-100 px-2 py-0.5 rounded">
                        +{familyDiff} families higher than AI estimate ({aiFamilies})
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 font-medium block">Houses in Direct Risk Zone</span>
                    <span className="text-2xl font-black text-gray-800">
                      {field_report.houses_in_risk_zone} <span className="text-xs font-normal text-gray-600">structures</span>
                    </span>
                  </div>
                </div>

                {/* Plain English Field Observations */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Field Officer Observations</h4>
                  <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3.5 rounded border border-gray-200">
                    "{field_report.observations}"
                  </p>
                </div>

                {/* Key On-Ground Hazard Findings Checklist */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-gray-500 block">Landslide Signs</span>
                    <span className={`font-bold ${field_report.landslide_signs_observed ? 'text-[#C62828]' : 'text-[#138808]'}`}>
                      {field_report.landslide_signs_observed ? '✓ Observed' : '✗ None'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-gray-500 block">Ground Cracks</span>
                    <span className={`font-bold ${field_report.cracks_in_ground_observed ? 'text-[#C62828]' : 'text-[#138808]'}`}>
                      {field_report.cracks_in_ground_observed ? '✓ Present' : '✗ None'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-gray-500 block">Water Logging</span>
                    <span className={`font-bold ${field_report.water_logging_observed ? 'text-[#F57C00]' : 'text-[#138808]'}`}>
                      {field_report.water_logging_observed ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-gray-500 block">Road Condition</span>
                    <span className="font-bold text-gray-800">{field_report.road_condition}</span>
                  </div>
                </div>

                {/* Community Willingness & Officer Recommendation */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-500">Community Willingness: </span>
                    <span className="font-bold text-gray-800">{field_report.community_willing_to_relocate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Field Recommendation: </span>
                    <span className="px-3 py-1 bg-[#C62828] text-white font-bold rounded">
                      {field_report.field_officer_recommendation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Relocation Site Selection for BDO / Collector / SDMA */}
              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#000080] uppercase tracking-wider">
                  Target Relocation Site Selection
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {top_relocation_sites.map((site) => (
                    <div
                      key={site.id}
                      onClick={() => setSelectedSiteId(site.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSiteId === site.id
                          ? 'border-[#138808] bg-emerald-50/40 shadow-xs'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                        <input
                          type="radio"
                          name="target_site"
                          checked={selectedSiteId === site.id}
                          onChange={() => setSelectedSiteId(site.id)}
                          className="accent-[#138808]"
                        />
                        <span>{site.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 ml-6 mt-1">
                        Distance: {site.distance_km} km • Remaining: {site.capacity_families - site.occupied_families} families
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Form Overlay when buttons clicked */}
      {inputMode && (
        <div className="bg-orange-50 border border-orange-300 rounded-lg p-5 space-y-3">
          <label className="block text-xs font-bold text-gray-800 uppercase">
            {inputMode === 'MORE_INFO'
              ? 'Specify What Additional Information is Required from Field Officer:'
              : inputMode === 'REJECT'
              ? 'Specify Official Reason for Rejection:'
              : 'Add Escalation Notes for Senior Officers:'}
          </label>
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="w-full p-3 border border-orange-300 rounded bg-white text-sm focus:outline-hidden"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setInputMode(null)}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (userRole === 'BDO') handleBdoDecision(inputMode === 'ESCALATE' ? 'ESCALATE_TO_COLLECTOR' : inputMode);
                else if (userRole === 'Collector') handleCollectorDecision(inputMode === 'ESCALATE' ? 'ESCALATE_TO_SDMA' : inputMode);
                else if (userRole === 'SDMA') handleSdmaDecision(inputMode);
              }}
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#000080] rounded shadow-xs"
            >
              Submit Decision
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Multi-Role Action Bar */}
      <div className="fixed bottom-0 right-0 left-[240px] bg-white border-t border-gray-300 p-4 shadow-2xl z-30 flex items-center justify-between">
        <div className="text-xs font-bold text-gray-800">
          Current Stage: <span className="text-[#FF9933] uppercase">{stage}</span> • Acting as:{' '}
          <span className="text-[#000080] font-black">{userRole}</span>
        </div>

        {/* BDO ACTIONS */}
        {userRole === 'BDO' && (stage === 'FIELD_SUBMITTED' || stage === 'BDO_REVIEW') && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setInputMode('MORE_INFO');
              }}
              className="px-4 py-2 border border-[#F57C00] text-[#F57C00] hover:bg-orange-50 font-bold text-xs rounded"
            >
              Request More Information
            </button>

            <button
              onClick={() => {
                setInputMode('REJECT');
              }}
              className="px-4 py-2 border border-gray-400 text-gray-700 hover:bg-gray-100 font-bold text-xs rounded"
            >
              Reject Case
            </button>

            <button
              onClick={() => handleBdoDecision('ESCALATE_TO_COLLECTOR')}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-white font-extrabold text-xs rounded shadow-md flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Send to Collector
            </button>
          </div>
        )}

        {/* COLLECTOR ACTIONS */}
        {userRole === 'Collector' && (stage === 'COLLECTOR_REVIEW' || stage === 'FIELD_SUBMITTED' || stage === 'BDO_REVIEW') && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCollectorDecision('REJECT')}
              className="px-4 py-2 border border-gray-400 text-gray-700 hover:bg-gray-100 font-bold text-xs rounded"
            >
              Reject Case
            </button>

            <button
              onClick={() => handleCollectorDecision('ESCALATE_TO_SDMA')}
              disabled={actionLoading}
              className="px-5 py-2.5 border border-[#000080] text-[#000080] hover:bg-blue-50 font-bold text-xs rounded"
            >
              Escalate to SDMA
            </button>

            <button
              onClick={() => handleCollectorDecision('APPROVE')}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-white font-extrabold text-xs rounded shadow-md flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Approve & Send Alerts
            </button>
          </div>
        )}

        {/* SDMA ACTIONS */}
        {userRole === 'SDMA' && (stage === 'SDMA_APPROVED' || stage === 'COLLECTOR_REVIEW') && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSdmaDecision('REJECT')}
              className="px-4 py-2 border border-gray-400 text-gray-700 hover:bg-gray-100 font-bold text-xs rounded"
            >
              Reject
            </button>

            <button
              onClick={() => handleSdmaDecision('APPROVE')}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-[#138808] hover:bg-[#0e6906] text-white font-extrabold text-xs rounded shadow-md flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Final Approve — Fire Alerts
            </button>
          </div>
        )}

        {stage === 'ALERTS_FIRED' && (
          <span className="text-xs font-bold text-[#138808] flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Case Approval Completed
          </span>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirm Disaster Evacuation Authorization"
        message="Once approved, official emergency alerts will be dispatched immediately to the Collector, NDRF Battalion, and health units. This cannot be undone."
        onConfirm={userRole === 'SDMA' ? handleSdmaApproveConfirm : handleCollectorDirectApproveConfirm}
        onCancel={() => setIsConfirmModalOpen(false)}
        loading={actionLoading}
      />
    </div>
  );
}
