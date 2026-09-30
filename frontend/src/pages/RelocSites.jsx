import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Hospital, Truck, Droplets, Home } from 'lucide-react';

export default function RelocSites({ showBanner }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const response = await api.get('/sites');
        setSites(response.data);
      } catch (err) {
        console.error('Error fetching sites:', err);
        if (showBanner) showBanner('Something went wrong. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const getRankBadge = (rankLabel) => {
    switch (rankLabel) {
      case 'Best Option':
        return <span className="px-3 py-1 bg-[#138808] text-white text-xs font-bold rounded-full">Best Option</span>;
      case 'Good Option':
        return <span className="px-3 py-1 bg-[#F57C00] text-white text-xs font-bold rounded-full">Good Option</span>;
      case 'Limited Capacity':
        return <span className="px-3 py-1 bg-gray-600 text-white text-xs font-bold rounded-full">Limited Capacity</span>;
      default:
        return <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">{rankLabel}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-[#000080]">Safe Relocation Sites</h1>

      {loading ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" color="text-navy-blue" />
          <span className="text-sm font-semibold">Loading Relocation Sites...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sites.map((site) => {
            const used = site.occupied_families;
            const total = site.capacity_families;
            const percentage = Math.min(100, Math.round((used / total) * 100));

            return (
              <div key={site.id} className="bg-white rounded-lg border border-gray-300 shadow-sm p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#000080]">{site.name}</h2>
                    <p className="text-xs font-semibold text-gray-500">{site.district}, {site.state}</p>
                  </div>
                  {getRankBadge(site.rank_label)}
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Occupancy</span>
                    <span>{used} of {total} families placed</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#138808] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Amenity Rows */}
                <div className="space-y-2 pt-2 text-xs border-t border-gray-200">
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2 text-gray-600 font-medium">
                      <Home className="w-4 h-4 text-gray-400" /> Land Available
                    </span>
                    <span className={`font-bold ${site.land_available ? 'text-[#138808]' : 'text-[#C62828]'}`}>
                      {site.land_available ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2 text-gray-600 font-medium">
                      <Droplets className="w-4 h-4 text-gray-400" /> Water Supply
                    </span>
                    <span className={`font-bold ${site.water_supply ? 'text-[#138808]' : 'text-[#C62828]'}`}>
                      {site.water_supply ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2 text-gray-600 font-medium">
                      <Truck className="w-4 h-4 text-gray-400" /> Road Access
                    </span>
                    <span className={`font-bold ${site.road_access ? 'text-[#138808]' : 'text-[#C62828]'}`}>
                      {site.road_access ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2 text-gray-600 font-medium">
                      <Hospital className="w-4 h-4 text-gray-400" /> Hospital Distance
                    </span>
                    <span className="font-bold text-gray-800">{site.hospital_distance_km} km</span>
                  </div>
                </div>

                {/* Linked Villages Footer */}
                <div className="pt-3 border-t border-gray-200 text-xs">
                  <span className="text-gray-500 font-medium">Villages approved to relocate here: </span>
                  <span className="font-bold text-gray-800">
                    {site.id === 1 ? 'Mundakkai, Pithoragarh' : site.id === 2 ? 'Wayanad North (Vythiri)' : 'None assigned'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
