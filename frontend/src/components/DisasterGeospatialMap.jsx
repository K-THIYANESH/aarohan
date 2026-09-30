import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG Icons for Red Zones (Disaster Habitations) and Green Zones (Relocation Sites)
const redZoneIcon = L.divIcon({
  className: 'custom-red-zone-marker',
  html: `<div style="background-color: #C62828; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(198,40,40,0.8); animate: pulse;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const relocationSiteIcon = L.divIcon({
  className: 'custom-site-marker',
  html: `<div style="background-color: #138808; width: 22px; height: 22px; border-radius: 4px; border: 3px solid white; box-shadow: 0 0 10px rgba(19,136,8,0.8); display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;">✓</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function DisasterGeospatialMap({ 
  redZones = [], 
  relocationSites = [], 
  center = [11.605, 76.083], 
  zoom = 11,
  height = "380px"
}) {
  const defaultRedZones = redZones.length > 0 ? redZones : [
    { id: 1, name: "Mundakkai Red Zone", lat: 11.532, lon: 76.124, tier: "Immediate", population: 1450, risk_score: 0.94 },
    { id: 2, name: "Wayanad North (Vythiri)", lat: 11.554, lon: 76.042, tier: "Short-term", population: 920, risk_score: 0.88 },
    { id: 3, name: "Chooralmala Slope", lat: 11.528, lon: 76.145, tier: "Immediate", population: 1100, risk_score: 0.91 }
  ];

  const defaultSites = relocationSites.length > 0 ? relocationSites : [
    { id: 1, name: "Meppadi Safe Relocation Site", lat: 11.550, lon: 76.120, capacity: 2500, status: "IN_PROGRESS" },
    { id: 2, name: "Kalpetta Safe Haven Township", lat: 11.608, lon: 76.083, capacity: 4000, status: "APPROVED" }
  ];

  return (
    <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden space-y-2">
      {/* Map Header Legend */}
      <div className="bg-[#102548] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          <span className="text-[#E8C547] uppercase tracking-wider">Geospatial Disaster & Relocation Map</span>
          <span className="text-[10px] bg-[#1A3A6B] text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">● OpenStreetMap Live GIS Layer</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#C62828] border border-white inline-block"></span>
            <span className="text-gray-200">Red Zone (Hazard)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#138808] border border-white inline-block"></span>
            <span className="text-gray-200">Safe Destination Site</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height, width: "100%" }} className="relative z-10">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Red Zone Markers & Hazard Buffers */}
          {defaultRedZones.map((zone) => (
            <React.Fragment key={`red-${zone.id}`}>
              <Circle
                center={[zone.lat, zone.lon]}
                radius={1500}
                pathOptions={{ color: '#C62828', fillColor: '#C62828', fillOpacity: 0.25 }}
              />
              <Marker position={[zone.lat, zone.lon]} icon={redZoneIcon}>
                <Popup>
                  <div className="text-xs space-y-1 font-sans">
                    <h4 className="font-bold text-[#C62828] text-sm">{zone.name}</h4>
                    <p className="text-gray-700"><strong>Severity Tier:</strong> {zone.tier}</p>
                    <p className="text-gray-700"><strong>Population at Risk:</strong> {zone.population} citizens</p>
                    <p className="text-gray-700"><strong>Hazard Index:</strong> {zone.risk_score || '0.92'}</p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* Relocation Destination Sites */}
          {defaultSites.map((site) => (
            <Marker key={`site-${site.id}`} position={[site.lat, site.lon]} icon={relocationSiteIcon}>
              <Popup>
                <div className="text-xs space-y-1 font-sans">
                  <h4 className="font-bold text-[#138808] text-sm">{site.name}</h4>
                  <p className="text-gray-700"><strong>Target Capacity:</strong> {site.capacity || 2000} families</p>
                  <p className="text-gray-700"><strong>Status:</strong> {site.status || 'VERIFIED_SAFE'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
