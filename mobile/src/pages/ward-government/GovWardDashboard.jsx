import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert
} from 'react-native';
import GovWardMap from '../../components/gov/GovWardMap';
import WardConfirmationModal from '../../components/gov/WardConfirmationModal';
import WardSelectionModal from '../../components/gov/WardSelectionModal';
import WardPhotoViewerModal from '../../components/gov/WardPhotoViewerModal';
import EvidenceMapModal from '../../components/gov/EvidenceMapModal';
import { fetchRegionalIntelligence, updateWardRequestsBatchStatus } from '../../services/api';
import { colors } from '../../theme/colors';
import {
  Building2,
  MapPin,
  LogOut,
  CheckCircle2,
  Clock,
  Ban,
  CheckCheck,
  RefreshCw,
  Camera,
  Layers
} from 'lucide-react-native';

const CATEGORIES = [
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Tabs ('pending' | 'approved' | 'rejected' | 'completed')
  const [requestStatusTab, setRequestStatusTab] = useState('pending');
  // Type filter ('all' | 'demand' | 'complaint')
  const [govRequestType, setGovRequestType] = useState('all');

  // Modals
  const [selectedPhotoViewer, setSelectedPhotoViewer] = useState(null);
  const [evidenceMapModal, setEvidenceMapModal] = useState(null);
  const [selectionModal, setSelectionModal] = useState(null);
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const regionId = govUser?.regionId || govUser?.region_id || 1;
  const userEmail = govUser?.email;
  const wardName = govUser?.monitoringWard || govUser?.monitoring_ward || 'Ward 10 – Bavdhan';

  const loadWardIntelligence = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const intel = await fetchRegionalIntelligence(regionId, userEmail);
      if (intel && intel.region) {
        setIntelData(intel);
        const regLat = parseFloat(intel.region.latitude) || 18.5158;
        const regLng = parseFloat(intel.region.longitude) || 73.7711;

        // Extract localized micro hotspots
        const reqs = intel?.demand?.requests || [];
        const clusterMap = new Map();
        reqs.forEach((r, idx) => {
          const locKey = r.problem_address || r.location_details || r.category || `Sector ${idx + 1}`;
          if (!clusterMap.has(locKey)) clusterMap.set(locKey, []);
          clusterMap.get(locKey).push(r);
        });

        const localized = Array.from(clusterMap.entries()).map(([name, items], idx) => ({
          name,
          count: items.length,
          category: items[0]?.category || 'Civic',
          latitude: regLat + (idx === 0 ? 0 : idx % 2 === 0 ? 0.002 * idx : -0.002 * idx),
          longitude: regLng + (idx === 0 ? 0 : idx % 2 === 0 ? 0.002 * idx : -0.002 * idx)
        }));

        setHotspots(localized.length > 0 ? localized : [
          { name: 'Bavdhan Main Road', count: 3, category: 'Roads & Transport', latitude: regLat + 0.001, longitude: regLng + 0.001 },
          { name: 'Patil Nagar Water Tank', count: 2, category: 'Water & Sanitation', latitude: regLat - 0.001, longitude: regLng - 0.002 }
        ]);
      }
    } catch (err) {
      console.error('Ward load err:', err);
      setError('Ward data temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [regionId, userEmail]);

  useEffect(() => {
    loadWardIntelligence();
  }, [loadWardIntelligence]);

  const rawRequests = intelData?.demand?.requests || [];

  // Filter requests based on status tab, category, and type
  const filteredRequests = rawRequests.filter((r) => {
    const status = (r.status || 'pending').toLowerCase();
    const isStatusMatch =
      requestStatusTab === 'pending'
        ? status === 'pending' || status === 'under_review'
        : requestStatusTab === 'approved'
        ? status === 'approved' || status === 'in_progress'
        : requestStatusTab === 'completed'
        ? status === 'completed' || status === 'resolved'
        : status === 'rejected';

    const isCategoryMatch = selectedCategory === 'All' || r.category === selectedCategory;
    const reqType = (r.request_type || 'demand').toLowerCase();
    const isTypeMatch =
      govRequestType === 'all' ||
      (govRequestType === 'demand' && reqType === 'demand') ||
      (govRequestType === 'complaint' && reqType === 'complaint');

    return isStatusMatch && isCategoryMatch && isTypeMatch;
  });

  const pendingCount = rawRequests.filter(
    (r) => !r.status || r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'under_review'
  ).length;

  const approvedCount = rawRequests.filter(
    (r) => r.status && (r.status.toLowerCase() === 'approved' || r.status.toLowerCase() === 'in_progress')
  ).length;

  const completedCount = rawRequests.filter(
    (r) => r.status && (r.status.toLowerCase() === 'completed' || r.status.toLowerCase() === 'resolved')
  ).length;

  // Batch Action Handlers
  const handleOpenSelectionModal = (mode, category) => {
    setSelectionModal({ mode, category });
    setSelectedRequestIds([]);
  };

  const handleProceedFromSelectionToConfirm = () => {
    if (!selectionModal || selectedRequestIds.length === 0) return;
    setConfirmationModal({
      mode: selectionModal.mode,
      category: selectionModal.category,
      count: selectedRequestIds.length,
      requestIds: selectedRequestIds
    });
    setSelectionModal(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal) return;
    setIsSubmittingAction(true);
    setActionError('');

    try {
      const targetStatus =
        confirmationModal.mode === 'approve'
          ? 'approved'
          : confirmationModal.mode === 'reject'
          ? 'rejected'
          : 'completed';

      const response = await updateWardRequestsBatchStatus(
        {
          regionId,
          requestIds: confirmationModal.requestIds || [],
          status: targetStatus,
          rejectionReason: confirmationModal.mode === 'reject' ? rejectionReasonInput : null,
          category: confirmationModal.category
        },
        userEmail
      );

      if (response && response.success) {
        setConfirmationModal(null);
        setRejectionReasonInput('');
        loadWardIntelligence();
        Alert.alert('Success', `Requests marked as ${targetStatus}.`);
      } else {
        throw new Error(response.error || 'Failed to update request status.');
      }
    } catch (err) {
      console.error('Batch status update error:', err);
      setActionError(err.message || 'Operation could not be completed.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Building2 size={20} color="#6EE7B7" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{wardName}</Text>
            <Text style={styles.headerSubtitle}>Ward Action & Execution Hub</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={loadWardIntelligence} style={styles.refreshBtn}>
            <RefreshCw size={14} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <LogOut size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Ward Intelligence...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* KPI Summary Cards */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Clock size={18} color="#D97706" />
              <Text style={[styles.kpiValue, { color: '#B45309' }]}>{pendingCount}</Text>
              <Text style={styles.kpiLabel}>Pending Actions</Text>
            </View>

            <View style={styles.kpiCard}>
              <CheckCircle2 size={18} color="#2563EB" />
              <Text style={[styles.kpiValue, { color: '#1E40AF' }]}>{approvedCount}</Text>
              <Text style={styles.kpiLabel}>Approved / In Progress</Text>
            </View>

            <View style={styles.kpiCard}>
              <CheckCheck size={18} color={colors.emerald} />
              <Text style={[styles.kpiValue, { color: colors.emerald }]}>{completedCount}</Text>
              <Text style={styles.kpiLabel}>Resolved & Completed</Text>
            </View>
          </View>

          {/* Ward Delimitation Map */}
          <GovWardMap
            region={intelData?.region}
            office={intelData?.office}
            hotspots={hotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={(h) => setSelectedHotspot(h)}
          />

          {/* Type Filter (All / Demands / Complaints) */}
          <View style={styles.typeSwitcher}>
            <TouchableOpacity
              onPress={() => setGovRequestType('all')}
              style={[styles.typeBtn, govRequestType === 'all' && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnText, govRequestType === 'all' && styles.typeBtnTextActive]}>
                All Types
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setGovRequestType('demand')}
              style={[styles.typeBtn, govRequestType === 'demand' && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnText, govRequestType === 'demand' && styles.typeBtnTextActive]}>
                🏗️ Demands
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setGovRequestType('complaint')}
              style={[styles.typeBtn, govRequestType === 'complaint' && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnText, govRequestType === 'complaint' && styles.typeBtnTextActive]}>
                ⚠️ Complaints
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Status Tabs */}
          <View style={styles.statusTabs}>
            <TouchableOpacity
              onPress={() => setRequestStatusTab('pending')}
              style={[styles.statusTab, requestStatusTab === 'pending' && styles.statusTabActive]}
            >
              <Text style={[styles.statusTabText, requestStatusTab === 'pending' && styles.statusTabTextActive]}>
                Pending ({pendingCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRequestStatusTab('approved')}
              style={[styles.statusTab, requestStatusTab === 'approved' && styles.statusTabActive]}
            >
              <Text style={[styles.statusTabText, requestStatusTab === 'approved' && styles.statusTabTextActive]}>
                Approved ({approvedCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRequestStatusTab('completed')}
              style={[styles.statusTab, requestStatusTab === 'completed' && styles.statusTabActive]}
            >
              <Text style={[styles.statusTabText, requestStatusTab === 'completed' && styles.statusTabTextActive]}>
                Completed ({completedCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Batch Action Toolbar */}
          {selectedCategory !== 'All' && requestStatusTab === 'pending' && (
            <View style={styles.batchActionsRow}>
              <TouchableOpacity
                onPress={() => handleOpenSelectionModal('approve', selectedCategory)}
                style={styles.batchApproveBtn}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={14} color="#FFF" />
                <Text style={styles.batchBtnText}>Batch Approve {selectedCategory}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenSelectionModal('reject', selectedCategory)}
                style={styles.batchRejectBtn}
                activeOpacity={0.8}
              >
                <Ban size={14} color="#FFF" />
                <Text style={styles.batchBtnText}>Batch Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Requests Feed List */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              {requestStatusTab.toUpperCase()} Requests ({filteredRequests.length})
            </Text>

            {filteredRequests.length === 0 ? (
              <Text style={styles.emptyText}>No requests matching the selected filters.</Text>
            ) : (
              filteredRequests.map((req, idx) => {
                const isComplaint = (req.request_type || '').toLowerCase() === 'complaint';
                return (
                  <View key={req.id || idx} style={styles.requestCard}>
                    <View style={styles.reqHeader}>
                      <View style={styles.reqBadgeRow}>
                        <Text style={styles.reqCode}>{req.request_code || `REQ-${idx + 1}`}</Text>
                        <View style={[styles.typeBadge, isComplaint ? styles.typeBadgeComplaint : styles.typeBadgeDemand]}>
                          <Text style={styles.typeBadgeText}>
                            {isComplaint ? '⚠️ Complaint' : '🏗️ Demand'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reqDate}>
                        {new Date(req.created_at || Date.now()).toLocaleDateString('en-IN')}
                      </Text>
                    </View>

                    <Text numberOfLines={3} style={styles.reqText}>
                      "{req.problem_text || req.text || 'Citizen submission'}"
                    </Text>

                    <View style={styles.reqFooter}>
                      <Text style={styles.reqCatBadge}>{req.category || 'Civic'}</Text>

                      <View style={styles.reqActions}>
                        {req.photo_url || req.photo ? (
                          <>
                            <TouchableOpacity
                              onPress={() =>
                                setSelectedPhotoViewer({
                                  url: req.photo_url || req.photo?.dataUrl || req.photo?.data,
                                  title: req.category || 'Civic Evidence',
                                  requestCode: req.request_code
                                })
                              }
                              style={styles.actionPill}
                            >
                              <Camera size={12} color={colors.primary} />
                              <Text style={styles.actionPillText}>Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() =>
                                setEvidenceMapModal({
                                  latitude: req.photo_latitude || req.location?.latitude || 18.5158,
                                  longitude: req.photo_longitude || req.location?.longitude || 73.7711,
                                  accuracy: req.photo_accuracy || req.location?.accuracy || 15,
                                  address: req.problem_address || req.location?.address,
                                  requestCode: req.request_code
                                })
                              }
                              style={[styles.actionPill, { backgroundColor: '#ECFDF5' }]}
                            >
                              <MapPin size={12} color={colors.emerald} />
                              <Text style={[styles.actionPillText, { color: '#065F46' }]}>GPS Pin</Text>
                            </TouchableOpacity>
                          </>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Ward Modals */}
      <WardSelectionModal
        visible={Boolean(selectionModal)}
        selectionModal={selectionModal}
        rawRequests={rawRequests}
        selectedRequestIds={selectedRequestIds}
        setSelectedRequestIds={setSelectedRequestIds}
        onClose={() => setSelectionModal(null)}
        onProceedToConfirm={handleProceedFromSelectionToConfirm}
      />

      <WardConfirmationModal
        visible={Boolean(confirmationModal)}
        confirmationModal={confirmationModal}
        wardName={wardName}
        rejectionReasonInput={rejectionReasonInput}
        setRejectionReasonInput={setRejectionReasonInput}
        actionError={actionError}
        isSubmittingAction={isSubmittingAction}
        onClose={() => setConfirmationModal(null)}
        onConfirm={handleConfirmAction}
      />

      <EvidenceMapModal
        visible={Boolean(evidenceMapModal)}
        evidence={evidenceMapModal}
        onClose={() => setEvidenceMapModal(null)}
      />

      <WardPhotoViewerModal
        visible={Boolean(selectedPhotoViewer)}
        photoViewer={selectedPhotoViewer}
        onClose={() => setSelectedPhotoViewer(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF'
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#CBD5E1'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  refreshBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8
  },
  logoutBtn: {
    padding: 6
  },
  content: {
    flex: 1,
    padding: 14
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B'
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 2
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  typeBtnActive: {
    backgroundColor: '#FFF',
    elevation: 1
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  typeBtnTextActive: {
    color: '#0F172A'
  },
  catChips: {
    gap: 6,
    marginBottom: 10
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 6
  },
  catChipActive: {
    backgroundColor: colors.primary
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  catChipTextActive: {
    color: '#FFF'
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  statusTabActive: {
    backgroundColor: '#FFF'
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  statusTabTextActive: {
    color: colors.primary
  },
  batchActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  batchApproveBtn: {
    flex: 1,
    backgroundColor: '#065F46',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
  },
  batchRejectBtn: {
    backgroundColor: '#BE123C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
  },
  batchBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF'
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    paddingVertical: 10
  },
  requestCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    gap: 6
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reqBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  reqCode: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  typeBadgeDemand: {
    backgroundColor: '#DBEAFE'
  },
  typeBadgeComplaint: {
    backgroundColor: '#FEE2E2'
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E293B'
  },
  reqDate: {
    fontSize: 10,
    color: '#94A3B8'
  },
  reqText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16
  },
  reqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6
  },
  reqCatBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B'
  },
  reqActions: {
    flexDirection: 'row',
    gap: 6
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary
  }
});
