import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  MapPin,
  ShieldCheck,
  LogOut,
  Building2,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Globe2,
  Lock,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
  MessageSquare,
  Activity,
  Calendar,
  X,
  Check,
  Ban,
  CheckCheck,
  AlertTriangle,
  FileText,
  Camera,
  Image as ImageIcon,
  Maximize2,
  Eye,
  CameraOff,
  ShieldAlert
} from 'lucide-react';
import { fetchRegionalIntelligence, updateWardRequestsBatchStatus, fetchAiSummary } from '../../services/api';
import GovWardMap from '../../components/ward-government/GovWardMap';
import GovWardCategoryModal from '../../components/ward-government/GovWardCategoryModal';
import EvidenceMapModal from '../../components/shared-government/EvidenceMapModal';
import WardConfirmationModal from '../../components/ward-government/WardConfirmationModal';
import WardSelectionModal from '../../components/ward-government/WardSelectionModal';
import WardPhotoViewerModal from '../../components/ward-government/WardPhotoViewerModal';

const ALL_CATEGORY_FILTERS = [
  'All',
  'Healthcare',
  'Roads & Transport',
  'Water & Sanitation',
  'Education',
  'Electricity',
  'Digital Connectivity',
  'Agriculture',
  'Other'
];

export default function GovWardDashboard({ govUser, onLogout }) {
  const [intelData, setIntelData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeCategoryModal, setActiveCategoryModal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Request Detail & Photo Viewer Modals
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null); // request object
  const [selectedPhotoViewer, setSelectedPhotoViewer] = useState(null); // { url, title, requestCode }
  const [evidenceMapModal, setEvidenceMapModal] = useState(null); // { latitude, longitude, accuracy, title, requestCode, capturedAt }

  // Request Status Tabs & Action Dialog States
  const [govRequestType, setGovRequestType] = useState('all'); // 'all' | 'demand' | 'complaint'
  const [pendingFilter, setPendingFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'REMINDED'
  const [requestStatusTab, setRequestStatusTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'completed'
  const [selectionModal, setSelectionModal] = useState(null); // { mode: 'approve' | 'reject', category: string }
  const [selectedRequestIds, setSelectedRequestIds] = useState([]); // array of selected request IDs
  const [confirmationModal, setConfirmationModal] = useState(null); // { mode: 'approve' | 'reject' | 'complete', category: string, count: number, requestIds?: any[] }
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [aiSummaryData, setAiSummaryData] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sourced from authenticated profile
  const regionId = govUser?.regionId || govUser?.region_id;
  const userEmail = govUser?.email;
  const wardName = govUser?.monitoringWard || govUser?.monitoring_ward;
  const districtName = govUser?.monitoringDistrict || govUser?.monitoring_district || '';
  const stateName = govUser?.monitoringState || govUser?.monitoring_state || '';

  // Sourced from actual database requests
  const demandData = intelData?.demand || {};
  const rawRequests = demandData.requests || [];
  const totalRequestsCount = demandData.total ? Math.max(demandData.total, rawRequests.length) : rawRequests.length;
  const byCategory = demandData.byCategory || {};

  const loadWardIntelligence = useCallback(async (showLoadingSpinner = true) => {
    if (!regionId) {
      setError('Ward information could not be loaded. Please contact the administrator.');
      setIsLoading(false);
      return;
    }
    if (showLoadingSpinner) setIsLoading(true);
    setError('');
    try {
      // Fetch Regional Intelligence for the user's assigned ward
      const intel = await fetchRegionalIntelligence(regionId, userEmail);
      if (!intel || !intel.region) {
        throw new Error('Ward information could not be loaded. Please contact the administrator.');
      }
      setIntelData(intel);

      const reg = intel?.region || {};
      const regLat = parseFloat(reg.latitude) || 20.5937;
      const regLng = parseFloat(reg.longitude) || 78.9629;

      // Extract localized micro-hotspots dynamically from backend requests
      const reqs = intel?.demand?.requests || [];
      
      const clusterMap = new Map();
      reqs.forEach((r, idx) => {
        const localityKey = r.problem_address || r.location_details || r.locality || r.village || r.category || `Sector ${idx + 1}`;
        if (!clusterMap.has(localityKey)) {
          clusterMap.set(localityKey, []);
        }
        clusterMap.get(localityKey).push(r);
      });

      const localizedHotspots = Array.from(clusterMap.entries()).map(([locKey, items], idx) => {
        const firstWithCoords = items.find(it => it.problem_latitude && it.problem_longitude) ||
                                items.find(it => it.latitude && it.longitude) || {};
        const lat = parseFloat(firstWithCoords.problem_latitude || firstWithCoords.latitude) ||
                    (regLat + (idx === 0 ? 0 : (idx % 2 === 0 ? 0.0015 * idx : -0.0015 * idx)));
        const lng = parseFloat(firstWithCoords.problem_longitude || firstWithCoords.longitude) ||
                    (regLng + (idx === 0 ? 0 : (idx % 2 === 0 ? 0.002 * idx : -0.002 * idx)));

        // Category breakdown for cluster
        const catMap = {};
        items.forEach(it => {
          catMap[it.category] = (catMap[it.category] || 0) + 1;
        });
        const catBreakdown = Object.entries(catMap).map(([cName, cCount]) => ({
          category: cName,
          count: cCount,
          share: Math.round((cCount / items.length) * 100)
        })).sort((a, b) => b.count - a.count);

        // Status distribution
        const pCount = items.filter(it => !it.status || it.status === 'Pending' || it.status === 'In Progress').length;
        const rCount = items.filter(it => it.status === 'Approved' || it.status === 'Resolved' || it.status === 'Completed').length;
        const rejCount = items.filter(it => it.status === 'Rejected').length;

        // Urgency score
        const hasCritical = items.some(it => it.urgency === 'Critical');
        const hasHigh = items.some(it => it.urgency === 'High');
        const priorityScore = hasCritical ? 92 : hasHigh ? 84 : 70;
        const urgencyLevel = hasCritical ? 'Critical' : hasHigh ? 'High' : 'Medium';

        const topIssue = items.find(it => it.problem_description || it.description || it.subcategory)?.problem_description ||
                         items[0]?.description || items[0]?.title || `Civic demand in ${items[0]?.category || 'Ward'}`;

        return {
          id: `hs-${idx + 1}`,
          name: `${locKey}`,
          locality: locKey,
          category: catBreakdown[0]?.category || items[0]?.category || 'General',
          latitude: lat,
          longitude: lng,
          totalRequests: items.length,
          requestCount: items.length,
          priorityScore,
          urgencyLevel,
          mainIssue: topIssue,
          categoryBreakdown: catBreakdown,
          statusDistribution: {
            pending: items.length > 0 ? Math.round((pCount / items.length) * 100) : 0,
            inProgress: items.length > 0 ? Math.round((rCount / items.length) * 100) : 0,
            resolved: items.length > 0 ? Math.round((rejCount / items.length) * 100) : 0
          }
        };
      });

      setHotspots(localizedHotspots);
    } catch (err) {
      console.error('Failed to load ward intelligence:', err);
      setError(err.message || 'Ward information could not be loaded. Please contact the administrator.');
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  }, [regionId, userEmail]);

  useEffect(() => {
    loadWardIntelligence(true);
  }, [loadWardIntelligence]);

  // Load Real Dynamic Gemini AI Summary
  useEffect(() => {
    let isMounted = true;
    const loadAiSummary = async () => {
      if (!regionId) return;
      setIsAiLoading(true);
      try {
        const data = await fetchAiSummary(
          {
            regionId,
            category: selectedCategory !== 'All' ? selectedCategory : null,
            requestType: govRequestType !== 'all' ? govRequestType : null,
            scopeLevel: 'ward'
          },
          userEmail
        );
        if (isMounted) {
          setAiSummaryData(data);
        }
      } catch (err) {
        console.warn('AI summary fetch notice:', err.message);
        if (isMounted) {
          setAiSummaryData({ error: 'AI summary temporarily unavailable. Please try again.', summary: null });
        }
      } finally {
        if (isMounted) setIsAiLoading(false);
      }
    };

    loadAiSummary();
    return () => { isMounted = false; };
  }, [regionId, selectedCategory, govRequestType, userEmail, rawRequests.length]);

  // Open Selection Modal for Approve / Reject
  const handleOpenSelectionModal = (mode, category) => {
    setActionError('');
    setSelectedRequestIds([]);
    setSelectionModal({
      mode,
      category: category !== 'All' ? category : 'Healthcare'
    });
  };

  // Execute Confirmed Batch / Selective Status Action
  const handleExecuteConfirmedAction = async () => {
    if (!confirmationModal) return;
    const { mode, category, requestIds } = confirmationModal;

    if (mode === 'reject' && !rejectionReasonInput.trim()) {
      setActionError('Please provide a reason for rejection.');
      return;
    }

    setIsSubmittingAction(true);
    setActionError('');
    try {
      const res = await updateWardRequestsBatchStatus(
        regionId,
        {
          category: category !== 'All' ? category : null,
          action: mode,
          rejectionReason: mode === 'reject' ? rejectionReasonInput.trim() : null,
          requestIds: requestIds && requestIds.length > 0 ? requestIds : null
        },
        userEmail
      );

      setActionSuccessMsg(
        res.message || `Successfully processed ${mode} action on ${requestIds?.length || 0} request(s).`
      );
      setTimeout(() => setActionSuccessMsg(''), 5000);

      setConfirmationModal(null);
      setSelectionModal(null);
      setSelectedRequestIds([]);
      setRejectionReasonInput('');
      // Reload intelligence data from backend
      await loadWardIntelligence(false);
    } catch (err) {
      console.error('Action error:', err);
      setActionError(err.message || 'Failed to complete action.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Status classification helpers
  const isPendingStatus = (status) => !status || !['Approved', 'Rejected', 'Completed'].includes(status);
  const isApprovedStatus = (status) => status === 'Approved';
  const isRejectedStatus = (status) => status === 'Rejected';
  const isCompletedStatus = (status) => status === 'Completed';

  // Apply Global [ DEMAND | COMPLAINT ] Filter
  const filteredByTypeRequests = rawRequests.filter(r => {
    if (govRequestType === 'demand') return (r.request_type || 'demand').toLowerCase() === 'demand';
    if (govRequestType === 'complaint') return (r.request_type || '').toLowerCase() === 'complaint';
    return true;
  });

  const pendingRequestsAll = filteredByTypeRequests.filter(r => isPendingStatus(r.status));
  const approvedRequestsAll = filteredByTypeRequests.filter(r => isApprovedStatus(r.status));
  const rejectedRequestsAll = filteredByTypeRequests.filter(r => isRejectedStatus(r.status));
  const completedRequestsAll = filteredByTypeRequests.filter(r => isCompletedStatus(r.status));
  const highPriorityRequestsAll = filteredByTypeRequests.filter(r => r.urgency === 'High' || r.urgency === 'Critical');

  // Pending sub-filter counts
  const pendingHighCount = pendingRequestsAll.filter(r => r.urgency === 'High' || r.urgency === 'Critical' || r.priority === 'High').length;
  const pendingMediumCount = pendingRequestsAll.filter(r => r.urgency === 'Medium' || r.priority === 'Medium').length;
  const pendingLowCount = pendingRequestsAll.filter(r => r.urgency === 'Low' || r.priority === 'Low').length;
  const pendingRemindedCount = pendingRequestsAll.filter(r => (r.reminder_count && r.reminder_count > 0) || Boolean(r.last_reminded_at) || r.is_reminded).length;

  // Category pending requests for the selected category
  const pendingCategoryRequests = selectedCategory !== 'All'
    ? filteredByTypeRequests.filter(r => r.category === selectedCategory && isPendingStatus(r.status))
    : pendingRequestsAll;

  // Build sorted category distribution
  const allCategories = [
    { name: 'Healthcare', count: byCategory['Healthcare'] || 0 },
    { name: 'Roads & Transport', count: byCategory['Roads & Transport'] || 0 },
    { name: 'Water & Sanitation', count: byCategory['Water & Sanitation'] || 0 },
    { name: 'Education', count: byCategory['Education'] || 0 },
    { name: 'Electricity', count: byCategory['Electricity'] || 0 },
    { name: 'Digital Connectivity', count: byCategory['Digital Connectivity'] || 0 },
    { name: 'Agriculture', count: byCategory['Agriculture'] || 0 },
    { name: 'Other', count: byCategory['Other'] || 0 }
  ];

  const sumCounts = allCategories.reduce((acc, c) => acc + c.count, 0);
  const categoryStats = allCategories.map(c => ({
    ...c,
    share: sumCounts > 0 ? Math.round((c.count / sumCounts) * 100) : 0
  })).sort((a, b) => b.share - a.share);

  // Filter citizen statements based on active category & selected hotspot
  let filteredStatements = filteredByTypeRequests;
  if (selectedCategory !== 'All') {
    filteredStatements = filteredStatements.filter(r => r.category === selectedCategory);
  }
  if (selectedHotspot) {
    const spotLocality = (selectedHotspot.locality || selectedHotspot.name || '').toLowerCase();
    const subFiltered = filteredStatements.filter(r => {
      const loc = (r.location_details || r.village || '').toLowerCase();
      return loc.includes(spotLocality) || spotLocality.includes(loc) || r.category === selectedHotspot.category;
    });
    if (subFiltered.length > 0) {
      filteredStatements = subFiltered;
    }
  }

  // Active list for the Request Status section
  let currentStatusList = [];
  if (requestStatusTab === 'pending') {
    let pendingList = filteredByTypeRequests.filter(r => isPendingStatus(r.status));
    if (pendingFilter === 'HIGH') {
      pendingList = pendingList.filter(r => r.urgency === 'High' || r.urgency === 'Critical' || r.priority === 'High');
    } else if (pendingFilter === 'MEDIUM') {
      pendingList = pendingList.filter(r => r.urgency === 'Medium' || r.priority === 'Medium');
    } else if (pendingFilter === 'LOW') {
      pendingList = pendingList.filter(r => r.urgency === 'Low' || r.priority === 'Low');
    } else if (pendingFilter === 'REMINDED') {
      pendingList = pendingList.filter(r => (r.reminder_count && r.reminder_count > 0) || Boolean(r.last_reminded_at) || r.is_reminded);
    }
    currentStatusList = pendingList;
  } else if (requestStatusTab === 'approved') {
    currentStatusList = filteredByTypeRequests.filter(r => isApprovedStatus(r.status));
  } else if (requestStatusTab === 'rejected') {
    currentStatusList = filteredByTypeRequests.filter(r => isRejectedStatus(r.status));
  } else if (requestStatusTab === 'completed') {
    currentStatusList = filteredByTypeRequests.filter(r => isCompletedStatus(r.status));
  }

  if (selectedCategory !== 'All') {
    currentStatusList = currentStatusList.filter(r => r.category === selectedCategory);
  }

  // Group current status requests by Category
  const groupedStatusRequests = currentStatusList.reduce((acc, req) => {
    const cat = req.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(req);
    return acc;
  }, {});

  // Smooth scroll handler to All Development Sectors section
  const scrollToDevelopmentSectors = (category = null) => {
    if (category && category !== 'All') {
      setSelectedCategory(category);
    }
    const element = document.getElementById('all-development-sectors');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Safe Guard: Check authorization & assigned ward
  if (!govUser || (!regionId && !wardName)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Ward Information Unavailable</h2>
          <p className="text-sm text-slate-600 font-medium">
            Ward information could not be loaded. Please contact the administrator.
          </p>
          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-4 px-6 py-2.5 bg-[#002B49] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  if (govUser.role !== 'ward_monitor' && govUser.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Unauthorized Access</h2>
          <p className="text-sm text-slate-600 font-medium">
            Your account is not authorized to access the Ward Government Portal.
          </p>
          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-4 px-6 py-2.5 bg-[#002B49] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1680px] w-full mx-auto px-2 sm:px-3 lg:px-4 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-[#002B49] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-950 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="flex items-center space-x-4 relative z-10">
          <img
            src="/gov-emblem.png"
            alt="Government of India"
            className="h-12 sm:h-14 md:h-16 w-auto object-contain flex-shrink-0 bg-white/10 p-1.5 rounded-xl backdrop-blur-xs"
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5">
                <Home className="w-3.5 h-3.5 text-amber-300" />
                <span>Ward Intelligence Dashboard</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Assigned Ward Locked</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              {wardName}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>{districtName}, {stateName} &bull; {intelData?.region?.local_government_body || 'Local Municipal Corporation'}</span>
            </p>
          </div>
        </div>

        {/* User Info & Logout & Digital India Logo */}
        <div className="flex items-center space-x-3 sm:space-x-4 relative z-10 self-start md:self-auto">
          <img
            src="/digital-india.png"
            alt="Digital India"
            className="h-7 sm:h-8 md:h-9 w-auto object-contain flex-shrink-0 bg-white/10 p-1 rounded-xl backdrop-blur-xs hidden sm:block"
          />
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-200 block">{govUser?.name || 'Ward Officer'}</span>
            <span className="text-[11px] text-emerald-300 block">{govUser?.email}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-2 transition-all border border-white/20 shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Global Success Feedback Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-950 font-black text-sm cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[400px] flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-[#002B49]">Loading Local Ward Map & Citizen Statements...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 space-y-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-base">Error Loading Ward Dashboard</h3>
          </div>
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <>
          {/* 2. Middle Row: Left Map + Right Ward & Category Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Ward Interactive Map (7 cols) */}
            <div className="lg:col-span-7 flex flex-col min-h-[560px] sm:min-h-[600px] w-full">
              <GovWardMap
                region={intelData?.region}
                office={intelData?.office}
                hotspots={hotspots}
                selectedHotspot={selectedHotspot}
                selectedCategory={selectedCategory}
                onSelectHotspot={(hs) => {
                  setSelectedHotspot(hs);
                  if (hs.category && selectedCategory === 'All') {
                    setSelectedCategory(hs.category);
                  }
                }}
              />
            </div>

            {/* Right: Ward Overview & Category Breakdown (5 cols) */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              {/* Ward Overview KPI Cards */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-sm text-[#002B49] uppercase tracking-wider">
                      Ward Overview
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Click any card to explore development sectors</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Live Civic Data</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      scrollToDevelopmentSectors('All');
                    }}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer text-left shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Issues</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-2xl font-black text-[#002B49] block mt-1">{rawRequests.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToDevelopmentSectors()}
                    className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer text-left shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">High Priority</span>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-2xl font-black text-rose-900 block mt-1">
                      {highPriorityRequestsAll.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRequestStatusTab('pending');
                      scrollToDevelopmentSectors();
                    }}
                    className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer text-left shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Pending</span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-2xl font-black text-amber-950 block mt-1">
                      {pendingRequestsAll.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRequestStatusTab('completed');
                      scrollToDevelopmentSectors();
                    }}
                    className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all cursor-pointer text-left shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Completed</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-2xl font-black text-emerald-950 block mt-1">
                      {completedRequestsAll.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => scrollToDevelopmentSectors()}
                  className="w-full p-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white flex items-center justify-between shadow-sm cursor-pointer transition-all group"
                >
                  <div className="flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Active Demand Hotspots</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base font-black text-amber-300">{hotspots.length}</span>
                    <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Category Overview with Interactive Filtering */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-sm text-[#002B49] uppercase tracking-wider">
                      Category Overview
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Click to filter map & citizen statements</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Interactive
                  </span>
                </div>

                <div className="space-y-2.5">
                  {categoryStats.map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <div
                        key={cat.name}
                        onClick={() => {
                          const nextCat = isSelected ? 'All' : cat.name;
                          setSelectedCategory(nextCat);
                          scrollToDevelopmentSectors(nextCat);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-xs group ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-emerald-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-extrabold ${isSelected ? 'text-emerald-900' : 'text-[#002B49]'}`}>
                            {cat.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md text-[11px] border border-emerald-200 shadow-2xs">
                              {cat.share}%
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isSelected ? 'bg-emerald-700' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${cat.share}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bottom Section: Selected Area / Category & Actual Citizen Statements */}
          <div
            id="all-development-sectors"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-8 scroll-mt-6"
          >
            {/* Filter Bar & Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg sm:text-xl font-black text-[#002B49] tracking-tight">
                    {selectedCategory !== 'All' ? `${selectedCategory}` : 'All Development Sectors'}
                    {selectedHotspot ? ` — ${selectedHotspot.name}` : ` — ${wardName}`}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Aggregated AI demand intelligence, lifecycle status tracking, and verbatim citizen submissions
                </p>
              </div>

              {/* Active Filter Badges & Reset */}
              {(selectedCategory !== 'All' || selectedHotspot) && (
                <div className="flex items-center space-x-2 self-start md:self-auto">
                  {selectedHotspot && (
                    <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-amber-700" />
                      <span>{selectedHotspot.locality || selectedHotspot.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedHotspot(null)}
                        className="ml-1 text-amber-700 hover:text-amber-950 font-black cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'All' && (
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center space-x-1.5">
                      <Layers className="w-3 h-3 text-emerald-700" />
                      <span>{selectedCategory}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('All')}
                        className="ml-1 text-emerald-700 hover:text-emerald-950 font-black cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedHotspot(null);
                    }}
                    className="text-xs text-slate-500 hover:text-[#002B49] font-bold underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>Filter:</span>
              </span>
              {ALL_CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#002B49] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* AI Demand Summary Box with Approve All / Reject Action Buttons */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-100 pb-3">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-emerald-950">
                  <Sparkles className="w-4 h-4 text-[#FF9933]" />
                  <span>AI Demand Summary</span>
                  {aiSummaryData?.overallUrgency && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200">
                      {aiSummaryData.overallUrgency} Priority
                    </span>
                  )}
                </div>
                {selectedCategory !== 'All' && (
                  <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 self-start sm:self-auto">
                    Sector: <strong>{selectedCategory}</strong>
                  </span>
                )}
              </div>

              {isAiLoading ? (
                <div className="flex items-center space-x-2 text-xs text-emerald-800 font-semibold py-2">
                  <Sparkles className="w-4 h-4 text-[#FF9933] animate-spin" />
                  <span>Synthesizing real AI analysis from citizen requests...</span>
                </div>
              ) : aiSummaryData?.error ? (
                <p className="text-xs sm:text-sm text-slate-500 font-medium italic">
                  {aiSummaryData.error}
                </p>
              ) : aiSummaryData?.message ? (
                <p className="text-xs sm:text-sm text-slate-500 font-medium italic">
                  {aiSummaryData.message}
                </p>
              ) : aiSummaryData?.summary ? (
                <div className="space-y-2.5">
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {aiSummaryData.summary}
                  </p>
                  {aiSummaryData.mainIssues && aiSummaryData.mainIssues.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aiSummaryData.mainIssues.map((issue, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-950 text-[11px] font-bold border border-emerald-200/80 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>{issue}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-500 font-medium italic">
                  {rawRequests.length === 0 ? 'No citizen requests found for this selection.' : 'AI summary temporarily unavailable. Please try again.'}
                </p>
              )}

              {/* Action Buttons: Approve & Reject (Opens Request Selection Interface) */}
              <div className="pt-3 border-t border-emerald-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-600 font-medium">
                  {selectedCategory !== 'All' ? (
                    <span>
                      Pending Requests in {selectedCategory}: <strong className="text-emerald-900">{pendingCategoryRequests.length}</strong>
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">
                      💡 Select a specific category above to select individual, multiple, or all requests for approval/rejection.
                    </span>
                  )}
                </div>

                {selectedCategory !== 'All' && (
                  <div className="flex items-center space-x-2.5 self-start sm:self-auto">
                    <button
                      type="button"
                      disabled={pendingCategoryRequests.length === 0 || isSubmittingAction}
                      onClick={() => handleOpenSelectionModal('approve', selectedCategory)}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-black flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      disabled={pendingCategoryRequests.length === 0 || isSubmittingAction}
                      onClick={() => handleOpenSelectionModal('reject', selectedCategory)}
                      className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-black flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Ban className="w-4 h-4 text-rose-200" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Central Demand / Complaint Main Toggle */}
            <div className="flex justify-center items-center py-2 border-t border-slate-100">
              <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center space-x-1.5 shadow-sm border border-slate-300">
                <button
                  type="button"
                  onClick={() => setGovRequestType('all')}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                    govRequestType === 'all'
                      ? 'bg-[#002B49] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>All</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    govRequestType === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {rawRequests.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setGovRequestType('demand')}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                    govRequestType === 'demand'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-blue-900 bg-white/60'
                  }`}
                >
                  <span>🏗️ Demand</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    govRequestType === 'demand' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {rawRequests.filter(r => (r.request_type || 'demand').toLowerCase() === 'demand').length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setGovRequestType('complaint')}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                    govRequestType === 'complaint'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-rose-900 bg-white/60'
                  }`}
                >
                  <span>⚠️ Complaint</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    govRequestType === 'complaint' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {rawRequests.filter(r => (r.request_type || '').toLowerCase() === 'complaint').length}
                  </span>
                </button>
              </div>
            </div>

            {/* NEW SECTION: Request Status Lifecycle Management */}
            <div className="space-y-5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-emerald-700" />
                    <h4 className="text-base font-black text-[#002B49] uppercase tracking-wider">
                      Request Status
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Mutually exclusive workflow stages for citizen development requests
                  </p>
                </div>

                {/* Status Switcher Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl space-x-1 self-start sm:self-auto overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setRequestStatusTab('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      requestStatusTab === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending ({pendingRequestsAll.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestStatusTab('approved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      requestStatusTab === 'approved'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approved ({approvedRequestsAll.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestStatusTab('rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      requestStatusTab === 'rejected'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Rejected ({rejectedRequestsAll.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestStatusTab('completed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      requestStatusTab === 'completed'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Completed ({completedRequestsAll.length})</span>
                  </button>
                </div>
              </div>

              {/* Pending Sub-Filters: [ ALL | HIGH | MEDIUM | LOW | REMIND ] */}
              {requestStatusTab === 'pending' && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none animate-fadeIn">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
                    <Filter className="w-3 h-3" />
                    <span>Filter:</span>
                  </span>
                  {[
                    { id: 'ALL', label: 'All Pending', count: pendingRequestsAll.length, activeCls: 'bg-amber-500 text-white' },
                    { id: 'HIGH', label: 'High', count: pendingHighCount, activeCls: 'bg-rose-600 text-white' },
                    { id: 'MEDIUM', label: 'Medium', count: pendingMediumCount, activeCls: 'bg-amber-600 text-white' },
                    { id: 'LOW', label: 'Low', count: pendingLowCount, activeCls: 'bg-slate-600 text-white' },
                    { id: 'REMINDED', label: '🔔 Remind', count: pendingRemindedCount, activeCls: 'bg-purple-600 text-white' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPendingFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                        pendingFilter === f.id
                          ? `${f.activeCls} shadow-xs font-extrabold`
                          : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        pendingFilter === f.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Request Cards grouped by Category */}
              {Object.keys(groupedStatusRequests).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-1">
                  <p className="font-bold text-slate-700">No requests in {requestStatusTab.toUpperCase()} status</p>
                  <p className="text-slate-400">
                    {selectedCategory !== 'All' ? `for category "${selectedCategory}" in this ward.` : 'for this ward.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedStatusRequests).map(([categoryName, reqList]) => (
                    <div
                      key={categoryName}
                      className="p-5 rounded-3xl bg-slate-50/60 border border-slate-200/90 space-y-4 shadow-2xs"
                    >
                      {/* Category Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          <h5 className="font-black text-sm text-[#002B49]">{categoryName}</h5>
                          <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {reqList.length} {reqList.length === 1 ? 'Request' : 'Requests'}
                          </span>
                        </div>

                        {/* If in Approved tab, show Mark Category Completed button */}
                        {requestStatusTab === 'approved' && (
                          <button
                            type="button"
                            disabled={isSubmittingAction}
                            onClick={() => {
                              setActionError('');
                              setConfirmationModal({
                                mode: 'complete',
                                category: categoryName,
                                count: reqList.length
                              });
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                          >
                            <CheckCheck className="w-4 h-4 text-emerald-200" />
                            <span>Mark Category Completed ({reqList.length})</span>
                          </button>
                        )}
                      </div>

                      {/* Request Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reqList.map((stmt, idx) => (
                          <div
                            key={stmt.id || idx}
                            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-600 transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                          >
                            {/* Header details */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1.5">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    (stmt.request_type || '').toLowerCase() === 'complaint'
                                      ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                                  }`}>
                                    {(stmt.request_type || '').toLowerCase() === 'complaint' ? '⚠️ Complaint' : '🏗️ Demand'}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                                    {stmt.original_language || stmt.language || 'English'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  {(stmt.reminder_count > 0 || stmt.last_reminded_at) && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 flex items-center space-x-1">
                                      <Bell className="w-2.5 h-2.5 text-purple-700" />
                                      <span>Reminded{stmt.reminder_count > 1 ? ` (${stmt.reminder_count}x)` : ''}</span>
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      stmt.urgency === 'High' || stmt.urgency === 'Critical'
                                        ? 'bg-rose-100 text-rose-900'
                                        : 'bg-amber-100 text-amber-900'
                                    }`}
                                  >
                                    {stmt.urgency || 'Medium'} Urgency
                                  </span>
                                </div>
                              </div>

                              {/* Statement Quote */}
                              <blockquote className="text-xs sm:text-sm font-bold text-[#002B49] leading-snug">
                                &ldquo;{stmt.original_text || stmt.issue}&rdquo;
                              </blockquote>

                              {stmt.ai_summary && stmt.ai_summary !== stmt.original_text && (
                                <p className="text-[11px] text-slate-600 font-medium pt-1 border-t border-slate-100">
                                  <span className="font-bold text-slate-700">AI Context: </span>
                                  {stmt.ai_summary}
                                </p>
                              )}

                              {/* Special Status Callouts */}
                              {requestStatusTab === 'rejected' && (
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-0.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                                    Rejection Reason:
                                  </span>
                                  <p className="font-bold text-xs">
                                    {stmt.rejection_reason || 'Rejected during administrative ward review'}
                                  </p>
                                </div>
                              )}

                              {requestStatusTab === 'completed' && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-0.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                                    Completion Record:
                                  </span>
                                  <p className="font-bold text-xs flex items-center space-x-1">
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>
                                      Completed on {stmt.completed_at ? new Date(stmt.completed_at).toLocaleString() : 'Recently'}
                                    </span>
                                  </p>
                                </div>
                              )}

                              {/* Photo Evidence Badge / Thumbnail / Exception Callout */}
                              {stmt.photo_url ? (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPhotoViewer({
                                        url: stmt.photo_url,
                                        title: stmt.issue || stmt.category,
                                        requestCode: stmt.request_code || `REQ-${stmt.id}`
                                      });
                                    }}
                                    className="w-full flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all text-left cursor-pointer group"
                                  >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 bg-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform">
                                      <img
                                        src={stmt.photo_url}
                                        alt="Citizen Attachment Thumbnail"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-900 flex items-center space-x-1">
                                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>📷 Evidence Attached</span>
                                      </span>
                                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-700">
                                        Click to inspect image
                                      </span>
                                    </div>
                                    <Eye className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 flex-shrink-0" />
                                  </button>
                                </div>
                              ) : (stmt.photo_exception || (stmt.request_type || '').toLowerCase() === 'complaint') ? (
                                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                                  <span className="font-bold flex items-center space-x-1">
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                                    <span>⚠️ No Photo — Citizen Exception</span>
                                  </span>
                                  <span className="text-[10px] text-amber-700 font-medium">Verify on site</span>
                                </div>
                              ) : null}
                            </div>

                            {/* Card Footer */}
                            <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700">
                                  📁 {stmt.category} &bull; {stmt.issue}
                                </span>
                                <span
                                  className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                                    requestStatusTab === 'pending'
                                      ? 'bg-amber-100 text-amber-900'
                                      : requestStatusTab === 'approved'
                                      ? 'bg-blue-100 text-blue-900'
                                      : requestStatusTab === 'rejected'
                                      ? 'bg-rose-100 text-rose-900'
                                      : 'bg-emerald-100 text-emerald-900'
                                  }`}
                                >
                                  {stmt.status || 'Pending'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-slate-400">
                                <span>📍 {stmt.location_details || stmt.village || 'Ward Local Area'}</span>
                                <span>📅 {stmt.created_at ? new Date(stmt.created_at).toLocaleDateString() : 'Recent'}</span>
                              </div>

                              <div className="pt-1 border-t border-slate-50 flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-slate-400">
                                  {stmt.request_code || `REQ-${stmt.id}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRequestDetail(stmt)}
                                  className="text-[11px] font-bold text-[#002B49] hover:text-emerald-700 flex items-center space-x-1 cursor-pointer hover:underline"
                                >
                                  <FileText className="w-3 h-3 text-gov-saffron" />
                                  <span>View Details</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actual Citizen Statements Feed */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                  <span>Citizen Statements Feed ({filteredStatements.length})</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Preserved in Original Citizen Language
                </span>
              </div>

              {filteredStatements.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  No direct citizen statements matching the selected category/area filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStatements.map((stmt, idx) => (
                    <div
                      key={stmt.id || idx}
                      className="p-5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-emerald-600 transition-all shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      {/* Statement Text in Original Language */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              (stmt.request_type || '').toLowerCase() === 'complaint'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}>
                              {(stmt.request_type || '').toLowerCase() === 'complaint' ? '⚠️ Complaint' : '🏗️ Demand'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                              {stmt.original_language || stmt.language || 'Original Language'}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              stmt.urgency === 'High' || stmt.urgency === 'Critical'
                                ? 'bg-rose-100 text-rose-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {stmt.urgency || 'High'} Urgency
                          </span>
                        </div>

                        <blockquote className="text-sm sm:text-base font-bold text-[#002B49] leading-snug">
                          &ldquo;{stmt.original_text || stmt.issue}&rdquo;
                        </blockquote>

                        {stmt.ai_summary && stmt.ai_summary !== stmt.original_text && (
                          <p className="text-xs text-slate-600 font-medium pt-1 border-t border-slate-200/60">
                            <span className="font-bold text-slate-700">AI Context: </span>
                            {stmt.ai_summary}
                          </p>
                        )}

                        {stmt.rejection_reason && (
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900 font-medium">
                            <span className="font-bold">Rejection Note: </span>
                            {stmt.rejection_reason}
                          </div>
                        )}

                        {/* Photo Evidence in Feed */}
                        {stmt.photo_url && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhotoViewer({
                                  url: stmt.photo_url,
                                  title: stmt.issue || stmt.category,
                                  requestCode: stmt.request_code || `REQ-${stmt.id}`
                                });
                              }}
                              className="w-full flex items-center space-x-2.5 p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all text-left cursor-pointer group"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                                <img
                                  src={stmt.photo_url}
                                  alt="Citizen Attachment Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-900 flex items-center space-x-1">
                                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Citizen Photo Attached</span>
                                </span>
                                <span className="text-[10px] text-slate-400 group-hover:text-emerald-700">
                                  Click to view full photo
                                </span>
                              </div>
                              <Eye className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 flex-shrink-0" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Statement Metadata Details */}
                      <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">
                            📁 {stmt.category} &bull; {stmt.issue}
                          </span>
                          <span
                            className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                              isApprovedStatus(stmt.status)
                                ? 'bg-blue-100 text-blue-900'
                                : isRejectedStatus(stmt.status)
                                ? 'bg-rose-100 text-rose-900'
                                : isCompletedStatus(stmt.status)
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {stmt.status || 'Pending'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>📍 {stmt.location_details || stmt.village || 'Ward Local Area'}</span>
                          <span>📅 {stmt.created_at ? new Date(stmt.created_at).toLocaleDateString() : 'Recent'}</span>
                        </div>

                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {stmt.request_code || `REQ-${stmt.id}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedRequestDetail(stmt)}
                            className="text-[11px] font-bold text-[#002B49] hover:text-emerald-700 flex items-center space-x-1 cursor-pointer hover:underline"
                          >
                            <FileText className="w-3 h-3 text-gov-saffron" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Verified Local Governance Card */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-800" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#002B49]">
                    Verified Local Governance & Representatives
                  </h4>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>State Election Gazette Verified</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Civic Body</span>
                  <span className="font-black text-[#002B49] block">{intelData?.region?.local_government_body || 'Pune Municipal Corporation'}</span>
                  <span className="text-[10px] text-slate-500 block">{intelData?.region?.government_type || 'Municipal Corporation'}</span>
                </div>

                {intelData?.office && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Responsible Office</span>
                    <span className="font-black text-[#002B49] block">{intelData.office.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{intelData.office.address}</span>
                  </div>
                )}

                {intelData?.representatives && intelData.representatives.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5 sm:col-span-2 lg:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Ward Corporator</span>
                    <span className="font-black text-[#002B49] block">{intelData.representatives[0].name}</span>
                    <span className="text-[10px] text-emerald-700 font-bold block">{intelData.representatives[0].designation} ({intelData.representatives[0].source})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 1. Request Selection Modal (Approve / Reject Selected Flow) */}
      <WardSelectionModal
        selectionModal={selectionModal}
        rawRequests={rawRequests}
        selectedRequestIds={selectedRequestIds}
        setSelectedRequestIds={setSelectedRequestIds}
        isPendingStatus={isPendingStatus}
        onClose={() => setSelectionModal(null)}
        onProceedToConfirm={(mode) => {
          setActionError('');
          if (mode === 'reject') setRejectionReasonInput('');
          setConfirmationModal({
            mode,
            category: selectionModal.category,
            count: selectedRequestIds.length,
            requestIds: selectedRequestIds
          });
        }}
      />

      {/* 2. Confirmation & Rejection Reason Dialog */}
      <WardConfirmationModal
        confirmationModal={confirmationModal}
        wardName={wardName}
        rejectionReasonInput={rejectionReasonInput}
        setRejectionReasonInput={setRejectionReasonInput}
        actionError={actionError}
        isSubmittingAction={isSubmittingAction}
        onClose={() => setConfirmationModal(null)}
        onConfirm={handleExecuteConfirmedAction}
      />

      {/* Category Modal if opened */}
      {activeCategoryModal && (
        <GovWardCategoryModal
          category={activeCategoryModal}
          wardName={wardName}
          regionId={regionId}
          userEmail={userEmail}
          share={categoryStats.find(c => c.name === activeCategoryModal)?.share || 0}
          categoryRequests={rawRequests.filter(r => r.category === activeCategoryModal)}
          onClose={() => setActiveCategoryModal(null)}
        />
      )}

      {/* 3. Citizen Request Detail Modal */}
      {selectedRequestDetail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#002B49]">
                    Citizen Request Details
                  </h3>
                  <p className="font-mono text-xs font-bold text-slate-500">
                    {selectedRequestDetail.request_code || `REQ-${selectedRequestDetail.id}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                (selectedRequestDetail.request_type || '').toLowerCase() === 'complaint'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}>
                {(selectedRequestDetail.request_type || '').toLowerCase() === 'complaint' ? '⚠️ Complaint' : '🏗️ Demand'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900">
                {selectedRequestDetail.category}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  selectedRequestDetail.urgency === 'High' || selectedRequestDetail.urgency === 'Critical'
                    ? 'bg-rose-100 text-rose-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {selectedRequestDetail.urgency || 'Medium'} Urgency
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  isApprovedStatus(selectedRequestDetail.status)
                    ? 'bg-blue-100 text-blue-900'
                    : isRejectedStatus(selectedRequestDetail.status)
                    ? 'bg-rose-100 text-rose-900'
                    : isCompletedStatus(selectedRequestDetail.status)
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                Status: {selectedRequestDetail.status || 'Pending'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Lang: {selectedRequestDetail.original_language || selectedRequestDetail.language || 'English'}
              </span>
            </div>

            {/* Statement Box */}
            <div className="space-y-2 bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Original Citizen Statement
              </span>
              <blockquote className="font-bold text-[#002B49] text-sm sm:text-base leading-snug">
                &ldquo;{selectedRequestDetail.original_text || selectedRequestDetail.issue}&rdquo;
              </blockquote>
            </div>

            {/* AI Summary / Context */}
            {selectedRequestDetail.ai_summary && (
              <div className="space-y-1.5 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  AI Categorization & Context
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {selectedRequestDetail.ai_summary}
                </p>
              </div>
            )}

            {/* Photo Attachment Section */}
            {(() => {
              let attachmentsList = [];
              try {
                if (typeof selectedRequestDetail.attachments === 'string') {
                  attachmentsList = JSON.parse(selectedRequestDetail.attachments || '[]');
                } else if (Array.isArray(selectedRequestDetail.attachments)) {
                  attachmentsList = selectedRequestDetail.attachments;
                }
              } catch (e) {
                attachmentsList = [];
              }
              const firstAtt = attachmentsList[0] || {};
              const photoLoc = firstAtt.photo_location || selectedRequestDetail.photo_location;
              const hasGeoLocation = Boolean(firstAtt.location_captured || (photoLoc && photoLoc.latitude));

              return (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Citizen Evidence</span>
                  </span>

                  {selectedRequestDetail.photo_url ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100 flex items-center justify-center">
                        <img
                          src={selectedRequestDetail.photo_url}
                          alt="Citizen Evidence"
                          className="max-h-64 w-auto object-contain rounded-xl"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPhotoViewer({
                                url: selectedRequestDetail.photo_url,
                                title: selectedRequestDetail.issue || selectedRequestDetail.category,
                                requestCode: selectedRequestDetail.request_code || `REQ-${selectedRequestDetail.id}`
                              })
                            }
                            className="px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-lg flex items-center space-x-1.5 cursor-pointer hover:bg-slate-100"
                          >
                            <Maximize2 className="w-4 h-4" />
                            <span>View Full Screen</span>
                          </button>
                        </div>
                      </div>

                      {/* Geo-Location Status Box */}
                      {hasGeoLocation && photoLoc ? (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-emerald-900 flex items-center space-x-1">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span>📍 Location captured</span>
                            </span>
                            {photoLoc.accuracy && (
                              <span className="font-mono text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                Accuracy: ±{photoLoc.accuracy}m
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-emerald-100">
                            <span>
                              📅 Captured: {photoLoc.captured_at ? new Date(photoLoc.captured_at).toLocaleString() : 'During submission'}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setEvidenceMapModal({
                                  latitude: photoLoc.latitude,
                                  longitude: photoLoc.longitude,
                                  accuracy: photoLoc.accuracy || 15,
                                  title: selectedRequestDetail.issue || selectedRequestDetail.category,
                                  requestCode: selectedRequestDetail.request_code || `REQ-${selectedRequestDetail.id}`,
                                  capturedAt: photoLoc.captured_at ? new Date(photoLoc.captured_at).toLocaleString() : null
                                })
                              }
                              className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] flex items-center space-x-1 shadow-2xs cursor-pointer transition-all"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>View on Map</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>Location information was not attached to this photo.</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[11px] text-emerald-800 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Photo verified with submission</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPhotoViewer({
                              url: selectedRequestDetail.photo_url,
                              title: selectedRequestDetail.issue || selectedRequestDetail.category,
                              requestCode: selectedRequestDetail.request_code || `REQ-${selectedRequestDetail.id}`
                            })
                          }
                          className="text-xs font-black text-emerald-800 hover:text-emerald-950 flex items-center space-x-1 cursor-pointer hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Expand Image</span>
                        </button>
                      </div>
                    </div>
                  ) : (selectedRequestDetail.photo_exception || (selectedRequestDetail.request_type || '').toLowerCase() === 'complaint') ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-left space-y-1.5">
                      <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <span>⚠️ No Photo — Citizen Exception Active</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        Citizen declared no photographic evidence was available during submission. Authorized on-site inspection or verification may be scheduled for this complaint.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1">
                      <CameraOff className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-500">No photo attached by citizen</p>
                      <p className="text-[10px] text-slate-400">Citizen submitted this request via text/voice only</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Rejection Note or Completed Note */}
            {selectedRequestDetail.rejection_reason && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <span className="font-black uppercase tracking-wider block text-[10px]">Rejection Reason</span>
                <p className="font-medium">{selectedRequestDetail.rejection_reason}</p>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Location Details</span>
                <span className="font-bold text-slate-700">
                  {selectedRequestDetail.location_details || selectedRequestDetail.village || 'Ward Local Area'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted At</span>
                <span className="font-bold text-slate-700">
                  {selectedRequestDetail.created_at
                    ? new Date(selectedRequestDetail.created_at).toLocaleString()
                    : 'Recent'}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequestDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs cursor-pointer transition-all shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full-Screen Photo Viewer Lightbox Modal */}
      <WardPhotoViewerModal
        photoViewer={selectedPhotoViewer}
        onClose={() => setSelectedPhotoViewer(null)}
      />

      {/* 5. Citizen Photo Evidence Location Map Modal */}
      {evidenceMapModal && (
        <EvidenceMapModal
          evidence={evidenceMapModal}
          onClose={() => setEvidenceMapModal(null)}
        />
      )}
    </div>
  );
}
