import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CheckSquare, WifiOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function MySubmittedReports({ showBanner }) {
  const [reports, setReports] = useState([]);
  const [villages, setVillages] = useState([]);
  const [pendingSync, setPendingSync] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchParams] = useSearchParams();
  const highlightVillageId = searchParams.get('village_id') ? parseInt(searchParams.get('village_id')) : null;

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [rRes, vRes] = await Promise.all([
          api.get('/field/reports'),
          api.get('/field/villages')
        ]);
        setReports(rRes.data);
        setVillages(vRes.data);
        const offline = JSON.parse(localStorage.getItem('aarohan_pending_sync_reports') || '[]');
        setPendingSync(offline);
      } catch (err) {
        console.error('Error fetching field reports:', err);
        if (showBanner) showBanner('Failed to load submitted reports.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#000080] text-white rounded-lg">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#000080]">My Submitted Reports</h1>
          <p className="text-xs font-semibold text-gray-500">
            Historical log of all ground visit inspection reports submitted by Field Officer Anoop Kumar.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" color="text-navy-blue" />
            <span className="text-sm font-semibold">Loading Report Register...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3.5 px-4">Village</th>
                <th className="py-3.5 px-4">Visit Date</th>
                <th className="py-3.5 px-4">Recommendation Given</th>
                <th className="py-3.5 px-4">Submission Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {/* Render offline pending sync items first */}
              {pendingSync.map((rep, idx) => (
                <tr key={`off-${idx}`} className="bg-orange-50/60 font-medium">
                  <td className="py-3.5 px-4 font-bold text-[#000080]">Village ID #{rep.village_id}</td>
                  <td className="py-3.5 px-4 text-xs font-mono">{rep.visit_date}</td>
                  <td className="py-3.5 px-4 font-bold text-[#FF9933]">{rep.field_officer_recommendation}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-[#F57C00] text-white text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                      <WifiOff className="w-3 h-3" /> Pending Sync
                    </span>
                  </td>
                </tr>
              ))}

              {/* Render online synced reports */}
              {reports.length === 0 && pendingSync.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500 text-sm font-semibold">
                    No reports submitted yet.
                  </td>
                </tr>
              ) : null}
              {reports.map((rep) => {
                const villageName = villages.find(v => v.id === rep.village_id)?.name;
                const isHighlighted = highlightVillageId && rep.village_id === highlightVillageId;
                return (
                  <tr
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-emerald-50 border-l-4 border-[#138808] hover:bg-emerald-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#000080]">
                      {villageName || `Village ID #${rep.village_id}`}
                      {isHighlighted && (
                        <span className="ml-2 px-1.5 py-0.5 bg-[#138808] text-white text-[10px] font-bold rounded">← This Report</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-700">{rep.visit_date}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">{rep.field_officer_recommendation}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-[#138808] text-white text-xs font-bold rounded-full">
                        Submitted
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Read-Only Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl space-y-3 border border-gray-300 text-xs">
            <h3 className="text-base font-bold text-[#000080] border-b pb-2">
              Submitted Report — {villages.find(v => v.id === selectedReport.village_id)?.name || `Village ID #${selectedReport.village_id}`}
            </h3>
            <p><strong>Inspector:</strong> {selectedReport.submitted_by}</p>
            <p><strong>Visit Date:</strong> {selectedReport.visit_date} (GPS: {selectedReport.gps_coordinates})</p>
            <p><strong>Physical Count:</strong> {selectedReport.actual_families_count} families ({selectedReport.houses_in_risk_zone} risk structures)</p>
            <p><strong>Landslide Signs:</strong> {selectedReport.landslide_signs_observed ? 'Yes' : 'No'}</p>
            <p><strong>Recommendation:</strong> <span className="font-bold text-[#FF9933]">{selectedReport.field_officer_recommendation}</span></p>
            <div className="p-3 bg-gray-50 rounded border">
              <strong>Observations:</strong> "{selectedReport.observations}"
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-[#000080] text-white font-bold rounded"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
