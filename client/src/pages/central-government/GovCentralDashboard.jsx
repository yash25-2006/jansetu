import React, { useState, useEffect } from 'react';
import GovIndiaNationalMap, { NATIONAL_STATE_HOTSPOTS } from '../../components/central-government/GovIndiaNationalMap';
import GovStateDistrictMap from '../../components/state-government/GovStateDistrictMap';
import GovStateCategoryOverview from '../../components/state-government/GovStateCategoryOverview';
import GovDistrictIntelligenceView from '../../components/state-government/GovDistrictIntelligenceView';
import GovCategoryIntelligenceView from '../../components/shared-government/GovCategoryIntelligenceView';
import GovRequestDetailModal from '../../components/shared-government/GovRequestDetailModal';
import {
  fetchGovDashboardSummary,
  fetchRequests,
  fetchGovHotspots,
  fetchAiSummary
} from '../../services/api';
import {
  Landmark,
  Globe2,
  Building2,
  MapPin,
  LogOut,
  User,
  ShieldCheck,
  Flame,
  ArrowRight,
  ChevronRight,
  RotateCw,
  Sparkles,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowLeft,
  HeartPulse,
  Truck,
  GraduationCap,
  Droplets,
  Zap,
  Wifi,
  Sprout,
  Home,
  MessageSquare
} from 'lucide-react';

const SUPPORTED_STATES = ['Maharashtra', 'Assam', 'Rajasthan', 'Tamil Nadu'];

