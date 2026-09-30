import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Send, Lock, FileText, CheckCircle2, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

export default function SendNotifications({ showBanner }) {
  const { villageId } = useParams();
  const navigate = useNavigate();

  const [village, setVillage] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Circle 1 Form State
  const [collectorMsg, setCollectorMsg] = useState('');
  const [collectorChannel, setCollectorChannel] = useState('WhatsApp');
  const [sdmaMsg, setSdmaMsg] = useState('');
  const [sdmaChannel, setSdmaChannel] = useState('Email');
  const [bdoMsg, setBdoMsg] = useState('');
  const [bdoChannel, setBdoChannel] = useState('SMS');

  // Circle 2 Form State
  const [ndrfMsg, setNdrfMsg] = useState('');
  const [ndrfChannel, setNdrfChannel] = useState('SMS');
  const [hospitalMsg, setHospitalMsg] = useState('');
  const [hospitalChannel, setHospitalChannel] = useState('Email');

  // Circle 3 Form State
  const [selectedNgos, setSelectedNgos] = useState(['Sneha NGO Wayanad', 'Seva Bharathi']);
  const [ngoMsg, setNgoMsg] = useState('');
  const [ngoChannel, setNgoChannel] = useState('WhatsApp');
  const [panchayatMsg, setPanchayatMsg] = useState('');
  const [panchayatChannel, setPanchayatChannel] = useState('Email');

  // Collapsible accordion states
  const [c1Open, setC1Open] = useState(true);
  const [c2Open, setC2Open] = useState(true);
  const [c3Open, setC3Open] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [vRes, sRes] = await Promise.all([
          api.get(`/field/villages/${villageId}`),
          api.get('/revenue/sites')
        ]);
        const vData = vRes.data;
        setVillage(vData);
        setSites(sRes.data);

        // Pre-fill messages based on AI Tier
        const isImmediate = vData.ai_tier === 'Immediate';
        if (isImmediate) {
          setCollectorMsg(`AAROHAN ALERT — ACTION REQUIRED\nVillage: ${vData.name}, ${vData.district}\nRisk Level: IMMEDIATE — Hazard Score: ${vData.hazard_score}\nFamilies at risk: ${vData.population_triangulation.ai_used} (Field verified: 318)\nField Officer Recommendation: IMMEDIATE_EVACUATION\n\nA Decision Support Brief and site assessment has been prepared.\nPlease convene a district emergency meeting within 72 hours.\nAll documents are attached.`);
          setSdmaMsg(`AAROHAN ALERT — ACTION REQUIRED\nVillage: ${vData.name}, ${vData.district}\nRisk Level: IMMEDIATE — Hazard Score: ${vData.hazard_score}\nState Disaster Management Review Required.`);
          setBdoMsg(`AAROHAN SMS ALERT: Emergency evacuation brief prepared for ${vData.name}. Convene local team.`);

          setNdrfMsg(`STANDBY ALERT — No deployment yet\nLocation: ${vData.name}, ${vData.district}\nCoordinates: 11.4916, 76.0522\nPopulation: 318 | Road access: PARTIALLY_BLOCKED\nNearest helipad: 12.4km\nField Officer assessment: IMMEDIATE_EVACUATION\n\nPrepare assets. Await deployment order from District Collector.`);
          setHospitalMsg(`Precautionary alert: High-risk habitation identified.\nPrepare ${Math.ceil(vData.families_affected * 0.3)} additional bed capacity.\nNo emergency yet. Standby protocol only.`);
        } else {
          setCollectorMsg(`AAROHAN ADVISORY — REVIEW REQUIRED\nVillage: ${vData.name}, ${vData.district}\nRisk Level: SHORT-TERM\nFamilies at risk: ${vData.families_affected}\nField verification: Complete\n\nPlease schedule an SDMA review within 14 days.\nDecision Support Brief attached.`);
        }

        setNgoMsg(`AAROHAN COMMUNITY ALERT — ${vData.district}\nGovernment relocation process initiated for ${vData.families_affected} persons from ${vData.name}.\n\nYour registered district: ${vData.district}\nCan you support with shelter capacity?\n\nPlease confirm readiness.`);
        setPanchayatMsg(`Your village has been identified as a candidate relocation destination for ${vData.families_affected} persons from ${vData.name}.\n\nLand and water assessment: Best Option\nExpected intake: 500 families\nEstimated timeline: 3 months\n\nPlease confirm site readiness or flag any concerns within 7 days.`);
      } catch (err) {
        console.error('Error fetching village for notifications:', err);
        if (showBanner) showBanner('Failed to load notification form.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [villageId]);

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" color="text-navy-blue" />
        <p className="text-gray-600 font-semibold text-sm">Preparing Notification Circles...</p>
      </div>
    );
  }

  if (!village) return null;

  // Verify prerequisites: Field Report Submitted AND Land Verification Started
  const fieldReportDone = village.visit_status === 'REPORT_SUBMITTED';
  const linkedSite = sites.find((s) => s.linked_village_name === village.name);
  const landVerificationStarted = linkedSite && linkedSite.verification_status !== 'NOT_STARTED';
  const isPrerequisitesMet = fieldReportDone && landVerificationStarted;

  if (!isPrerequisitesMet) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <Link to="/" className="text-xs font-semibold text-gray-500 hover:text-[#000080] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="bg-white rounded-xl p-8 border border-gray-300 shadow-md text-center space-y-4">
          <div className="p-4 bg-orange-100 text-[#FF9933] w-fit mx-auto rounded-full">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#000080]">Notifications Locked</h2>
          <p className="text-xs text-gray-600 font-medium">
            Notifications cannot be sent until the field report and land verification are complete.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left text-xs space-y-2 border border-gray-200">
            <div className="flex items-center gap-2 font-bold">
              <span className={fieldReportDone ? 'text-[#138808]' : 'text-gray-400'}>
                {fieldReportDone ? '✓' : '✗'} Field Officer Report Submitted
              </span>
            </div>
            <div className="flex items-center gap-2 font-bold">
              <span className={landVerificationStarted ? 'text-[#138808]' : 'text-gray-400'}>
                {landVerificationStarted ? '✓' : '✗'} Relocation Site Land Verification Started
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSendCircle1 = async () => {
    setActionLoading(true);
    try {
      await api.post(`/revenue/villages/${village.id}/send-circle1`, {
        collector_message: collectorMsg || `AAROHAN ALERT: Relocation review required for ${village.name}`,
        collector_channel: collectorChannel,
        sdma_message: sdmaMsg || collectorMsg || `SDMA Alert for ${village.name}`,
        sdma_channel: sdmaChannel,
        bdo_message: bdoMsg || `BDO Alert: ${village.name} evacuation standby`,
        bdo_channel: bdoChannel,
        officer_name: 'Revenue Officer M. K. Pillai'
      });
      if (showBanner) showBanner('Circle 1 (Government) Notifications Dispatched Successfully!', 'success');
      navigate(0); // Refresh view
    } catch (err) {
      console.error(err);
      const rawDetail = err.response?.data?.detail;
      const errMsg = typeof rawDetail === 'string' 
        ? rawDetail 
        : (Array.isArray(rawDetail) ? rawDetail.map(e => e.msg).join(', ') : 'Failed to send Circle 1 notifications.');
      if (showBanner) showBanner(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCircle2 = async () => {
    setActionLoading(true);
    try {
      await api.post(`/revenue/villages/${village.id}/send-circle2`, {
        ndrf_message: ndrfMsg,
        ndrf_channel: ndrfChannel,
        hospital_message: hospitalMsg,
        hospital_channel: hospitalChannel,
        officer_name: 'Revenue Officer M. K. Pillai'
      });
      if (showBanner) showBanner('Circle 2 (Responders) Notifications Dispatched Successfully!', 'success');
      navigate(0);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to send Circle 2 notifications.';
      if (showBanner) showBanner(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCircle3 = async () => {
    setActionLoading(true);
    try {
      await api.post(`/revenue/villages/${village.id}/send-circle3`, {
        selected_ngos: selectedNgos,
        ngo_message: ngoMsg,
        ngo_channel: ngoChannel,
        panchayat_message: panchayatMsg,
        panchayat_channel: panchayatChannel,
        officer_name: 'Revenue Officer M. K. Pillai'
      });
      if (showBanner) showBanner('Circle 3 (Civil Society) Notifications Dispatched Successfully!', 'success');
      navigate(0);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to send Circle 3 notifications.';
      if (showBanner) showBanner(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const allCirclesSent = village.circle1_sent_at && village.circle2_sent_at && village.circle3_sent_at;

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#000080]">Send Ecosystem Notifications — {village.name}</h1>
          <p className="text-xs font-semibold text-gray-500">
            Manually trigger three notification circles for multi-department disaster response coordination.
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await api.post(`/notifications/generate-pdf/${village.id}`, {}, { responseType: 'blob' });
              const file = new Blob([res.data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
              window.open(fileURL);
            } catch (err) {
              console.error('PDF generation error:', err);
              setShowPdfModal(true);
            }
          }}
          className="px-4 py-2 bg-[#1A3A6B] hover:bg-[#102548] text-white font-bold text-xs rounded-xs shadow-2xs flex items-center gap-2 border border-[#C9A227]/40"
        >
          <FileText className="w-4 h-4 text-[#E8C547]" />
          Preview Decision Support Brief (PDF)
        </button>
      </div>

      {/* Summary Confirmation banner if all sent */}
      {allCirclesSent && (
        <div className="p-5 bg-emerald-50 border-2 border-[#138808] rounded-xl text-[#138808] text-xs font-bold space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>All Notification Circles Activated!</span>
          </div>
          <p>
            Government notified at {new Date(village.circle1_sent_at).toLocaleTimeString()}. Responders notified at{' '}
            {new Date(village.circle2_sent_at).toLocaleTimeString()}. Civil Society notified at{' '}
            {new Date(village.circle3_sent_at).toLocaleTimeString()}.
          </p>
        </div>
      )}

      {/* CIRCLE 1 — Government */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-xs overflow-hidden">
        <div
          onClick={() => setC1Open(!c1Open)}
          className="p-5 bg-gray-50 flex items-center justify-between cursor-pointer border-b border-gray-200"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#000080] text-white font-black text-xs flex items-center justify-center">1</span>
            <div>
              <h2 className="text-sm font-bold text-[#000080]">Circle 1 — Government Authority Circle</h2>
              <p className="text-xs text-gray-500">District Collector, SDMA Official, BDO, Revenue Department Head</p>
            </div>
          </div>
          {c1Open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </div>

        {c1Open && (
          <div className="p-6 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Pre-filled Collector Alert Message (Editable)</label>
              <textarea
                value={collectorMsg}
                onChange={(e) => setCollectorMsg(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded bg-white text-xs leading-relaxed font-mono"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">District Collector Channel</label>
                <select value={collectorChannel} onChange={(e) => setCollectorChannel(e.target.value)} className="w-full p-2 border rounded">
                  <option value="WhatsApp">WhatsApp (Primary)</option>
                  <option value="Email">Email</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">SDMA Channel</label>
                <select value={sdmaChannel} onChange={(e) => setSdmaChannel(e.target.value)} className="w-full p-2 border rounded">
                  <option value="Email">Email (with PDF Brief)</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">BDO Channel</label>
                <select value={bdoChannel} onChange={(e) => setBdoChannel(e.target.value)} className="w-full p-2 border rounded">
                  <option value="SMS">SMS</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSendCircle1}
              disabled={actionLoading || village.circle1_sent_at !== null}
              className={`w-full py-3.5 text-white font-black text-sm rounded-lg shadow-md transition-all ${
                village.circle1_sent_at ? 'bg-emerald-700' : 'bg-[#FF9933] hover:bg-[#e68a2e]'
              }`}
            >
              {village.circle1_sent_at ? '✓ Circle 1 Dispatched' : 'Send to Government Circle'}
            </button>
          </div>
        )}
      </div>

      {/* CIRCLE 2 — Operational Responders */}
      {(village.ai_tier === 'Immediate' || village.ai_tier === 'Short-term') && (
        <div className="bg-white rounded-xl border border-gray-300 shadow-xs overflow-hidden">
          <div
            onClick={() => setC2Open(!c2Open)}
            className="p-5 bg-gray-50 flex items-center justify-between cursor-pointer border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#000080] text-white font-black text-xs flex items-center justify-center">2</span>
              <div>
                <h2 className="text-sm font-bold text-[#000080]">Circle 2 — Operational Responders Circle</h2>
                <p className="text-xs text-gray-500">NDRF Battalion, District Hospital, State Emergency Services</p>
              </div>
            </div>
            {c2Open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </div>

          {c2Open && (
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">NDRF Standby Alert Message</label>
                <textarea
                  value={ndrfMsg}
                  onChange={(e) => setNdrfMsg(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded bg-white text-xs leading-relaxed font-mono"
                  rows={4}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">District Hospital Bed Capacity Alert</label>
                <textarea
                  value={hospitalMsg}
                  onChange={(e) => setHospitalMsg(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded bg-white text-xs leading-relaxed font-mono"
                  rows={3}
                />
              </div>

              <button
                onClick={handleSendCircle2}
                disabled={actionLoading || village.circle2_sent_at !== null}
                className={`w-full py-3.5 text-white font-black text-sm rounded-lg shadow-md transition-all ${
                  village.circle2_sent_at ? 'bg-emerald-700' : 'bg-[#FF9933] hover:bg-[#e68a2e]'
                }`}
              >
                {village.circle2_sent_at ? '✓ Circle 2 Dispatched' : 'Send to Responders Circle'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CIRCLE 3 — Civil Society */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-xs overflow-hidden">
        <div
          onClick={() => setC3Open(!c3Open)}
          className="p-5 bg-gray-50 flex items-center justify-between cursor-pointer border-b border-gray-200"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#000080] text-white font-black text-xs flex items-center justify-center">3</span>
            <div>
              <h2 className="text-sm font-bold text-[#000080]">Circle 3 — Civil Society & Panchayat Circle</h2>
              <p className="text-xs text-gray-500">Registered NGOs (NITI Darpan), Receiving Panchayat Secretary</p>
            </div>
          </div>
          {c3Open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </div>

        {c3Open && (
          <div className="p-6 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-800 mb-2">Select Registered NGOs to Notify</label>
              <div className="space-y-2 border border-gray-200 p-3 rounded bg-gray-50">
                {['Sneha NGO Wayanad', 'Seva Bharathi Kerala', 'Wayanad Social Service Society'].map((ngo) => (
                  <label key={ngo} className="flex items-center gap-2 font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedNgos.includes(ngo)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedNgos([...selectedNgos, ngo]);
                        else setSelectedNgos(selectedNgos.filter((n) => n !== ngo));
                      }}
                    />
                    {ngo}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">Receiving Panchayat Pre-fill Message</label>
              <textarea
                value={panchayatMsg}
                onChange={(e) => setPanchayatMsg(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded bg-white text-xs leading-relaxed font-mono"
                rows={4}
              />
            </div>

            <button
              onClick={handleSendCircle3}
              disabled={actionLoading || village.circle3_sent_at !== null}
              className={`w-full py-3.5 text-white font-black text-sm rounded-lg shadow-md transition-all ${
                village.circle3_sent_at ? 'bg-emerald-700' : 'bg-[#FF9933] hover:bg-[#e68a2e]'
              }`}
            >
              {village.circle3_sent_at ? '✓ Circle 3 Dispatched' : 'Send to Civil Society Circle'}
            </button>
          </div>
        )}
      </div>

      {/* PDF Decision Support Brief Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl space-y-4 border border-gray-300 text-xs overflow-y-auto max-h-[90vh]">
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-[#000080]">DECISION SUPPORT BRIEF (ONE-PAGE PDF)</h2>
                <p className="text-[11px] font-bold text-[#FF9933] uppercase">AAROHAN Disaster Management Portal</p>
              </div>
              <button onClick={() => setShowPdfModal(false)} className="px-3 py-1 bg-gray-200 text-gray-800 font-bold rounded">Close</button>
            </div>

            <div className="space-y-3 font-mono text-gray-900 border p-4 rounded bg-gray-50">
              <p><strong>VILLAGE:</strong> {village.name} ({village.district}, {village.state})</p>
              <p><strong>TIER & HAZARD SCORE:</strong> {village.ai_tier} — Hazard Score: {village.hazard_score}</p>
              <p><strong>FIELD OFFICER FINDINGS:</strong> Physical Count: 318 families. Landslide signs observed. Immediate evacuation recommended.</p>
              <p><strong>TOP RANKED RELOCATION SITE:</strong> Meppadi Relief Center (AHP Score: Best Option)</p>
              <p><strong>INTERVENTION LADDER:</strong> Full Permanent Relocation (₹89 Lakhs)</p>
              <p><strong>COST OF INACTION:</strong> ₹4.2 Crore over 10 years</p>
              <p><strong>LAND VERIFICATION STATUS:</strong> Completed by Revenue Officer M. K. Pillai</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setShowPdfModal(false)} className="px-5 py-2 bg-[#000080] text-white font-bold rounded">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
