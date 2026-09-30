import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { ClipboardList, CheckCircle2, MapPin, Send } from 'lucide-react';

export default function FieldOfficerPortal({ showBanner }) {
  const [assignedCases, setAssignedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    submitted_by: 'Field Officer Anoop Kumar',
    visit_date: new Date().toISOString().split('T')[0],
    actual_families_count: 318,
    houses_in_risk_zone: 285,
    road_condition: 'PARTIALLY_BLOCKED',
    water_logging_observed: true,
    landslide_signs_observed: true,
    cracks_in_ground_observed: true,
    community_willing_to_relocate: 'PARTIAL',
    nearest_safe_structure_distance_km: 12.4,
    field_officer_recommendation: 'IMMEDIATE_EVACUATION',
    observations: 'Visited the village on foot as the main road was partially washed out. Observed fresh cracks near the eastern slope approximately 40 meters from the nearest house. Three families have already self-evacuated. Community leaders are willing to move but requesting assurance on the relocation site facilities. Immediate action strongly recommended.',
    photo_count: 14,
    gps_coordinates: '11.4916, 76.0522',
  });

  const fetchAssignedCases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cases');
      // Filter for cases in PENDING or FIELD_ASSIGNED or FIELD_SUBMITTED stage
      const fieldCases = response.data.filter(
        (c) => c.stage === 'FIELD_ASSIGNED' || c.stage === 'PENDING' || c.stage === 'FIELD_SUBMITTED'
      );
      setAssignedCases(fieldCases);
      if (fieldCases.length > 0) {
        setSelectedCase(fieldCases[0]);
      }
    } catch (err) {
      console.error('Error fetching assigned cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedCases();
  }, []);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    setSubmitting(true);
    try {
      await api.post(`/cases/${selectedCase.id}/submit-field-report`, formData);
      if (showBanner) showBanner('Report submitted. Case has been sent to BDO for review.', 'success');
      fetchAssignedCases();
    } catch (err) {
      console.error('Error submitting field report:', err);
      if (showBanner) showBanner('Failed to submit field report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#000080] text-white rounded-lg">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#000080]">Field Officer Inspection Portal</h1>
          <p className="text-xs font-semibold text-gray-500">
            Submit physical ground verification data to initiate BDO & Collector review chain.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" color="text-navy-blue" />
          <span className="text-sm font-semibold">Loading Assigned Inspection Tasks...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column — Assigned Village List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Assigned Field Visits
            </h2>
            <div className="space-y-2">
              {assignedCases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#FF9933] bg-orange-50/40 shadow-sm'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#000080]">{c.village_name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                        {c.stage}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{c.district}</p>
                    <div className="text-[11px] text-gray-700 font-semibold mt-2">
                      AI Rec: <span className="text-[#FF9933]">{c.recommended_action}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column — Field Report Form */}
          <div className="md:col-span-2 bg-white rounded-lg p-6 border border-gray-300 shadow-sm space-y-4">
            {selectedCase ? (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#000080]">
                      Field Inspection Report: {selectedCase.village_name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      AI Estimated Families: <span className="font-bold text-gray-800">{selectedCase.families_affected}</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-[#138808] text-white text-xs font-bold rounded">
                    Role: Field Officer
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Field Officer Name</label>
                    <input
                      type="text"
                      value={formData.submitted_by}
                      onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Inspection Visit Date</label>
                    <input
                      type="date"
                      value={formData.visit_date}
                      onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Physical Families Counted</label>
                    <input
                      type="number"
                      value={formData.actual_families_count}
                      onChange={(e) => setFormData({ ...formData, actual_families_count: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-bold text-[#000080]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Houses in Direct Risk Zone</label>
                    <input
                      type="number"
                      value={formData.houses_in_risk_zone}
                      onChange={(e) => setFormData({ ...formData, houses_in_risk_zone: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Ground Hazards Toggles */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <span className="block text-xs font-bold text-gray-700 uppercase">On-Ground Hazard Signs</span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded cursor-pointer font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.landslide_signs_observed}
                        onChange={(e) => setFormData({ ...formData, landslide_signs_observed: e.target.checked })}
                        className="accent-[#FF9933] w-4 h-4"
                      />
                      Landslide Signs
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded cursor-pointer font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.cracks_in_ground_observed}
                        onChange={(e) => setFormData({ ...formData, cracks_in_ground_observed: e.target.checked })}
                        className="accent-[#FF9933] w-4 h-4"
                      />
                      Ground Cracks
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded cursor-pointer font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.water_logging_observed}
                        onChange={(e) => setFormData({ ...formData, water_logging_observed: e.target.checked })}
                        className="accent-[#FF9933] w-4 h-4"
                      />
                      Water Logging
                    </label>
                  </div>
                </div>

                {/* Select Dropdowns */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Road Condition</label>
                    <select
                      value={formData.road_condition}
                      onChange={(e) => setFormData({ ...formData, road_condition: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                    >
                      <option value="ACCESSIBLE">Accessible</option>
                      <option value="PARTIALLY_BLOCKED">Partially Blocked</option>
                      <option value="FULLY_BLOCKED">Fully Blocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Community Relocation Willingness</label>
                    <select
                      value={formData.community_willing_to_relocate}
                      onChange={(e) => setFormData({ ...formData, community_willing_to_relocate: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                    >
                      <option value="YES">Yes — Fully Willing</option>
                      <option value="PARTIAL">Partial — Requesting Facilities</option>
                      <option value="NO">No — Unwilling</option>
                      <option value="NOT_ASKED">Not Asked</option>
                    </select>
                  </div>
                </div>

                {/* Officer Recommendation */}
                <div className="text-xs">
                  <label className="block font-bold text-[#000080] mb-1">Field Officer Recommendation</label>
                  <select
                    value={formData.field_officer_recommendation}
                    onChange={(e) => setFormData({ ...formData, field_officer_recommendation: e.target.value })}
                    className="w-full p-2 border-2 border-[#FF9933] font-bold text-[#FF9933] rounded bg-white text-sm"
                  >
                    <option value="IMMEDIATE_EVACUATION">IMMEDIATE_EVACUATION</option>
                    <option value="PLANNED_RELOCATION">PLANNED_RELOCATION</option>
                    <option value="MONITOR">MONITOR</option>
                    <option value="NO_ACTION">NO_ACTION</option>
                  </select>
                </div>

                {/* Observations Text */}
                <div className="text-xs">
                  <label className="block font-bold text-gray-700 mb-1">Plain English Field Notes & Observations</label>
                  <textarea
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded bg-white text-sm leading-relaxed"
                    rows={3}
                    required
                  />
                </div>

                {/* Photo & GPS metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Photos Attached Count</label>
                    <input
                      type="number"
                      value={formData.photo_count}
                      onChange={(e) => setFormData({ ...formData, photo_count: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">GPS Coordinates (Lat, Long)</label>
                    <input
                      type="text"
                      value={formData.gps_coordinates}
                      onChange={(e) => setFormData({ ...formData, gps_coordinates: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-white font-extrabold text-sm rounded shadow-md flex items-center gap-2"
                  >
                    {submitting && <LoadingSpinner size="sm" color="text-white" />}
                    <Send className="w-4 h-4" />
                    Submit Inspection Report to BDO
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-12 text-center text-gray-500 font-semibold text-sm">
                Select an assigned village from the left list to submit report.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
