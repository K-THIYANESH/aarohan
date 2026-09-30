import React, { useState } from 'react';
import { 
  Users, ShieldAlert, TrendingUp, Compass, Satellite, 
  DollarSign, Scale, CheckCircle2, AlertTriangle, FileText, Activity,
  ChevronRight, Info, Check, ShieldCheck
} from 'lucide-react';

export default function StrategicPlanningHub() {
  const [activeTab, setActiveTab] = useState('resistance');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Form States
  const [resistanceInput, setResistanceInput] = useState({
    village_id: 101,
    residing_duration_years: 25,
    primary_livelihood_type: 'TRIBAL_FOREST',
    distance_to_livelihood_km: 12.5,
    welfare_scheme_compliance_rate: 0.45,
    is_pesa_tribal_area: true,
    cultural_proximity_index: 0.35
  });

  const [monitoringInput, setMonitoringInput] = useState({
    red_zone_id: 5,
    structural_reflectance_change: 0.42,
    ndvi_drop: 0.28,
    satellite_pass_date: '2026-08-31'
  });

  const [climateInput, setClimateInput] = useState({
    habitation_id: 202,
    baseline_hazard_score: 0.76,
    precip_trend_mm_yr: 3.8,
    sea_level_rise_mm_yr: 4.2,
    slope_degradation_factor: 0.02
  });

  const [livelihoodInput, setLivelihoodInput] = useState({
    site_id: 12,
    site_lat: 11.75,
    site_lon: 76.25,
    historical_agri_zone_ids: [101, 102],
    historical_forest_block_ids: [501],
    historical_fishing_zone_ids: []
  });

  const [budgetInput, setBudgetInput] = useState({
    total_budget: 50000000,
    candidates: [
      { id: 1, name: "Mundakkai Red Zone Settlement", population: 1450, risk_score: 0.94, cost: 28000000 },
      { id: 2, name: "Chooralmala Riverbank Habitation", population: 920, risk_score: 0.88, cost: 18000000 },
      { id: 3, name: "Attamala Landslide Slope Colony", population: 610, risk_score: 0.82, cost: 14000000 }
    ]
  });

  const [legalInput, setLegalInput] = useState({
    site_id: 15,
    survey_number: "SY-405/2A",
    district: "Wayanad",
    village_name: "Vythiri"
  });

  const [sentinelInput, setSentinelInput] = useState({
    reporter_id: "SENTINEL-109",
    observation_type: "CRACK",
    latitude: 11.605,
    longitude: 76.083,
    description: "Deep tension cracks observed along hillside access road following continuous heavy rainfall."
  });

  const handleApiSubmit = async (endpoint, payload) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`http://127.0.0.1:8008${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Could not run analysis. Please check connection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Officer Header Banner */}
      <div className="bg-[#102548] text-white p-6 rounded-xs shadow-md border-l-4 border-[#C9A227] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#E8C547] text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" /> District Officer Assistant
          </div>
          <h1 className="text-2xl font-bold font-serif">Relocation & Risk Decision Guide</h1>
          <p className="text-xs text-gray-300 mt-1">
            Plain-English decision tools for revenue officers, village officers, and field staff.
          </p>
        </div>
        <div className="bg-[#1A3A6B] px-4 py-2 rounded-xs border border-[#C9A227]/40 text-center min-w-[180px]">
          <span className="text-[10px] text-[#90B8D8] uppercase tracking-wider block font-bold">System Status</span>
          <span className="text-xs font-bold text-emerald-400">● Ready to Assist</span>
        </div>
      </div>

      {/* Plain-English Module Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-300 pb-2">
        {[
          { id: 'resistance', label: '1. Will People Agree to Move?', icon: Users },
          { id: 'monitoring', label: '2. Are People Returning?', icon: Satellite },
          { id: 'climate', label: '3. 10-Year Weather Risk', icon: TrendingUp },
          { id: 'livelihood', label: '4. Jobs & Farm Access', icon: Compass },
          { id: 'sentinel', label: '5. Field Danger Reports', icon: ShieldAlert },
          { id: 'budget', label: '6. Best Fund Spending', icon: DollarSign },
          { id: 'legal', label: '7. Land Legal Permission', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); }}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-md transition-all ${
                isActive 
                  ? 'bg-[#102548] text-[#E8C547] border-b-2 border-[#C9A227] shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Simple Questions Form */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs space-y-4">
          {activeTab === 'resistance' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#102548] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#C9A227]" /> Check Villager Reluctance Level
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Answer these simple questions to find out how hard or easy it will be to convince villagers to relocate safely.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1">How many years have villagers lived in the danger zone?</label>
                  <input type="number" value={resistanceInput.residing_duration_years} 
                    onChange={e => setResistanceInput({...resistanceInput, residing_duration_years: parseFloat(e.target.value)})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-slate-50 focus:bg-white font-bold text-[#102548]" />
                </div>
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Main Source of Family Income</label>
                  <select value={resistanceInput.primary_livelihood_type}
                    onChange={e => setResistanceInput({...resistanceInput, primary_livelihood_type: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-white font-semibold">
                    <option value="TRIBAL_FOREST">Forest Produce & Gathering (Tribal)</option>
                    <option value="AGRICULTURE">Tea Plantation / Farming</option>
                    <option value="FISHING">River / Lake Fishing</option>
                    <option value="DAILY_WAGE">Daily Wage Construction Work</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Distance to Proposed New Relocation Site (in Kilometers)</label>
                  <input type="number" value={resistanceInput.distance_to_livelihood_km} 
                    onChange={e => setResistanceInput({...resistanceInput, distance_to_livelihood_km: parseFloat(e.target.value)})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-slate-50 focus:bg-white font-bold text-[#102548]" />
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xs flex items-center gap-2">
                  <input type="checkbox" checked={resistanceInput.is_pesa_tribal_area} 
                    onChange={e => setResistanceInput({...resistanceInput, is_pesa_tribal_area: e.target.checked})}
                    id="pesa_check" className="w-4 h-4 text-[#102548]" />
                  <label htmlFor="pesa_check" className="text-amber-900 font-bold text-xs cursor-pointer">
                    Is this a Tribal Scheduled Area (PESA Act Applicable)?
                  </label>
                </div>
                <button onClick={() => handleApiSubmit('/strategic/resistance', resistanceInput)}
                  className="w-full bg-[#102548] hover:bg-[#1A3A6B] text-white font-bold py-3 px-4 rounded-xs transition-colors text-xs flex items-center justify-center gap-2">
                  <span>Get Clear Action Recommendation</span> <ChevronRight className="w-4 h-4 text-[#E8C547]" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#102548] flex items-center gap-2">
                  <Satellite className="w-5 h-5 text-[#C9A227]" /> Check Unauthorized Return via Satellite
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Checks recent satellite images to see if people have quietly moved back into evacuated red zones.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Building Reflection Change (0 = No buildings, 1 = New houses seen)</label>
                  <input type="number" step="0.01" value={monitoringInput.structural_reflectance_change}
                    onChange={e => setMonitoringInput({...monitoringInput, structural_reflectance_change: parseFloat(e.target.value)})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-slate-50 focus:bg-white" />
                </div>
                <button onClick={() => handleApiSubmit('/strategic/monitoring/satellite', monitoringInput)}
                  className="w-full bg-[#102548] hover:bg-[#1A3A6B] text-white font-bold py-3 px-4 rounded-xs transition-colors text-xs flex items-center justify-center gap-2">
                  <span>Get Satellite Safety Report</span> <ChevronRight className="w-4 h-4 text-[#E8C547]" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'climate' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#102548] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C9A227]" /> Long-Term Weather Risk Prediction
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Predicts weather and landslide danger levels for the year 2031, 2036, and 2046.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Current Danger Rating (0.0 to 1.0)</label>
                  <input type="number" step="0.01" value={climateInput.baseline_hazard_score}
                    onChange={e => setClimateInput({...climateInput, baseline_hazard_score: parseFloat(e.target.value)})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-slate-50 focus:bg-white" />
                </div>
                <button onClick={() => handleApiSubmit('/strategic/climate/projection', climateInput)}
                  className="w-full bg-[#102548] hover:bg-[#1A3A6B] text-white font-bold py-3 px-4 rounded-xs transition-colors text-xs flex items-center justify-center gap-2">
                  <span>Get 10-Year Weather Forecast</span> <ChevronRight className="w-4 h-4 text-[#E8C547]" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'livelihood' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#102548] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#C9A227]" /> Check Livelihood & Forest Rights
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Verifies if villagers can easily reach their farms, forests, or workplaces from the new land.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1">New Site Location (Latitude & Longitude)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" step="0.001" value={livelihoodInput.site_lat}
                      onChange={e => setLivelihoodInput({...livelihoodInput, site_lat: parseFloat(e.target.value)})}
                      className="p-2.5 border border-slate-300 rounded-xs bg-slate-50" placeholder="Lat (e.g. 11.75)" />
                    <input type="number" step="0.001" value={livelihoodInput.site_lon}
                      onChange={e => setLivelihoodInput({...livelihoodInput, site_lon: parseFloat(e.target.value)})}
                      className="p-2.5 border border-slate-300 rounded-xs bg-slate-50" placeholder="Lon (e.g. 76.25)" />
                  </div>
                </div>
                <button onClick={() => handleApiSubmit('/strategic/livelihood/prescreen', livelihoodInput)}
                  className="w-full bg-[#102548] hover:bg-[#1A3A6B] text-white font-bold py-3 px-4 rounded-xs transition-colors text-xs flex items-center justify-center gap-2">
                  <span>Check Job & Forest Access</span> <ChevronRight className="w-4 h-4 text-[#E8C547]" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sentinel' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#102548] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#C9A227]" /> Report Hill Ground Danger
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Submit ground observations from villagers or field staff regarding cracks or rockfalls.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Type of Danger Observed</label>
                  <select value={sentinelInput.observation_type}
                    onChange={e => setSentinelInput({...sentinelInput, observation_type: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-white">
                    <option value="CRACK">Ground / Wall Tension Crack Seen</option>
                    <option value="SEEPAGE">Unusual Muddy Water Flow</option>
                    <option value="EROSION">Hillside Soil Sliding</option>
                    <option value="ROCKFALL">Falling Rocks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Observation Details</label>
                  <textarea value={sentinelInput.description} rows={2}
                    onChange={e => setSentinelInput({...sentinelInput, description: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-xs bg-slate-50 focus:bg-white text-xs" />
                </div>
                <button onClick={() => handleApiSubmit('/sentinel/reports', sentinelInput)}
                  className="w-full bg-[#102548] hover:bg-[#1A3A6B] text-white font-bold py-3 px-4 rounded-xs transition-colors text-xs flex items-center justify-center gap-2">
                  <span>Submit Danger Warning</span> <ChevronRight className="w-4 h-4 text-[#E8C547]" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#102548] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#C9A227]" /> Smart Government Fund Allocator
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically calculates which high-risk villages should receive money first to save maximum lives.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Total Money Available in State Fund (₹)</label>
                  <input type="number" value={budgetInput.total_budget}
                    onChange={e => setBudgetInput({...budgetInput, total_budget: parseFloat(e.target.value)})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-slate-50 focus:bg-white font-mono font-bold" />
                </div>
                <button onClick={() => handleApiSubmit('/strategic/budget/optimize', budgetInput)}
                  className="w-full bg-[#102548] hover:bg-[#1A3A6B] text-white font-bold py-3 px-4 rounded-xs transition-colors text-xs flex items-center justify-center gap-2">
                  <span>Calculate Best Fund Distribution</span> <ChevronRight className="w-4 h-4 text-[#E8C547]" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#102548] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#C9A227]" /> Check Land Ownership & Legal Status
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Checks survey numbers to confirm if the land belongs to government revenue or forest department.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Survey Number</label>
                  <input type="text" value={legalInput.survey_number}
                    onChange={e => setLegalInput({...legalInput, survey_number: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-gray-800 font-bold mb-1">Village Name</label>
                  <input type="text" value={legalInput.village_name}
                    onChange={e => setLegalInput({...legalInput, village_name: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xs bg-slate-50 focus:bg-white" />
                </div>
                <button onClick={() => handleApiSubmit('/strategic/legal/preclearance', legalInput)}
                  className="w-full bg-[#102548] hover:bg-[#1A3A6B] text-white font-bold py-3 px-4 rounded-xs transition-colors text-xs flex items-center justify-center gap-2">
                  <span>Run Legal Clearance Check</span> <ChevronRight className="w-4 h-4 text-[#E8C547]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pure Human-Readable Recommendations ONLY (Zero JSON) */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#102548] border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Info className="w-4 h-4 text-[#C9A227]" /> Official Recommendation & Action Steps</span>
              {loading && <span className="text-xs text-[#102548] animate-pulse">Calculating Recommendation...</span>}
            </h3>

            {!result && !loading && (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs font-semibold text-gray-600">Select a tool on the left and click the button.</p>
                <p className="text-[11px] text-gray-400">The system will give you clear, step-by-step instructions in plain language.</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Community Reluctance Result */}
                {result.resistance_score !== undefined && (
                  <div className="space-y-3">
                    <div className={`p-4 rounded-xs border ${result.requires_gram_sabha_liaison ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'} space-y-2`}>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {result.requires_gram_sabha_liaison ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        <span>Community Reluctance Score: {result.resistance_score} out of 100</span>
                      </div>
                      <p className="text-xs font-semibold">
                        Primary Reason Villagers Want to Stay: <strong className="underline">{result.primary_driver}</strong>
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-300 rounded-xs space-y-2">
                      <span className="font-bold text-xs text-[#102548] uppercase block">Recommended Next Steps for Officer:</span>
                      <ul className="text-xs text-slate-800 space-y-2">
                        {result.requires_gram_sabha_liaison ? (
                          <>
                            <li className="flex items-start gap-2 text-amber-900 font-medium">
                              <span className="text-amber-600 font-bold">1.</span>
                              <span><strong>Appoint Gram Sabha Officer:</strong> You must appoint a local Tribal Liaison Officer before holding formal relocation discussions.</span>
                            </li>
                            <li className="flex items-start gap-2 text-slate-700">
                              <span className="text-[#102548] font-bold">2.</span>
                              <span><strong>Livelihood Guarantee:</strong> Offer alternative forest produce collecting zones within 5km of the new township.</span>
                            </li>
                          </>
                        ) : (
                          <li className="flex items-start gap-2 text-emerald-900 font-medium">
                            <span className="text-emerald-600 font-bold">1.</span>
                            <span><strong>Proceed with Direct Relocation Notices:</strong> Community reluctance is low. Proceed with standard housing allotment.</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Job & Livelihood Access Result */}
                {result.approval_status && (
                  <div className="p-4 rounded-xs border bg-blue-50 border-blue-300 text-blue-900 space-y-2">
                    <div className="flex items-center gap-2 font-extrabold text-sm">
                      <ShieldCheck className="w-5 h-5 text-blue-700" />
                      <span>Livelihood Access Verdict: {result.approval_status}</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium bg-white p-3 rounded border border-blue-200 text-slate-800">
                      {result.recommendation}
                    </p>
                  </div>
                )}

                {/* Legal Title Verdict */}
                {result.overall_status && (
                  <div className={`p-4 rounded-xs border ${result.overall_status === 'LEGALLY_CLEARED' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'} space-y-2`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {result.overall_status === 'LEGALLY_CLEARED' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                      <span>Official Legal Clearance Status:</span>
                    </div>
                    <p className="text-base font-black uppercase">
                      {result.overall_status === 'LEGALLY_CLEARED' ? '✓ Legally Cleared — Safe to Build' : '⚠️ Action Blocked — Disputed Land Title'}
                    </p>
                  </div>
                )}

                {/* Default General Success Response */}
                {!result.resistance_score && !result.approval_status && !result.overall_status && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Analysis Completed Successfully</span>
                    </div>
                    <p className="text-xs font-medium">The system has processed your input and verified all parameters with official government databases.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-gray-500 flex justify-between items-center">
            <span>AAROHAN Government Decision Helper</span>
            <span className="font-semibold text-slate-700">Official Officer Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
