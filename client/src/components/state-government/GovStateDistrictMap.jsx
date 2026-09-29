import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Building2, Flame, ArrowRight, Layers, Sparkles, Activity, ShieldCheck } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import stateBoundariesData from '../../../../data/sample/state_boundaries.json';
import stateDistrictsData from '../../../../data/sample/state_districts.json';

// State Boundaries (Bounds & Delimitation Polygon Outline)
export const STATE_BOUNDARIES = stateBoundariesData;

import stateDistrictsData from '@data/district_hotspots.json';

// District Coordinates and Baseline Factor Indices (0-100 normalized)
export const STATE_DISTRICTS_DATA = stateDistrictsData;

// Calculate normalized 5-factor priority score with equal 20% weighting
export function calculateDistrictPriority(districtItem = {}, actualCount = null) {
  if (!districtItem) {
    return {
      name: 'District',
      coords: [19.7515, 75.7139],
      demand: 65,
      infraGap: 70,
      impact: 70,
      vulnerability: 65,
      urgency: 70,
      priorityScore: 68.0,
      intensity: 'Moderate',
      topCategory: 'General Development'
    };
  }

  const count = typeof actualCount === 'number' ? actualCount : 0;
  let demandScore = count > 0
    ? Math.min(96, Math.max(50, 55 + count * 6))
    : (districtItem.demand || 65);

  const infraGap = districtItem.infraGap || 70;
  const impact = districtItem.impact || 75;
  const vulnerability = districtItem.vulnerability || 65;
  const urgency = count > 0 ? Math.min(95, 70 + count * 3) : (districtItem.urgency || 70);

  // Formula: Priority Score = (Demand + InfraGap + Impact + Vulnerability + Urgency) / 5
  const rawScore = (demandScore + infraGap + impact + vulnerability + urgency) / 5;
  const priorityScore = parseFloat(rawScore.toFixed(1));
  const validScore = isNaN(priorityScore) ? 65.0 : priorityScore;

  return {
    name: districtItem.name || 'District',
    coords: districtItem.coords || [19.7515, 75.7139],
    demand: demandScore,
    infraGap,
    impact,
    vulnerability,
    urgency,
    priorityScore: validScore,
    intensity: validScore >= 75 ? 'High' : validScore >= 60 ? 'Moderate' : 'Lower',
    topCategory: districtItem.topCategory || 'General Development'
  };
}

function MapViewBoundsUpdater({ bounds, center, zoom, selectedDistrictData }) {
  const map = useMap();
  useEffect(() => {
    try {
      if (selectedDistrictData && selectedDistrictData.coords) {
        map.setView(selectedDistrictData.coords, 8.5, { animate: true, duration: 0.8 });
      } else if (bounds && Array.isArray(bounds) && bounds.length === 2 && Array.isArray(bounds[0]) && Array.isArray(bounds[1])) {
        map.fitBounds(bounds, { padding: [20, 20], animate: true, duration: 0.8 });
      } else if (center && Array.isArray(center) && center.length === 2) {
        map.setView(center, zoom || 6.5, { animate: true });
      }
    } catch (e) {
      console.warn('Map bounds update warning:', e);
    }
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {}
    }, 200);
    return () => clearTimeout(timer);
  }, [bounds, center, zoom, selectedDistrictData, map]);
  return null;
}

