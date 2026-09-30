import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ReadOnlyNotifications from '../../components/ReadOnlyNotifications';
import DisasterGeospatialMap from '../../components/DisasterGeospatialMap';
import { ShieldAlert, ArrowLeft, Send, AlertOctagon, HelpCircle, History, Clock } from 'lucide-react';

export default function VillageEvidence({ showBanner }) {
  const { villageId } = useParams();
  const [village, setVillage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvidence = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/field/villages/${villageId}`);
        setVillage(response.data);
      } catch (err) {
        console.error('Error fetching village evidence:', err);
        if (showBanner) showBanner('Failed to load evidence data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [villageId]);

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" color="text-navy-blue" />
        <p className="text-gray-600 font-semibold text-sm">Loading Scientific Evidence for Field Officer...</p>
      </div>
    );
  }

  if (!village) return null;

  const { population_triangulation, intervention_ladder } = village;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs font-semibold text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-[#000080] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Assigned Villages
        </Link>
        <span>&gt;</span>
        <span className="text-gray-800 font-bold">{village.name} Scientific Evidence</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-lg p-5 border border-gray-300 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#000080]">{village.name}</h1>
          <p className="text-xs font-semibold text-gray-500">
            {village.district}, {village.state} • System Risk Rating:{' '}
            <span className="font-extrabold text-[#C62828] uppercase">{village.risk_label}</span>
          </p>
        </div>
        <button
          onClick={() => navigate(`/field/submit?village_id=${village.id}`)}
          className="px-5 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-white font-extrabold text-xs rounded shadow-md flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Start Ground Visit Report
        </button>
      </div>

      {/* Spatial Hazard GIS Map Component */}
      <DisasterGeospatialMap 
        height="340px" 
        center={[11.532, 76.124]} 
        zoom={12}
        redZones={[
          { id: village.id, name: `${village.name} Hazard Red Zone`, lat: 11.532, lon: 76.124, tier: village.risk_label, population: population_triangulation?.ai_used || 1200, risk_score: 0.94 }
        ]}
      />

      {/* SECTION 1 — Why did the system flag this village? */}
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wider">
          Section 1 — Why did the system flag this village?
        </h2>
        <ul className="space-y-2 text-xs text-gray-800">
          {village.evidence.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#FF9933] font-bold">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* SECTION 2 — What the AI found — Scientific Basis (SHAP Chart & Data Table) */}
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wider">
            Section 2 — What the AI found — Scientific Basis
          </h2>
          <p className="text-xs font-semibold text-[#F57C00] mt-1">
            These are the factors the system weighted most heavily. Verify these on the ground.
          </p>
        </div>

        {/* Horizontal Bar Chart (SHAP Feature Importance) */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase">SHAP Relative Feature Weight</h3>
          {village.shap_features.map((feat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-800">
                <span>{feat.name}</span>
                <span className="text-gray-500">{feat.weight}% weight</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#000080] h-full rounded-full transition-all duration-500"
                  style={{ width: `${feat.weight}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Scientific Data Source Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700 uppercase">
                <th className="p-2.5">Feature</th>
                <th className="p-2.5">What the AI Recorded</th>
                <th className="p-2.5">Data Source</th>
                <th className="p-2.5">What You Should Check on Ground</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {village.data_sources_table.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2.5 font-bold text-gray-900">{row.feature}</td>
                  <td className="p-2.5 font-semibold text-[#000080]">{row.value}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded">
                      [{row.source}]
                    </span>
                  </td>
                  <td className="p-2.5 text-gray-700 leading-snug">{row.to_verify}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 — Population estimate used by AI */}
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wider">
          Section 3 — Population estimate used by AI
        </h2>
        <div className="bg-blue-50/60 p-4 rounded-lg border border-blue-200 text-xs font-semibold text-gray-800 space-y-1">
          <p>
            PMJAY records: <span className="font-bold">{population_triangulation.pmjay}</span> households | PDS ration cards:{' '}
            <span className="font-bold">{population_triangulation.pds}</span> households | DISCOM meters:{' '}
            <span className="font-bold">{population_triangulation.discom}</span> connections | AI used:{' '}
            <span className="font-extrabold text-[#000080] text-sm">{population_triangulation.ai_used} families</span>
          </p>
        </div>
        <p className="text-xs font-bold text-[#FF9933] italic">
          Instruction: Your physical count on the ground will replace this estimate.
        </p>
      </div>

      {/* SECTION 4 — History of this village */}
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4" /> Section 4 — History of this village
        </h2>
        {village.disaster_history && village.disaster_history.length > 0 ? (
          <div className="space-y-2 text-xs">
            {village.disaster_history.map((ev, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded border border-gray-200">
                <span className="font-black text-[#000080] font-mono px-2 py-1 bg-white border rounded">{ev.year}</span>
                <span className="font-bold text-gray-900">{ev.event}:</span>
                <span className="text-gray-700">{ev.damage}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No historical disaster damage logged in past 10 years.</p>
        )}
      </div>

      {/* SECTION 5 — What the system recommends (Intervention Ladder) */}
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wider">
          Section 5 — What the system recommends
        </h2>

        {/* Primary Recommendation Saffron Card */}
        <div className="p-5 bg-orange-50/80 border-2 border-[#FF9933] rounded-lg space-y-1 shadow-xs">
          <span className="text-xs font-extrabold text-[#FF9933] uppercase block tracking-wider">
            Primary Recommended Intervention
          </span>
          <h3 className="text-lg font-black text-[#000080]">
            {intervention_ladder.primary}
          </h3>
        </div>

        {/* Interim Options */}
        {intervention_ladder.interim_options && intervention_ladder.interim_options.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase">
              If full relocation is delayed, these interim measures reduce risk temporarily:
            </h4>
            <div className="space-y-2 text-xs">
              {intervention_ladder.interim_options.map((opt, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>{opt.name}</span>
                    <span className="text-[#138808]">{opt.risk_reduction}</span>
                  </div>
                  <p className="text-gray-600">{opt.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red Notice */}
        <div className="p-4 bg-red-50 border-l-4 border-[#C62828] text-[#C62828] text-xs font-bold rounded-r-md flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 flex-shrink-0" />
          <span>
            Interim options do not make this village safe. This village stays on the Immediate list until relocation is physically verified.
          </span>
        </div>

        {/* Cost of Inaction */}
        <div className="p-3.5 bg-gray-100 rounded border border-gray-300 text-xs font-bold text-gray-800">
          {intervention_ladder.cost_of_inaction}
        </div>
      </div>

      {/* Read-Only Automatic Notifications Sent Log */}
      <ReadOnlyNotifications notifications={village.notifications_sent} />

      {/* Bottom CTA */}
      <div className="pt-2">
        <button
          onClick={() => navigate(`/field/submit?village_id=${village.id}`)}
          className="w-full py-4 bg-[#FF9933] hover:bg-[#e68a2e] text-white font-extrabold text-sm rounded-lg shadow-lg flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          Start Ground Visit Report for {village.name}
        </button>
      </div>
    </div>
  );
}
