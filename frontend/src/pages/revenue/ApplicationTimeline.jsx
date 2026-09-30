import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Activity, CheckCircle2, Clock, AlertTriangle, AlertOctagon, Send } from 'lucide-react';

export default function ApplicationTimeline({ showBanner }) {
  const [villages, setVillages] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual meeting & decision form states
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendees, setAttendees] = useState(['District Collector', 'SDMA', 'BDO', 'Revenue Officer']);
  const [outcome, setOutcome] = useState('District committee reviewed AAROHAN brief and approved full relocation plan.');

  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState('Full Relocation Approved');

  // Escalation draft & dismiss states
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');

  const fetchVillages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/field/villages');
      setVillages(response.data);
      if (response.data.length > 0) {
        setSelectedVillage((prev) => prev ? response.data.find(v => v.id === prev.id) || response.data[0] : response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching pipeline villages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVillages();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" color="text-navy-blue" />
        <p className="text-gray-600 font-semibold text-sm">Loading Application Timeline Pipeline...</p>
      </div>
    );
  }

  const pipelineStages = [
    { num: 1, name: 'AI Flagged' },
    { num: 2, name: 'Field Visit Assigned' },
    { num: 3, name: 'Field Report Submitted' },
    { num: 4, name: 'Land Verification Started' },
    { num: 5, name: 'Land Verification Complete' },
    { num: 6, name: 'Notifications Sent — Circle 1 (Government)' },
    { num: 7, name: 'Notifications Sent — Circle 2 (Responders)' },
    { num: 8, name: 'Notifications Sent — Circle 3 (Civil Society)' },
    { num: 9, name: 'District Meeting Convened' },
    { num: 10, name: 'Decision Recorded' },
    { num: 11, name: 'Relocation In Progress' },
    { num: 12, name: 'Relocation Physically Verified' },
  ];

  // 45-day rule check
  const criticalOverdueVillages = villages.filter((v) => {
    const totalDays = Math.floor((new Date() - new Date(v.flagged_at)) / (1000 * 60 * 60 * 24));
    return totalDays > 45;
  });

  const getTierBorder = (tier) => {
    switch (tier) {
      case 'Immediate': return 'border-l-8 border-[#C62828]';
      case 'Short-term': return 'border-l-8 border-[#FF9933]';
      case 'Medium-term': return 'border-l-8 border-blue-600';
      default: return 'border-l-8 border-gray-400';
    }
  };

  const handleLogMeeting = async () => {
    setActionLoading(true);
    try {
      await api.post(`/revenue/villages/${selectedVillage.id}/log-meeting`, {
        meeting_date: meetingDate,
        attendees,
        outcome,
        officer_name: 'Revenue Officer M. K. Pillai'
      });
      if (showBanner) showBanner('District Emergency Meeting logged into official timeline.', 'success');
      setShowMeetingModal(false);
      fetchVillages();
    } catch (err) {
      console.error(err);
      if (showBanner) showBanner('Failed to log meeting.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDecision = async () => {
    setActionLoading(true);
    try {
      await api.post(`/revenue/villages/${selectedVillage.id}/record-decision`, {
        decision,
        officer_name: 'Revenue Officer M. K. Pillai'
      });
      if (showBanner) showBanner('Official Relocation Decision recorded!', 'success');
      setShowDecisionModal(false);
      fetchVillages();
    } catch (err) {
      console.error(err);
      if (showBanner) showBanner('Failed to record decision.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEscalation = async () => {
    setActionLoading(true);
    try {
      await api.post(`/escalations/villages/${selectedVillage.id}/escalate`, {
        next_authority: 'District Collector Wayanad & SDMA Member Secretary',
        message: `Urgent — ${selectedVillage.name} relocation case stalled at Stage #${selectedVillage.current_stage_index}`,
        officer_name: 'Revenue Officer M. K. Pillai'
      });
      if (showBanner) showBanner('Escalation alert sent to District Collector & SDMA.', 'success');
      setShowEscalationModal(false);
      fetchVillages();
    } catch (err) {
      console.error(err);
      if (showBanner) showBanner('Failed to send escalation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissEscalation = async () => {
    if (!escalationReason) {
      if (showBanner) showBanner('Please provide a reason for delay.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/escalations/villages/${selectedVillage.id}/dismiss`, {
        reason: escalationReason,
        officer_name: 'Revenue Officer M. K. Pillai'
      });
      if (showBanner) showBanner('Escalation threshold dismissed with recorded reason.', 'success');
      setShowEscalationModal(false);
      fetchVillages();
    } catch (err) {
      console.error(err);
      if (showBanner) showBanner('Failed to dismiss escalation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-[#000080]">Application Timeline & Pipeline Tracking</h1>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">
          Comprehensive 12-stage oversight view of every village relocation case in the district.
        </p>
      </div>

      {/* 45-Day Critical Overdue Top Banner */}
      {criticalOverdueVillages.length > 0 && (
        <div className="bg-red-950 text-white rounded-xl p-5 border-2 border-red-700 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-red-300 font-black text-sm uppercase tracking-wider">
            <AlertOctagon className="w-6 h-6 text-red-400 animate-pulse" />
            <span>Critical Overdue (45-Day Rule) — Immediate Escalation Required!</span>
          </div>
          <p className="text-xs text-gray-200">
            The following cases have been stuck for over 45 days. High-priority intervention is required.
          </p>
          <div className="flex gap-3 pt-1">
            {criticalOverdueVillages.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedVillage(c)}
                className="px-3 py-1.5 bg-red-800 hover:bg-red-700 font-bold text-xs rounded border border-red-500"
              >
                {c.name} (Stuck 48+ Days)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Left Village Cards / Right Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Village Cards List (4 columns) */}
        <div className="md:col-span-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Village Pipeline Queue</h2>
          {villages.map((v) => {
            const isSelected = selectedVillage?.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVillage(v)}
                className={`p-4 rounded-xl bg-white border cursor-pointer transition-all shadow-xs ${getTierBorder(v.ai_tier)} ${
                  isSelected ? 'ring-2 ring-[#000080] shadow-md' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[#000080] text-sm">{v.name}</h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                    {v.ai_tier}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Current Stage: <span className="font-bold text-gray-800">#{v.current_stage_index}</span></p>
                {v.is_escalated && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-orange-100 text-[#F57C00] font-bold text-[10px] rounded">
                    Escalated Alert Sent
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Side: Vertical Pipeline Stages (8 columns) */}
        <div className="md:col-span-8 bg-white rounded-xl p-6 border border-gray-300 shadow-md space-y-6">
          {selectedVillage && (
            <>
              <div className="border-b pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-[#000080]">{selectedVillage.name} Relocation Timeline</h2>
                  <p className="text-xs font-semibold text-gray-500">
                    District: {selectedVillage.district} • Tier: <span className="font-bold text-[#FF9933]">{selectedVillage.ai_tier}</span>
                  </p>
                </div>
                {selectedVillage.current_stage_index === 4 && (
                  <button
                    onClick={() => setShowEscalationModal(true)}
                    className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Review Escalation Draft
                  </button>
                )}
              </div>

              {/* Vertical Timeline Stepper */}
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200">
                {pipelineStages.map((stg) => {
                  const isCompleted = stg.num < selectedVillage.current_stage_index;
                  const isActive = stg.num === selectedVillage.current_stage_index;
                  const isOverdue = isActive && (stg.num === 4 || stg.num === 5);

                  return (
                    <div key={stg.num} className="relative flex items-start gap-4 pl-8">
                      {/* Timeline Icon Badge */}
                      <span className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                        isCompleted
                          ? 'bg-[#138808] text-white'
                          : isOverdue
                          ? 'bg-[#C62828] text-white animate-pulse'
                          : isActive
                          ? 'bg-[#FF9933] text-white ring-4 ring-orange-100'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? '✓' : stg.num}
                      </span>

                      <div className="flex-1 bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={isActive ? 'text-[#000080] text-sm' : 'text-gray-800'}>
                            {stg.num}. {stg.name}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] rounded uppercase ${
                            isCompleted ? 'bg-emerald-100 text-[#138808]' : isOverdue ? 'bg-red-100 text-[#C62828]' : isActive ? 'bg-orange-100 text-[#FF9933]' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : isActive ? 'Active Stage' : 'Pending'}
                          </span>
                        </div>

                        {/* Stage Specific Manual Log Buttons */}
                        {stg.num === 9 && isActive && (
                          <div className="pt-2">
                            <button
                              onClick={() => setShowMeetingModal(true)}
                              className="px-4 py-2 bg-[#000080] text-white text-xs font-bold rounded shadow-xs"
                            >
                              Log District Meeting
                            </button>
                          </div>
                        )}

                        {stg.num === 10 && isActive && (
                          <div className="pt-2">
                            <button
                              onClick={() => setShowDecisionModal(true)}
                              className="px-4 py-2 bg-[#FF9933] text-white text-xs font-bold rounded shadow-xs"
                            >
                              Record Official Decision
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Log Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-black text-[#000080]">Log District Emergency Meeting</h3>
            <div>
              <label className="block font-bold mb-1">Meeting Date</label>
              <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-bold mb-1">Meeting Outcome</label>
              <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full p-2 border rounded" rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMeetingModal(false)} className="px-3 py-1.5 bg-gray-200 font-bold rounded">Cancel</button>
              <button onClick={handleLogMeeting} disabled={actionLoading} className="px-4 py-1.5 bg-[#000080] text-white font-bold rounded">Save Meeting Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-black text-[#000080]">Record Official Relocation Decision</h3>
            <select value={decision} onChange={(e) => setDecision(e.target.value)} className="w-full p-3 border-2 border-[#FF9933] font-bold rounded">
              <option value="Full Relocation Approved">Full Relocation Approved</option>
              <option value="Seasonal Evacuation Approved">Seasonal Evacuation Approved</option>
              <option value="Partial Relocation Approved">Partial Relocation Approved</option>
              <option value="Monitoring Continued">Monitoring Continued</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDecisionModal(false)} className="px-3 py-1.5 bg-gray-200 font-bold rounded">Cancel</button>
              <button onClick={handleRecordDecision} disabled={actionLoading} className="px-4 py-1.5 bg-[#FF9933] text-white font-bold rounded">Record Decision</button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Draft Modal */}
      {showEscalationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-black text-[#C62828] uppercase">ESCALATION DRAFT — Ready for your review</h3>
            <div className="p-4 bg-red-50 border border-red-200 rounded font-mono space-y-1 text-gray-800">
              <p><strong>To:</strong> District Collector Wayanad & SDMA</p>
              <p><strong>Subject:</strong> Urgent — {selectedVillage.name} relocation case stalled at Land Verification</p>
              <p className="pt-2">This is to bring to your attention that the relocation case for {selectedVillage.name} has been pending for over threshold limit.</p>
            </div>
            <div>
              <label className="block font-bold mb-1">Acceptable Delay Reason (If dismissing):</label>
              <input type="text" value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)} placeholder="Provide reason why delay is acceptable..." className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <button onClick={handleDismissEscalation} className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded">Dismiss — Add Reason</button>
              <button onClick={handleSendEscalation} disabled={actionLoading} className="px-4 py-2 bg-[#C62828] text-white font-bold rounded">Send This Escalation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
