import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Globe, Flame, ShieldAlert, ArrowRight, TrendingUp, Sparkles, Building2, MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

<<<<<<< HEAD
import nationalHotspotsData from '@data/national_hotspots.json';

// Central Indian State Centroids with analytical display metadata
export const NATIONAL_STATE_HOTSPOTS = nationalHotspotsData;
=======
import stateHotspotsData from '../../../../data/sample/state_hotspots.json';

// Central Indian State Centroids with analytical display metadata
export const NATIONAL_STATE_HOTSPOTS = stateHotspotsData;
>>>>>>> dd0e3a88bd0e5dd9f6a8e5d67bd84003398e3618

// Helper Leaflet controller component to dynamically fly to selected state
function MapController({ focusedState }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (focusedState) {
      const stateObj = NATIONAL_STATE_HOTSPOTS.find(
        (s) => s.name.toLowerCase() === focusedState.toLowerCase()
      );
      if (stateObj && stateObj.center) {
        map.flyTo(stateObj.center, 6.5, { duration: 1.2 });
      }
    } else {
      map.flyTo([22.5937, 78.9629], 4.6, { duration: 1.2 });
    }
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [focusedState, map]);

  return null;
}

const normCat = (str) => (str || '').toLowerCase().replace('&', 'and').trim();

