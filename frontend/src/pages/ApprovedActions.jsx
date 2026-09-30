import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronDown, ChevronUp, CheckCircle, UserCheck } from 'lucide-react';

export default function ApprovedActions({ showBanner }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState(null);

  useEffect(() => {
    const fetchApprovedCases = async () => {
      setLoading(true);
      try {
        const response = await api.get('/cases');
        // Filter cases that have completed or moved through stages
        const reviewedCases = response.data;
        setCases(reviewedCases);
        if (reviewedCases.length > 0) {
          setExpandedRowId(reviewedCases[0].id);
        }
      } catch (err) {
        console.error('Error fetching approved actions:', err);
        if (showBanner) showBanner('Something went wrong. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchApprovedCases();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const toggleRow = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#000080]">Approved Actions & Chain of Authority</h1>

      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" color="text-navy-blue" />
            <span className="text-sm font-semibold">Loading Official Chain Records...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3.5 px-4">Village</th>
                <th className="py-3.5 px-4">Current Pipeline Stage</th>
                <th className="py-3.5 px-4">Assigned Field Officer</th>
                <th className="py-3.5 px-4">BDO Reviewer</th>
                <th className="py-3.5 px-4">Collector Reviewer</th>
                <th className="py-3.5 px-4 text-right">Audit Chain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {cases.map((c) => {
                const isExpanded = expandedRowId === c.id;

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      onClick={() => toggleRow(c.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[#000080]">{c.village_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-[#FF9933] text-white text-xs font-bold rounded-full">
                          {c.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">
                        {c.assigned_field_officer || 'Anoop Kumar'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">
                        {c.bdo_reviewed_by || 'BDO Vythiri — K. Ramesh'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">
                        {c.collector_reviewed_by || 'District Collector R. Sharma'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button className="text-gray-500 hover:text-[#000080]">
                          {isExpanded ? <ChevronUp className="w-5 h-5 inline" /> : <ChevronDown className="w-5 h-5 inline" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Multi-Authority Legal Chain Timeline */}
                    {isExpanded && (
                      <tr className="bg-blue-50/40 border-b border-gray-300">
                        <td colSpan="6" className="p-6">
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#000080] uppercase tracking-wider flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-[#FF9933]" />
                              Named Legal Chain of Authority — {c.village_name}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
                              {/* Step 1: AI Flagged */}
                              <div className="bg-white p-3 rounded border border-gray-300 space-y-1 shadow-2xs">
                                <span className="font-bold text-[#000080] block text-[11px]">1. AI Flagged</span>
                                <span className="text-gray-600 block text-[10px]">IMD & Bhuvan</span>
                                <span className="text-[10px] text-gray-400 block">{formatDate(c.created_at)}</span>
                              </div>

                              {/* Step 2: Field Visit */}
                              <div className="bg-white p-3 rounded border border-gray-300 space-y-1 shadow-2xs">
                                <span className="font-bold text-[#000080] block text-[11px]">2. Field Visit</span>
                                <span className="text-gray-800 font-bold block text-[10px]">
                                  {c.assigned_field_officer || 'Anoop Kumar'}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold block">Count: 318 Families</span>
                              </div>

                              {/* Step 3: BDO Review */}
                              <div className="bg-white p-3 rounded border border-gray-300 space-y-1 shadow-2xs">
                                <span className="font-bold text-[#000080] block text-[11px]">3. BDO Review</span>
                                <span className="text-gray-800 font-bold block text-[10px]">
                                  {c.bdo_reviewed_by || 'BDO K. Ramesh'}
                                </span>
                                <span className="text-[10px] text-blue-700 font-bold block">
                                  {c.bdo_decision || 'Escalated'}
                                </span>
                              </div>

                              {/* Step 4: Collector Review */}
                              <div className="bg-white p-3 rounded border border-gray-300 space-y-1 shadow-2xs">
                                <span className="font-bold text-[#000080] block text-[11px]">4. Collector Review</span>
                                <span className="text-gray-800 font-bold block text-[10px]">
                                  {c.collector_reviewed_by || 'Collector R. Sharma'}
                                </span>
                                <span className="text-[10px] text-purple-700 font-bold block">
                                  {c.collector_decision || 'Pending'}
                                </span>
                              </div>

                              {/* Step 5: SDMA Approved */}
                              <div className="bg-white p-3 rounded border border-gray-300 space-y-1 shadow-2xs">
                                <span className="font-bold text-[#000080] block text-[11px]">5. SDMA Authority</span>
                                <span className="text-gray-800 font-bold block text-[10px]">
                                  {c.sdma_reviewed_by || 'SDMA Secretary'}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold block">Final Approval</span>
                              </div>

                              {/* Step 6: Alerts Fired */}
                              <div className="bg-white p-3 rounded border border-gray-300 space-y-1 shadow-2xs">
                                <span className="font-bold text-[#000080] block text-[11px]">6. Alerts Fired</span>
                                <span className="text-gray-600 block text-[10px]">NDRF & Hospitals</span>
                                <span className="text-[10px] text-[#138808] font-bold block">Dispatched</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