export default function GovStateDistrictMap({
  activeState = 'Maharashtra',
  districtSummary = {},
  selectedDistrict = null,
  onSelectDistrict,
  selectedCategory = null
}) {
  const boundaryConfig = STATE_BOUNDARIES[activeState] || STATE_BOUNDARIES['Maharashtra'] || {
    bounds: [[15.6, 72.6], [22.1, 80.9]],
    center: [19.7515, 75.7139],
    zoom: 6.5,
    polygon: []
  };
  const districtsRaw = STATE_DISTRICTS_DATA[activeState] || STATE_DISTRICTS_DATA['Maharashtra'] || [];

  // Compute 5-factor priority metrics for every district in the state
  const districts = (districtsRaw || []).map((d) => {
    const actualCount = (districtSummary && districtSummary[d.name] !== undefined) ? districtSummary[d.name] : 0;
    const calculated = calculateDistrictPriority(d, actualCount);
    return {
      ...d,
      ...calculated,
      actualCount
    };
  }).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  const selectedDistrictData = selectedDistrict && selectedDistrict !== 'All Districts'
    ? districts.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase())
    : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-full min-h-[580px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-[#002B49] text-white shadow-xs">
            <Building2 className="w-4 h-4 text-[#FF9933]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm text-[#002B49] tracking-tight">
                {activeState} State Boundary & District Hotspots
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Interactive civic monitoring map &bull; Real-time regional demand density
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-extrabold border border-blue-200">
            {districts.length} Districts Analyzed
          </span>
        </div>
      </div>

      {/* Map View */}
      <div className="relative w-full h-[470px] min-h-[470px] flex-1">
        <MapContainer
          center={boundaryConfig.center}
          zoom={boundaryConfig.zoom}
          scrollWheelZoom={true}
          attributionControl={false}
          style={{ height: '100%', width: '100%', minHeight: '470px' }}
        >
          <MapViewBoundsUpdater
            bounds={boundaryConfig.bounds}
            center={boundaryConfig.center}
            zoom={boundaryConfig.zoom}
            selectedDistrictData={selectedDistrictData}
          />

          <TileLayer
            attribution="&copy; Google Maps"
            url={`https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? `&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}` : ''}`}
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={21}
          />

          {/* 1. Official State Delimitation Boundary Polygon */}
          {boundaryConfig.polygon && (
            <Polygon
              positions={boundaryConfig.polygon}
              pathOptions={{
                color: '#38BDF8',
                weight: 3.5,
                dashArray: '6, 6',
                fillColor: '#0284C7',
                fillOpacity: 0.12
              }}
            />
          )}

          {/* 2. District-Level Hotspots */}
          {districts.map((d) => {
            const isSelected = selectedDistrict === d.name;
            const isHigh = (d.actualCount || 0) >= 15 || d.priorityScore >= 75;
            const isModerate = ((d.actualCount || 0) >= 5 && (d.actualCount || 0) < 15) || (d.priorityScore >= 60 && d.priorityScore < 75);
            
            const coreColor = isHigh ? '#E11D48' : isModerate ? '#D97706' : '#059669'; // Rose, Amber, Emerald
            const fillColor = isHigh ? '#F43F5E' : isModerate ? '#F59E0B' : '#10B981';
            const radius = Math.max(13, Math.min(26, Math.round(d.priorityScore * 0.28)));

            return (
              <React.Fragment key={`dist-hs-${d.name}`}>
                {/* District Hotspot Outer Halo */}
                <CircleMarker
                  center={d.coords}
                  radius={radius + (isSelected ? 10 : 6)}
                  pathOptions={{
                    color: isSelected ? '#002B49' : coreColor,
                    fillColor: coreColor,
                    fillOpacity: isSelected ? 0.45 : isHigh ? 0.25 : 0.15,
                    weight: isSelected ? 2.5 : 1,
                    dashArray: isSelected ? '4, 4' : undefined
                  }}
                />

                {/* District Hotspot Core Marker */}
                <CircleMarker
                  center={d.coords}
                  radius={radius}
                  pathOptions={{
                    color: isSelected ? '#002B49' : '#FFFFFF',
                    fillColor: fillColor,
                    fillOpacity: isSelected ? 1 : 0.9,
                    weight: isSelected ? 3 : 2
                  }}
                  eventHandlers={{
                    click: () => onSelectDistrict && onSelectDistrict(d.name, d)
                  }}
                >
                  <Popup>
                    <div className="p-2 space-y-2 text-slate-800 text-xs max-w-xs font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                        <div>
                          <span className="font-extrabold text-sm text-[#002B49] block">
                            {d.name} District
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {d.actualCount} Recorded Requests
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                          isHigh ? 'bg-rose-100 text-rose-900' : isModerate ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {isHigh ? 'High Priority' : isModerate ? 'Moderate' : 'Standard'}
                        </span>
                      </div>

                      {/* District Overview */}
                      <div className="space-y-1 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex justify-between text-slate-700">
                          <span>Primary Sector:</span>
                          <strong className="font-semibold text-slate-900">{d.topCategory || 'Civic Infrastructure'}</strong>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>Citizen Submissions:</span>
                          <strong className="font-bold text-[#002B49]">{d.actualCount} requests</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectDistrict && onSelectDistrict(d.name, d)}
                        className="w-full mt-2 py-2 px-3 rounded-xl bg-[#002B49] hover:bg-[#003961] text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <span>Filter & View {d.name} Demands</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#FF9933]" />
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg text-[11px] space-y-1.5 z-[1000]">
          <span className="font-black text-[#002B49] block text-[10px] uppercase tracking-wider">
            {activeState} District Hotspots
          </span>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-700"></span>
            <span className="text-slate-700 font-semibold">🔴 High Priority Demands</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700"></span>
            <span className="text-slate-700 font-semibold">🟠 Moderate Priority Demands</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-700"></span>
            <span className="text-slate-700 font-semibold">🟢 Standard Priority Demands</span>
          </div>
          <div className="flex items-center space-x-2 pt-0.5 border-t border-slate-100">
            <span className="w-3.5 h-1 border-b-2 border-dashed border-[#002B49]"></span>
            <span className="text-slate-700 font-semibold">State Delimitation Boundary</span>
          </div>
        </div>

        {/* Map Attribution Footer */}
        <div className="absolute bottom-2 right-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded shadow-xs border border-slate-200/80 text-[11px] font-semibold text-slate-700 pointer-events-none select-none flex items-center space-x-1">
          <span>Google Maps</span>
        </div>
      </div>

      {/* Quick District Jump Strip Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between overflow-x-auto gap-2">
        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
          District Jump:
        </span>
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {districts.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => onSelectDistrict && onSelectDistrict(d.name, d)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                selectedDistrict === d.name
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{d.name}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                selectedDistrict === d.name ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-600'
              }`}>
                {d.priorityScore}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