const CENTRAL_CATEGORIES = [
  { name: 'Healthcare', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-200', desc: 'Primary health centers & hospitals' },
  { name: 'Roads and Transport', altName: 'Roads & Transport', icon: Truck, color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Highways, bridges & transit links' },
  { name: 'Education', icon: GraduationCap, color: 'text-blue-600 bg-blue-50 border-blue-200', desc: 'Schools, classrooms & staff' },
  { name: 'Water and Sanitation', altName: 'Water & Sanitation', icon: Droplets, color: 'text-cyan-600 bg-cyan-50 border-cyan-200', desc: 'Piped drinking water & drainage' },
  { name: 'Electricity', icon: Zap, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', desc: 'Grid supply & agricultural power' },
  { name: 'Digital Connectivity', icon: Wifi, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', desc: 'Telecom towers & broadband' },
  { name: 'Agriculture', icon: Sprout, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Crop storage, APMC & irrigation' },
  { name: 'Housing', icon: Home, color: 'text-orange-600 bg-orange-50 border-orange-200', desc: 'Rural shelter & housing' },
  { name: 'Others', altName: 'Other', icon: Layers, color: 'text-slate-600 bg-slate-50 border-slate-200', desc: 'General civic infrastructure' },
];

function StateCategoryAiSummaryCard({
  stateName,
  categoryName,
  stateSummaries = {},
  hotspotState = {},
  userEmail = null
}) {
  const [aiData, setAiData] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const stData = stateSummaries[stateName] || {};
  const totalDemand = stData.total !== undefined ? stData.total : (hotspotState.baseDemand || 0);

  // Category breakdown strictly derived from backend stateSummaries
  const catBreakdown = CENTRAL_CATEGORIES.map((cat) => {
    const catName = cat.name;
    const nk = catName.toLowerCase().replace('&', 'and').trim();
    let count = 0;
    if (stData.byCategory) {
      Object.entries(stData.byCategory).forEach(([k, v]) => {
        const itemK = k.toLowerCase().replace('&', 'and').trim();
        if (itemK === nk || itemK.includes(nk) || nk.includes(itemK)) {
          count += v;
        }
      });
    }
    return { name: cat.altName || cat.name, count };
  }).filter((c) => c.count > 0).slice(0, 5);

  useEffect(() => {
    let isMounted = true;
    const loadAi = async () => {
      if (!stateName) return;
      setIsLoadingAi(true);
      try {
        const data = await fetchAiSummary(
          {
            state: stateName,
            category: categoryName,
            scopeLevel: 'state'
          },
          userEmail
        );
        if (isMounted) {
          setAiData(data);
        }
      } catch (err) {
        console.warn('State category AI fetch notice:', err.message);
        if (isMounted) {
          setAiData({ error: 'AI summary temporarily unavailable. Please try again.', summary: null });
        }
      } finally {
        if (isMounted) setIsLoadingAi(false);
      }
    };

    loadAi();
    return () => { isMounted = false; };
  }, [stateName, categoryName, userEmail]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="mt-2 pt-3 border-t border-blue-200/90 space-y-2.5 animate-fadeIn text-slate-800 w-full"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-blue-100">
        <span className="font-black text-xs text-[#002B49] flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
          <span>State Summary &bull; {stateName}</span>
        </span>
        <span className="text-[10px] font-extrabold text-blue-900 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
          Total Demand: {totalDemand}
        </span>
      </div>

      {/* Category-Wise Demand Grid */}
      {catBreakdown.length > 0 && (
        <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100 space-y-1.5">
          <p className="font-black text-[10px] text-slate-500 uppercase tracking-wider">
            Category-Wise Demand
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            {catBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-slate-700">
                <span className="truncate font-medium">{item.name}:</span>
                <span className="font-bold text-[#002B49] ml-1">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Gemini AI Qualitative Summary */}
      <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="font-extrabold text-slate-900 flex items-center space-x-1 text-[11px]">
            <MessageSquare className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>AI Demand Analysis ({categoryName || 'General'}):</span>
          </p>
          {aiData?.overallUrgency && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {aiData.overallUrgency}
            </span>
          )}
        </div>

        {isLoadingAi ? (
          <div className="flex items-center space-x-1.5 py-1 text-xs text-slate-500 font-medium">
            <Sparkles className="w-3 h-3 animate-spin text-[#FF9933]" />
            <span>Synthesizing Gemini AI summary for {stateName}...</span>
          </div>
        ) : aiData?.summary ? (
          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
              {aiData.summary}
            </p>
            {aiData.mainIssues && aiData.mainIssues.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {aiData.mainIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 flex items-center space-x-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-600"></span>
                    <span>{issue}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : aiData?.error ? (
          <p className="text-[10.5px] text-slate-400 italic">
            {aiData.error}
          </p>
        ) : (
          <p className="text-[10.5px] text-slate-400 italic">
            {totalDemand === 0 ? 'No citizen requests found for this selection.' : 'AI summary temporarily unavailable. Please try again.'}
          </p>
        )}
      </div>
    </div>
  );
}

const getCategoryStatePriorityList = (categoryName, hotspotsList, stateSummaries) => {
  const normCat = (categoryName || '').toLowerCase().replace('&', 'and');

  const states = hotspotsList.map((st) => {
    const summary = stateSummaries[st.name];
    let catDemands = 0;

    if (summary && summary.byCategory) {
      Object.entries(summary.byCategory).forEach(([catKey, count]) => {
        const normKey = catKey.toLowerCase().replace('&', 'and');
        if (normKey === normCat || normKey.includes(normCat) || normCat.includes(normKey)) {
          catDemands += count;
        }
      });
    }

    const stateTotal = summary?.total || 0;
    let priorityScore = stateTotal > 0 ? Math.min(98, Math.max(60, 60 + stateTotal * 4)) : (st.priorityScore || 70);
    if (catDemands > 0) {
      priorityScore = Math.min(99, priorityScore + Math.min(20, catDemands * 5));
    }

    return {
      ...st,
      categoryDemands: catDemands,
      priorityScore
    };
  });

  // SORT ALL STATES IN DESCENDING ORDER BY PRIORITY SCORE (Highest Priority Score First)
  return states.sort((a, b) => b.priorityScore - a.priorityScore);
};

export default function GovCentralDashboard({ govUser, onLogout, onSwitchToStateView }) {
  // Navigation Drilldown State
  const [viewLevel, setViewLevel] = useState('india'); // 'india', 'central-category', 'state', 'district', 'category'
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [focusedState, setFocusedState] = useState(null);

  // Data State
  const [stateSummaries, setStateSummaries] = useState({});
  const [activeStateSummary, setActiveStateSummary] = useState(null);
  const [activeStateRequests, setActiveStateRequests] = useState([]);
  const [nationalTotalRequests, setNationalTotalRequests] = useState(0);
  const [nationalCategories, setNationalCategories] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Load National Data across States
  const loadNationalData = async () => {
    setIsLoading(true);
    try {
      const summaryPromises = SUPPORTED_STATES.map((st) =>
        fetchGovDashboardSummary(st, null, govUser?.email).then((data) => ({ state: st, data }))
      );
      const results = await Promise.all(summaryPromises);

      const summariesMap = {};
      let total = 0;
      const combinedCategories = {};

      results.forEach(({ state, data }) => {
        if (data) {
          summariesMap[state] = data;
          total += data.total || 0;

          if (data.byCategory) {
            Object.entries(data.byCategory).forEach(([cat, count]) => {
              combinedCategories[cat] = (combinedCategories[cat] || 0) + count;
            });
          }
        }
      });

      setStateSummaries(summariesMap);
      setNationalTotalRequests(total);
      setNationalCategories(combinedCategories);
    } catch (err) {
      console.error('Error loading national data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Selected State Requests
  const loadStateData = async (stateName) => {
    try {
      const [sumData, reqData] = await Promise.all([
        fetchGovDashboardSummary(stateName, null, govUser?.email),
        fetchRequests({ state: stateName, limit: 150 }, govUser?.email)
      ]);
      setActiveStateSummary(sumData);
      setActiveStateRequests(reqData.data || []);
    } catch (err) {
      console.error(`Error loading state data for ${stateName}:`, err);
    }
  };

  useEffect(() => {
    loadNationalData();
  }, []);

  useEffect(() => {
    if (selectedState) {
      loadStateData(selectedState);
    }
  }, [selectedState]);

  // Click Handlers for Drilldowns
  const handleStateClick = (stateName) => {
    setSelectedState(stateName);
    setSelectedDistrict(null);
    setSelectedCategory(null);
    setFocusedState(null);
    setViewLevel('state');
  };

  const handleDistrictClick = (districtName) => {
    setSelectedDistrict(districtName);
    setViewLevel('district');
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setFocusedState(null);
    if (viewLevel === 'india' || viewLevel === 'central-category') {
      setViewLevel('central-category');
    } else {
      setViewLevel('category');
    }
  };

  const handleBackToIndia = () => {
    setViewLevel('india');
    setSelectedDistrict(null);
    setSelectedCategory(null);
    setFocusedState(null);
  };

  const handleBackToState = () => {
    setViewLevel('state');
    setSelectedDistrict(null);
    setSelectedCategory(null);
    setFocusedState(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9]/70 backdrop-blur-[1px] flex flex-col font-sans">
      {/* Official Central Government Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Central Emblem */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img
              src="/gov-emblem.png"
              alt="Government of India"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain flex-shrink-0"
            />
            <div className="w-10 h-10 rounded-xl bg-[#002B49] text-white flex items-center justify-center shadow-inner flex-shrink-0">
              <Globe2 className="w-5 h-5 text-[#FF9933]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">🇮🇳</span>
                <h1 className="text-base font-black text-[#002B49] tracking-tight">
                  Central Government &bull; India Development Intelligence
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#FF9933]/15 text-[#9A3412] border border-[#FF9933]/30">
                  National Directorate
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive state & district infrastructure priority analytics across India
              </p>
            </div>
          </div>

          {/* User Profile, Actions & Digital India Logo */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <div className="text-left leading-tight">
                <p className="text-[11px] font-bold text-slate-800">{govUser?.name || 'National Admin'}</p>
                <p className="text-[9px] text-slate-400 font-medium">Central Oversight</p>
              </div>
            </div>

            <button
              onClick={loadNationalData}
              title="Refresh National Intelligence"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Right side: Digital India Logo */}
            <img
              src="/digital-india.png"
              alt="Digital India"
              className="h-7 sm:h-8 md:h-9 w-auto object-contain flex-shrink-0 hidden sm:block pl-1"
            />
          </div>
        </div>

        {/* Dynamic Breadcrumbs Navigation Bar */}
        <div className="bg-slate-50 border-t border-slate-200/80 px-2 sm:px-3 lg:px-4 py-2">
          <div className="max-w-[1680px] w-full mx-auto flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 gap-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBackToIndia}
                className={`flex items-center space-x-1 transition-colors cursor-pointer ${
                  viewLevel === 'india'
                    ? 'text-[#002B49] font-black'
                    : 'text-slate-500 hover:text-[#002B49]'
                }`}
              >
                <span>🇮🇳 India Development Intelligence</span>
              </button>

              {viewLevel !== 'india' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button
                    onClick={handleBackToState}
                    className={`flex items-center space-x-1 transition-colors cursor-pointer ${
                      viewLevel === 'state'
                        ? 'text-[#002B49] font-black'
                        : 'text-slate-500 hover:text-[#002B49]'
                    }`}
                  >
                    <span>🏛️ {selectedState}</span>
                  </button>
                </>
              )}

              {viewLevel === 'district' && selectedDistrict && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[#002B49] font-black">📍 {selectedDistrict} District</span>
                </>
              )}

              {viewLevel === 'category' && selectedCategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[#002B49] font-black">📊 {selectedCategory} Demand</span>
                </>
              )}
            </div>

            {/* Quick State Switcher Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold mr-1">
                Monitor State:
              </span>
              {SUPPORTED_STATES.map((st) => (
                <button
                  key={st}
                  onClick={() => handleStateClick(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    selectedState === st && viewLevel !== 'india'
                      ? 'bg-[#002B49] text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto px-2 sm:px-3 lg:px-4 py-6">
        {/* ==================================================================== */}
        {/* LEVEL 1: INDIA NATIONAL OVERVIEW VIEW */}
        {/* ==================================================================== */}
        {viewLevel === 'india' && (
          <div className="space-y-6 animate-fadeIn">
            {/* National KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total National Demands</p>
                <h3 className="text-3xl font-black text-[#002B49] mt-1">
                  {nationalTotalRequests || 75}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Aggregated citizen requests across India
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identified State Hotspots</p>
                <h3 className="text-3xl font-black text-amber-700 mt-1 flex items-center space-x-1.5">
                  <span>{NATIONAL_STATE_HOTSPOTS.length}</span>
                  <Flame className="w-6 h-6 text-[#FF9933]" />
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  States with concentrated infrastructure demand
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top National Issue</p>
                <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-1 truncate">
                  Healthcare (38%)
                </h3>
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  Primary health centers & rural medical access
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analytical Model</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 flex items-center space-x-1">
                  <span>Evidence-Based</span>
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </h3>
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                  Calculated from verified ground requests
                </p>
              </div>
            </div>

            {/* India National Layout: Map (Left 6 Cols) + Development Sector Categories (Right 6 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive India Map */}
              <div className="lg:col-span-6">
                <GovIndiaNationalMap
                  stateSummaries={stateSummaries}
                  onSelectState={handleStateClick}
                />
              </div>

              {/* Right Column: Development Sector Categories */}
              <div className="lg:col-span-6 space-y-5">
                {/* 9 Development Category Cards Section */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-200">
                        <Layers className="w-4.5 h-4.5 text-[#FF9933]" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-[#002B49] tracking-tight">
                          Development Sector Categories
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                          National sector priority & demand distribution
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-[#002B49] bg-slate-100 px-2.5 py-1 rounded-full uppercase border border-slate-200">
                      9 Categories
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {CENTRAL_CATEGORIES.map((cat) => {
                      const count = (nationalCategories[cat.name] || 0) + (cat.altName ? (nationalCategories[cat.altName] || 0) : 0);
                      const pct = nationalTotalRequests > 0 ? Math.round((count / nationalTotalRequests) * 100) : 0;
                      const IconComponent = cat.icon;
                      return (
                        <div
                          key={cat.name}
                          onClick={() => handleCategoryClick(cat.altName || cat.name)}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50/80 hover:border-[#002B49] transition-all cursor-pointer group flex flex-col justify-between space-y-2.5 min-h-[102px]"
                        >
                          <div className="flex items-center justify-between">
                            <div className={`p-1.5 rounded-xl border ${cat.color}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-[#002B49] bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs block">
                                {pct}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-blue-950 transition-colors truncate">
                              {cat.name}
                            </h4>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium leading-tight mt-1">
                              <span>{count} demands</span>
                              <span className="font-bold text-[#002B49]">All India share</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LEVEL 1B: CENTRAL CATEGORY STATE PRIORITY VIEW */}
        {/* ==================================================================== */}
        {viewLevel === 'central-category' && selectedCategory && (
          <div className="space-y-6 animate-fadeIn">
            {/* Category Priority Header Banner */}
            <div className="bg-[#002B49] text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF9933] text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                    Central Sector Priorities
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-semibold">
                    All States &bull; Sorted by Priority Score (Highest First)
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
                  <span>{selectedCategory} — State Development Priorities</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Comprehensive national ranking of all Indian states by priority score for {selectedCategory.toLowerCase()} infrastructure needs. Click any state to zoom map.
                </p>
              </div>

              <button
                onClick={handleBackToIndia}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#FF9933]" />
                <span>Back to National Dashboard</span>
              </button>
            </div>

            {/* Split Screen Layout: LEFT SIDE = MAP, RIGHT SIDE = STATE DEVELOPMENT PRIORITIES LIST */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT SIDE: MAP (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="w-full min-h-[520px]">
                  {focusedState ? (
                    <GovStateDistrictMap
                      activeState={focusedState}
                      districtSummary={stateSummaries[focusedState]?.byDistrict || {}}
                      selectedDistrict={selectedDistrict}
                      onSelectDistrict={handleDistrictClick}
                      selectedCategory={selectedCategory}
                    />
                  ) : (
                    <GovIndiaNationalMap
                      stateSummaries={stateSummaries}
                      onSelectState={(stName) => setFocusedState(stName)}
                      selectedCategory={selectedCategory}
                      focusedState={focusedState}
                    />
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: STATE DEVELOPMENT PRIORITIES LIST (5 Cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl space-y-4">
                <div className="pb-3 border-b border-slate-100 flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-rose-600" />
                    <h3 className="font-black text-base text-[#002B49] tracking-tight">
                      State Development Priorities
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedCategory} sector priorities &bull; Click a state to zoom map & inspect districts
                  </p>
                </div>

                {/* State Cards List */}
                <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                  {getCategoryStatePriorityList(selectedCategory, NATIONAL_STATE_HOTSPOTS, stateSummaries).map((st, idx) => {
                    const isFocused = focusedState && focusedState.toLowerCase() === st.name.toLowerCase();
                    return (
                      <div
                        key={st.code || st.name}
                        onClick={() => setFocusedState(st.name)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col space-y-3 ${
                          isFocused
                            ? 'bg-blue-50/90 border-[#002B49] shadow-md ring-2 ring-[#002B49]/20'
                            : 'bg-slate-50/70 hover:bg-blue-50/50 border-slate-200 hover:border-[#002B49]/50 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between space-x-3 w-full">
                          <div className="flex items-start space-x-3 min-w-0">
                            <div className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 ${
                              idx === 0 ? 'bg-rose-600 text-white shadow-sm' :
                              idx === 1 ? 'bg-amber-500 text-white' :
                              idx === 2 ? 'bg-amber-700 text-white' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              #{idx + 1}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-950 transition-colors truncate">
                                  {st.name}
                                </h4>
                                {idx === 0 && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex-shrink-0">
                                    Top Priority
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-600 font-medium line-clamp-1">
                                {st.infraGap || `${selectedCategory} gap`}
                              </p>

                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-semibold pt-0.5">
                                <span className="truncate">📍 {st.capital}</span>
                                <span>&bull;</span>
                                <span className="text-[#002B49] font-bold flex-shrink-0">{st.categoryDemands} Demands</span>
                              </div>

                              {/* CTA to view full state intelligence */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStateClick(st.name);
                                }}
                                className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 pt-1 cursor-pointer"
                              >
                                <span>View {st.name} Intelligence</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Priority Score Badge */}
                          <div className="text-right flex-shrink-0">
                            <div className={`px-2.5 py-1 rounded-xl border font-black text-xs transition-all ${
                              isFocused
                                ? 'bg-[#002B49] text-white border-[#002B49]'
                                : 'bg-amber-100 text-amber-950 border-amber-300 group-hover:bg-[#002B49] group-hover:text-white group-hover:border-[#002B49]'
                            }`}>
                              <span className="block text-[8px] uppercase tracking-wider font-bold opacity-80">Score</span>
                              <span className="text-sm font-black">{st.priorityScore}</span>
                            </div>
                          </div>
                        </div>

                        {/* State Summary Expanded Popup Card (Appears directly below selected state) */}
                        {isFocused && (
                          <StateCategoryAiSummaryCard
                            stateName={st.name}
                            categoryName={selectedCategory}
                            stateSummaries={stateSummaries}
                            hotspotState={st}
                            userEmail={govUser?.email}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LEVEL 2: STATE INTELLIGENCE DEMAND CARD OVERLAY */}
        {/* ==================================================================== */}
        {viewLevel === 'state' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <GovCategoryIntelligenceView
                activeState={selectedState}
                selectedCategory={selectedCategory || 'Healthcare'}
                requests={activeStateRequests}
                onBack={() => setViewLevel(selectedCategory ? 'central-category' : 'india')}
                onSelectDistrict={handleDistrictClick}
              />
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LEVEL 3A: DISTRICT INTELLIGENCE VIEW */}
        {/* ==================================================================== */}
        {viewLevel === 'district' && selectedDistrict && (
          <GovDistrictIntelligenceView
            activeState={selectedState}
            selectedDistrict={selectedDistrict}
            requests={activeStateRequests}
            onBack={handleBackToState}
            onSelectCategory={handleCategoryClick}
            onSelectRequest={(req) => setSelectedRequest(req)}
          />
        )}

        {/* ==================================================================== */}
        {/* LEVEL 3B: CATEGORY INTELLIGENCE VIEW */}
        {/* ==================================================================== */}
        {viewLevel === 'category' && selectedCategory && (
          <GovCategoryIntelligenceView
            activeState={selectedState}
            selectedCategory={selectedCategory}
            requests={activeStateRequests}
            onBack={handleBackToState}
            onSelectDistrict={handleDistrictClick}
            onSelectRequest={(req) => setSelectedRequest(req)}
          />
        )}
      </main>

      {/* Existing Request Inspection Modal */}
      {selectedRequest && (
        <GovRequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