export default function GovIndiaNationalMap({
  stateSummaries = {},
  onSelectState,
  selectedCategory = null,
  focusedState = null
}) {
  const getScoreColor = (score) => {
    if (score >= 90) return { bg: '#E11D48', border: '#9F1239', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' };
    if (score >= 80) return { bg: '#EA580C', border: '#9A3412', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-900' };
    return { bg: '#2563EB', border: '#1D4ED8', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-900' };
  };

  const categoryNormalized = selectedCategory ? normCat(selectedCategory) : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden flex flex-col w-full min-h-[520px]">
      {/* Map Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#002B49] text-white shadow-xs">
            <Globe className="w-5 h-5 text-[#FF9933]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-sm sm:text-base text-[#002B49] tracking-tight">
                {selectedCategory ? `National ${selectedCategory} Demand Hotspots` : 'National Development Demand Hotspots'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FF9933]/15 text-[#9A3412] text-[10px] font-black border border-[#FF9933]/30">
                {selectedCategory ? `${selectedCategory} Sector` : 'India Level'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {selectedCategory
                ? `Visualizing state-level ${selectedCategory.toLowerCase()} demands and priority scores`
                : 'Visualizing relative state-level demand concentration and infrastructure priority scores'}
            </p>
          </div>
        </div>

        {/* Analytical Priority Formula Note */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
          <span>Priority = Citizen Demand + Infra Gap + Impact + Urgency</span>
        </div>
      </div>

      {/* National Intelligence Map Area */}
      <div className="relative w-full h-[480px] min-h-[480px]">
        <MapContainer
          center={[22.5937, 78.9629]}
          zoom={4.6}
          scrollWheelZoom={true}
          attributionControl={false}
          style={{ height: '480px', width: '100%', minHeight: '480px' }}
        >
          <MapController focusedState={focusedState} />

          <TileLayer
            attribution="&copy; Google Maps"
            url={`https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? `&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}` : ''}`}
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={21}
          />

          {NATIONAL_STATE_HOTSPOTS.map((stateItem) => {
            const dynamicSummary = stateSummaries[stateItem.name];
            let catDemands = 0;

            if (categoryNormalized && dynamicSummary?.byCategory) {
              Object.entries(dynamicSummary.byCategory).forEach(([catKey, count]) => {
                const normKey = normCat(catKey);
                if (normKey === categoryNormalized || normKey.includes(categoryNormalized) || categoryNormalized.includes(normKey)) {
                  catDemands += count;
                }
              });
            }

            const liveTotal = categoryNormalized
              ? catDemands
              : (dynamicSummary?.total !== undefined ? dynamicSummary.total : 0);

            const topCat = dynamicSummary?.byCategory && Object.keys(dynamicSummary.byCategory).length > 0
              ? Object.entries(dynamicSummary.byCategory).sort((a, b) => b[1] - a[1])[0][0]
              : stateItem.topCategory;

            const stateTotal = dynamicSummary?.total || 0;
            let priorityScore = stateTotal > 0 ? Math.min(98, Math.max(60, 60 + stateTotal * 4)) : (stateItem.priorityScore || 70);
            if (categoryNormalized && catDemands > 0) {
              priorityScore = Math.min(99, priorityScore + Math.min(20, catDemands * 5));
            }

            const isFocused = focusedState && focusedState.toLowerCase() === stateItem.name.toLowerCase();
            const colors = getScoreColor(priorityScore);
            const radius = isFocused
              ? Math.min(36, Math.max(22, liveTotal > 20 ? 30 : 22))
              : Math.min(32, Math.max(14, liveTotal > 20 ? 24 : 16));

            return (
              <React.Fragment key={`state-${stateItem.code}`}>
                {/* Outer Pulsing Wave Ring for high demand or focused state */}
                {(priorityScore >= 85 || isFocused) && (
                  <CircleMarker
                    center={stateItem.center}
                    radius={radius + (isFocused ? 16 : 12)}
                    pathOptions={{
                      color: isFocused ? '#002B49' : colors.bg,
                      fillColor: isFocused ? '#FF9933' : colors.bg,
                      fillOpacity: isFocused ? 0.3 : 0.15,
                      weight: isFocused ? 2.5 : 1.5,
                      dashArray: isFocused ? '6, 6' : '4, 4'
                    }}
                  />
                )}

                {/* State Priority Marker */}
                <CircleMarker
                  center={stateItem.center}
                  radius={radius}
                  pathOptions={{
                    color: isFocused ? '#002B49' : colors.border,
                    fillColor: isFocused ? '#FF9933' : colors.bg,
                    fillOpacity: isFocused ? 0.95 : 0.88,
                    weight: isFocused ? 4 : 2.5
                  }}
                >
                  <Popup>
                    <div className="p-2 space-y-2.5 text-slate-800 text-xs max-w-xs font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                        <span className="font-mono text-xs font-black text-[#002B49]">
                          {stateItem.code} &bull; {stateItem.capital}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${colors.badge}`}>
                          Score: {priorityScore}/100
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-[#002B49] flex items-center space-x-1.5">
                          <span>{stateItem.name}</span>
                          <span className="text-xs font-semibold text-slate-500">State</span>
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {stateItem.popImpact} &bull; {stateItem.level}
                        </p>
                      </div>

                      {/* Demand Metric Summary */}
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            {selectedCategory ? `${selectedCategory} Demands:` : 'Citizen Demands:'}
                          </span>
                          <span className="font-bold text-slate-900">{liveTotal} Demands</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Top Issue Sector:</span>
                          <span className="font-bold text-blue-700">{selectedCategory || topCat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Infrastructure Gap:</span>
                          <span className="font-bold text-amber-800">{stateItem.infraGap}</span>
                        </div>
                      </div>

                      {/* Interactive CTA to drill down into this state */}
                      <button
                        onClick={() => onSelectState(stateItem.name)}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#002B49] hover:bg-[#003961] text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-sm hover:shadow-md"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#FF9933]" />
                        <span>Inspect {stateItem.name} Intelligence</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#FF9933]" />
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Map Attribution Footer */}
        <div className="absolute bottom-2 right-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded shadow-xs border border-slate-200/80 text-[11px] font-semibold text-slate-700 pointer-events-none select-none flex items-center space-x-1">
          <span>Google Maps</span>
        </div>
      </div>

      {/* Map Legend Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-3 text-[11px] font-semibold">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span>Critical Priority (Score &gt; 90)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-600"></span>
            <span>High Priority (Score 80–89)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span>Moderate Priority (Score &lt; 80)</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          Click any state marker on map or from list to enter State Intelligence View
        </span>
      </div>
    </div>
  );
}

