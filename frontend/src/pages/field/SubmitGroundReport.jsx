import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Send, MapPin, CheckCircle2, AlertOctagon, Wifi, WifiOff } from 'lucide-react';

export default function SubmitGroundReport({ showBanner }) {
  const [searchParams] = useSearchParams();
  const villageIdParam = searchParams.get('village_id') || '1';
  const navigate = useNavigate();

  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Review step state
  const [isReviewStep, setIsReviewStep] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('aarohan_field_report_draft');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      village_id: parseInt(villageIdParam),
      submitted_by: 'Field Officer Anoop Kumar',
      visit_date: new Date().toISOString().split('T')[0],
      gps_coordinates: '11.4916, 76.0522',
      actual_families_count: 318,
      houses_in_risk_zone: 285,
      landslide_signs_observed: true,
      cracks_in_ground_observed: true,
      water_logging_observed: true,
      slope_erosion_visible: true,
      road_condition: 'PARTIALLY_BLOCKED',
      community_willing_to_relocate: 'PARTIAL',
      nearest_safe_structure_distance_km: 12.4,
      field_officer_recommendation: 'IMMEDIATE_EVACUATION',
      observations: 'Visited the village on foot as main road was partially washed out. Observed fresh ground cracks approximately 40 meters from nearest house. Three families have self-evacuated. Community leaders request immediate shelter assurance.',
      photo_count: 14,
    };
  });

  // Sync formData village_id with URL parameter
  useEffect(() => {
    const vId = parseInt(villageIdParam);
    if (!isNaN(vId)) {
      setFormData((prev) => ({ ...prev, village_id: vId }));
    }
  }, [villageIdParam]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem('aarohan_field_report_draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const fetchVillages = async () => {
      setLoading(true);
      try {
        const response = await api.get('/field/villages');
        setVillages(response.data);
      } catch (err) {
        console.error('Error fetching villages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVillages();
  }, []);

  const handleCaptureGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latLong = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          setFormData((prev) => ({ ...prev, gps_coordinates: latLong }));
          if (showBanner) showBanner(`GPS Location Captured: ${latLong}`, 'success');
        },
        () => {
          setFormData((prev) => ({ ...prev, gps_coordinates: '11.4916, 76.0522' }));
        }
      );
    } else {
      setFormData((prev) => ({ ...prev, gps_coordinates: '11.4916, 76.0522' }));
    }
  };

  const currentVillage = villages.find((v) => v.id === formData.village_id) || villages[0];
  const aiFamilies = currentVillage ? currentVillage.families_affected : 312;
  const familyDiff = Math.abs(formData.actual_families_count - aiFamilies);
  const showFamilyDiffNotice = familyDiff / aiFamilies > 0.1;

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      if (!isOnline) {
        // Save offline to pending sync
        const pending = JSON.parse(localStorage.getItem('aarohan_pending_sync_reports') || '[]');
        pending.push({ ...formData, submitted_at: new Date().toISOString() });
        localStorage.setItem('aarohan_pending_sync_reports', JSON.stringify(pending));
        localStorage.removeItem('aarohan_field_report_draft');
        if (showBanner) showBanner('Report saved offline. Will sync when connected to internet.', 'success');
        navigate('/field/reports');
        return;
      }

      await api.post('/field/reports', formData);
      localStorage.removeItem('aarohan_field_report_draft');
      if (showBanner) showBanner('Report submitted. The system will now prepare a Decision Support Brief.', 'success');
      navigate('/field/reports');
    } catch (err) {
      console.error('Error submitting report:', err);
      const detailMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to submit report.';
      if (showBanner) showBanner(`Submission Error: ${detailMsg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12 text-base">
      {/* Network Sync Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-gray-300 shadow-2xs text-xs font-bold">
        <span className="text-[#000080]">Field Officer Inspection Form</span>
        {isOnline ? (
          <span className="flex items-center gap-1 text-[#138808]">
            <Wifi className="w-4 h-4" /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[#F57C00]">
            <WifiOff className="w-4 h-4" /> Offline — Data saved locally
          </span>
        )}
      </div>

      {!isReviewStep ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (formData.observations.length < 50) {
              if (showBanner) showBanner('Observations must be at least 50 characters.', 'error');
              return;
            }
            setIsReviewStep(true);
          }}
          className="bg-white rounded-xl p-6 border border-gray-300 shadow-md space-y-6"
        >
          <h1 className="text-xl font-black text-[#000080]">Submit Ground Visit Report</h1>

          {/* Section A — Visit Details */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">Section A — Visit Details</h2>
            <div>
              <label className="block font-bold text-gray-800 text-sm mb-1">Target Village</label>
              <select
                value={formData.village_id}
                onChange={(e) => setFormData({ ...formData, village_id: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base min-h-[48px] font-bold"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.district})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-800 text-sm mb-1">Field Officer Name</label>
                <input
                  type="text"
                  value={formData.submitted_by}
                  onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base min-h-[48px]"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-800 text-sm mb-1">Inspection Visit Date</label>
                <input
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base min-h-[48px]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-800 text-sm mb-1">GPS Location Coordinates</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.gps_coordinates}
                  onChange={(e) => setFormData({ ...formData, gps_coordinates: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white font-mono text-base min-h-[48px]"
                  required
                />
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  className="px-4 py-3 bg-[#000080] text-white font-bold rounded-lg text-sm min-h-[48px] whitespace-nowrap"
                >
                  Capture GPS
                </button>
              </div>
            </div>
          </div>

          {/* Section B — Population Count */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">Section B — Population Count</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-800 text-sm mb-1">Families Counted on Ground</label>
                <input
                  type="number"
                  value={formData.actual_families_count}
                  onChange={(e) => setFormData({ ...formData, actual_families_count: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 border-2 border-[#000080] rounded-lg bg-white text-lg font-black text-[#000080] min-h-[48px]"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-800 text-sm mb-1">Houses in Direct Risk Zone</label>
                <input
                  type="number"
                  value={formData.houses_in_risk_zone}
                  onChange={(e) => setFormData({ ...formData, houses_in_risk_zone: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-lg font-bold min-h-[48px]"
                  required
                />
              </div>
            </div>

            {showFamilyDiffNotice && (
              <div className="p-3 bg-orange-50 border border-[#F57C00] rounded-lg text-xs font-bold text-[#F57C00]">
                Your count differs from the AI estimate of {aiFamilies} families. This will update the official system record.
              </div>
            )}
          </div>

          {/* Section C — Ground Observations (Large Touch Pill Toggles) */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">Section C — Ground Observations</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, landslide_signs_observed: !formData.landslide_signs_observed })}
                className={`p-4 rounded-xl border-2 font-bold text-sm min-h-[52px] text-center transition-all ${
                  formData.landslide_signs_observed ? 'border-[#C62828] bg-red-50 text-[#C62828]' : 'border-gray-300 bg-white text-gray-600'
                }`}
              >
                Landslide Signs: {formData.landslide_signs_observed ? 'YES' : 'NO'}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, cracks_in_ground_observed: !formData.cracks_in_ground_observed })}
                className={`p-4 rounded-xl border-2 font-bold text-sm min-h-[52px] text-center transition-all ${
                  formData.cracks_in_ground_observed ? 'border-[#C62828] bg-red-50 text-[#C62828]' : 'border-gray-300 bg-white text-gray-600'
                }`}
              >
                Ground Cracks: {formData.cracks_in_ground_observed ? 'YES' : 'NO'}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, water_logging_observed: !formData.water_logging_observed })}
                className={`p-4 rounded-xl border-2 font-bold text-sm min-h-[52px] text-center transition-all ${
                  formData.water_logging_observed ? 'border-[#F57C00] bg-orange-50 text-[#F57C00]' : 'border-gray-300 bg-white text-gray-600'
                }`}
              >
                Water Logging: {formData.water_logging_observed ? 'YES' : 'NO'}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, slope_erosion_visible: !formData.slope_erosion_visible })}
                className={`p-4 rounded-xl border-2 font-bold text-sm min-h-[52px] text-center transition-all ${
                  formData.slope_erosion_visible ? 'border-[#F57C00] bg-orange-50 text-[#F57C00]' : 'border-gray-300 bg-white text-gray-600'
                }`}
              >
                Slope Erosion: {formData.slope_erosion_visible ? 'YES' : 'NO'}
              </button>
            </div>

            <div>
              <label className="block font-bold text-gray-800 text-sm mb-1">Road Accessibility</label>
              <select
                value={formData.road_condition}
                onChange={(e) => setFormData({ ...formData, road_condition: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base min-h-[48px]"
              >
                <option value="ACCESSIBLE">Fully Open</option>
                <option value="PARTIALLY_BLOCKED">Partially Blocked</option>
                <option value="FULLY_BLOCKED">Fully Blocked</option>
              </select>
            </div>
          </div>

          {/* Section D — Community */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">Section D — Community & Relocation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-800 text-sm mb-1">Community Willingness</label>
                <select
                  value={formData.community_willing_to_relocate}
                  onChange={(e) => setFormData({ ...formData, community_willing_to_relocate: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base min-h-[48px]"
                >
                  <option value="YES">Yes</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="NO">No</option>
                  <option value="NOT_ASKED">Did Not Ask</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-800 text-sm mb-1">Nearest Safe Structure (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.nearest_safe_structure_distance_km}
                  onChange={(e) => setFormData({ ...formData, nearest_safe_structure_distance_km: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base min-h-[48px]"
                />
              </div>
            </div>
          </div>

          {/* Section E — Field Officer Recommendation */}
          <div className="space-y-2 pt-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">Section E — Professional Recommendation</h2>
            <select
              value={formData.field_officer_recommendation}
              onChange={(e) => setFormData({ ...formData, field_officer_recommendation: e.target.value })}
              className="w-full p-3 border-2 border-[#FF9933] font-black text-[#FF9933] rounded-lg bg-white text-base min-h-[52px]"
            >
              <option value="IMMEDIATE_EVACUATION">Evacuate Immediately</option>
              <option value="PLANNED_RELOCATION">Plan Relocation</option>
              <option value="SEASONAL_EVACUATION">Seasonal Evacuation</option>
              <option value="KEEP_MONITORING">Keep Monitoring</option>
              <option value="NO_ACTION">No Action Needed</option>
            </select>
          </div>

          {/* Section F — Observations */}
          <div className="space-y-2 pt-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">Section F — Plain English Observations</h2>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Describe what you saw. Write in plain language. Min 50 characters."
              className="w-full p-4 border border-gray-300 rounded-lg bg-white text-base leading-relaxed"
              rows={4}
              required
            />
            <div className="text-xs text-right font-semibold text-gray-500">
              {formData.observations.length}/50 min characters
            </div>
          </div>

          {/* Section G — Photos */}
          <div className="space-y-2 pt-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">Section G — Photos</h2>
            <div>
              <label className="block font-bold text-gray-800 text-sm mb-1">Number of Photos Taken</label>
              <input
                type="number"
                value={formData.photo_count}
                onChange={(e) => setFormData({ ...formData, photo_count: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base min-h-[48px]"
              />
            </div>
            <p className="text-xs text-gray-500 italic">
              Note: Upload photos separately to the district server as per standard procedure.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#FF9933] hover:bg-[#e68a2e] text-white font-black text-lg rounded-xl shadow-lg transition-all min-h-[56px]"
          >
            Review Before Submitting &rarr;
          </button>
        </form>
      ) : (
        /* Review Screen Before Final Submit */
        <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-md space-y-4">
          <h2 className="text-xl font-black text-[#000080]">Check Your Answers Before Submitting</h2>
          <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p><strong>Village:</strong> {currentVillage?.name}</p>
            <p><strong>Inspector:</strong> {formData.submitted_by}</p>
            <p><strong>Visit Date:</strong> {formData.visit_date}</p>
            <p><strong>Physical Family Count:</strong> {formData.actual_families_count}</p>
            <p><strong>Recommendation:</strong> {formData.field_officer_recommendation}</p>
            <p><strong>Observations:</strong> "{formData.observations}"</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsReviewStep(false)}
              className="w-1/2 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg text-base min-h-[48px]"
            >
              Edit Form
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="w-1/2 py-3 bg-[#FF9933] text-white font-black rounded-lg text-base shadow-md min-h-[48px] flex items-center justify-center gap-2"
            >
              {submitting && <LoadingSpinner size="sm" color="text-white" />}
              Submit Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
