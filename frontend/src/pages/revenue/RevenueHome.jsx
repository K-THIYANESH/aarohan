import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AlertCircle, Send, Activity, ArrowRight } from 'lucide-react';
import DisasterGeospatialMap from '../../components/DisasterGeospatialMap';

export default function RevenueHome({ showBanner }) {
  const [villages, setVillages] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vRes, sRes] = await Promise.all([
          api.get('/field/villages'),
          api.get('/revenue/sites')
        ]);
        setVillages(vRes.data);
        setSites(sRes.data);
      } catch (err) {
        console.error('Error loading revenue summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" color="text-navy-blue" />
        <p className="text-gray-600 font-semibold text-xs">Loading Revenue Officer Operational Dashboard...</p>
      </div>
    );
  }

  const overdueCases = villages.filter((v) => {
    const daysAtStage = Math.floor((new Date() - new Date(v.stage_entered_at)) / (1000 * 60 * 60 * 24));
    return daysAtStage > 1 || v.current_stage_index === 4;
  });

  const readyForNotifications = villages.filter((v) => {
    const hasFieldReport = v.visit_status === 'REPORT_SUBMITTED';
    const site = sites.find((s) => s.linked_village_name === v.name);
    const landStarted = site && site.verification_status !== 'NOT_STARTED';
    const notifSent = v.circle1_sent_at !== null;
    return hasFieldReport && landStarted && !notifSent;
  });

  const inProgressCases = villages.filter((v) => !readyForNotifications.some((r) => r.id === v.id));

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Institutional Page Title Banner */}
      <div className="bg-white p-4 rounded-xs border border-[#CBD5E1] shadow-2xs flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-[#102548] uppercase tracking-wide">
            Good morning, Revenue Officer M. K. Pillai
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">
            Operational Overview & District Relocation Proceedings Management Dashboard
          </p>
        </div>
        <span className="px-3 py-1 bg-[#EBF5FB] text-[#1A3A6B] font-bold text-[11px] rounded-xs border border-[#1A3A6B]/30 uppercase">
          District Wayanad Cell
        </span>
      </div>

      {/* Live Geospatial GIS Map Component */}
      <DisasterGeospatialMap height="360px" />

      {/* SECTION 1 — Overdue Cases */}
      {overdueCases.length > 0 && (
        <div className="bg-[#FDE8E8] rounded-xs p-4 border-l-4 border-[#C0392B] border-y border-r border-[#CBD5E1] space-y-3">
          <div className="flex items-center gap-2 text-[#C0392B] font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Section 1 — Overdue Cases Action Required ({overdueCases.length})</span>
          </div>
          <div className="space-y-2">
            {overdueCases.map((v) => {
              const daysAtStage = Math.floor((new Date() - new Date(v.stage_entered_at)) / (1000 * 60 * 60 * 24)) || 2;
              return (
                <div key={v.id} className="bg-white p-3.5 rounded-xs border border-[#CBD5E1] flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="font-bold text-[#102548] text-xs">{v.name} ({v.district})</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Pending Stage: <span className="font-bold text-[#1A1A1A]">Land Verification</span> • Days Overdue:{' '}
                      <span className="font-bold text-[#C0392B]">{daysAtStage} days</span>
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/revenue/timeline')}
                    className="px-3 py-1.5 bg-[#C0392B] hover:bg-red-800 text-white font-bold text-xs rounded-xs flex items-center gap-1.5"
                  >
                    View Timeline & Escalate
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2 — Ready to Send Notifications */}
      <div className="bg-[#FEF3E2] rounded-xs p-4 border-l-4 border-[#E67E22] border-y border-r border-[#CBD5E1] space-y-3">
        <div className="flex items-center gap-2 text-[#E67E22] font-bold text-xs uppercase tracking-wider">
          <Send className="w-4 h-4" />
          <span>Section 2 — Ready to Send Ecosystem Notifications ({readyForNotifications.length})</span>
        </div>
        {readyForNotifications.length === 0 ? (
          <p className="text-xs text-[#64748B] italic">No villages currently pending notification dispatch.</p>
        ) : (
          <div className="space-y-2">
            {readyForNotifications.map((v) => (
              <div key={v.id} className="bg-white p-3.5 rounded-xs border border-[#CBD5E1] flex items-center justify-between shadow-2xs">
                <div>
                  <h3 className="font-bold text-[#102548] text-xs">{v.name} ({v.district})</h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Severity Tier: <span className="font-bold text-[#E67E22]">{v.ai_tier}</span> • Field Officer Report:{' '}
                    <span className="font-bold text-[#1A1A1A]">{v.assigned_officer}</span>
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/revenue/notifications/${v.id}`)}
                  className="px-3.5 py-1.5 bg-[#1A3A6B] hover:bg-[#102548] text-white font-bold text-xs rounded-xs flex items-center gap-1.5 border-b-2 border-[#C9A227]"
                >
                  Send Ecosystem Notifications
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3 — In Progress Cases */}
      <div className="bg-white rounded-xs p-4 border border-[#CBD5E1] shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-[#102548] font-bold text-xs uppercase tracking-wider pb-2 border-b border-[#CBD5E1]">
          <Activity className="w-4 h-4 text-[#C9A227]" />
          <span>Section 3 — Active Relocation Proceedings Queue ({inProgressCases.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#102548] text-white font-bold uppercase text-[11px] border-b-2 border-[#C9A227]">
                <th className="p-2.5">Village Name</th>
                <th className="p-2.5">AI Risk Tier</th>
                <th className="p-2.5">Current Stage</th>
                <th className="p-2.5 text-center">Days at Stage</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E1] font-medium text-[12px]">
              {inProgressCases.map((v) => {
                const daysAtStage = Math.floor((new Date() - new Date(v.stage_entered_at)) / (1000 * 60 * 60 * 24)) || 1;
                return (
                  <tr key={v.id} className="hover:bg-[#F0F4F9]">
                    <td className="p-2.5 font-bold text-[#102548]">{v.name}</td>
                    <td className="p-2.5 font-bold text-gray-800">{v.ai_tier}</td>
                    <td className="p-2.5 font-semibold text-[#1A1A1A]">Stage #{v.current_stage_index}</td>
                    <td className="p-2.5 text-center font-mono font-bold">{daysAtStage} d</td>
                    <td className="p-2.5 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/casefile/${v.id}`)}
                        className="px-2.5 py-1 bg-[#102548] text-white font-bold rounded-xs hover:bg-[#1A3A6B] text-[11px]"
                      >
                        📁 Master Dossier
                      </button>
                      <button
                        onClick={() => navigate('/revenue/timeline')}
                        className="px-2.5 py-1 bg-white border border-[#1A3A6B] text-[#1A3A6B] font-bold rounded-xs hover:bg-[#F0F4F9] text-[11px]"
                      >
                        View Timeline
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4 — Strategic AI & Governance Quick Intelligence Widget */}
      <div className="bg-white rounded-xs p-4 border-t-4 border-[#102548] border-x border-b border-[#CBD5E1] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#CBD5E1]">
          <div className="flex items-center gap-2 text-[#102548] font-bold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4 text-[#C9A227]" />
            <span>Section 4 — Strategic AI Predictive & Legal Intelligence Suite</span>
          </div>
          <button
            onClick={() => navigate('/strategic')}
            className="px-3 py-1 bg-[#102548] hover:bg-[#1A3A6B] text-[#E8C547] text-xs font-bold rounded-xs flex items-center gap-1 transition-colors"
          >
            Open Full Strategic AI Hub <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Card 1: Resistance Risk */}
          <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xs space-y-1">
            <span className="font-bold text-[#102548] block">Community Resistance Index</span>
            <p className="text-[11px] text-gray-600">Wayanad North (Vythiri): <strong className="text-amber-700">74.5/100 (HIGH)</strong></p>
            <span className="inline-block text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-xs mt-1">
              Gram Sabha Liaison Required
            </span>
          </div>

          {/* Card 2: Climate Trajectory */}
          <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xs space-y-1">
            <span className="font-bold text-[#102548] block">2036 Climate Trajectory</span>
            <p className="text-[11px] text-gray-600">Mundakkai Slope Hazard: <strong className="text-rose-700">0.88 (EXTREME)</strong></p>
            <span className="inline-block text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-xs mt-1">
              IPCC AR6 Downscaling Alert
            </span>
          </div>

          {/* Card 3: MILP Budget Solver */}
          <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xs space-y-1">
            <span className="font-bold text-[#102548] block">State Budget Optimization</span>
            <p className="text-[11px] text-gray-600">Max Protected Lives: <strong className="text-emerald-700">2,370 Citizens</strong></p>
            <span className="inline-block text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-xs mt-1">
              MILP Solver Knapsack Optimal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
