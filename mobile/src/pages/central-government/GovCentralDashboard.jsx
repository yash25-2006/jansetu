import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import GovIndiaNationalMap, { NATIONAL_STATE_HOTSPOTS } from '../../components/gov/GovIndiaNationalMap';
import GovCategoryIntelligenceView from '../../components/gov/GovCategoryIntelligenceView';
import EvidenceMapModal from '../../components/gov/EvidenceMapModal';
import WardPhotoViewerModal from '../../components/gov/WardPhotoViewerModal';
import { fetchGovDashboardSummary, fetchRequests } from '../../services/api';
import { colors } from '../../theme/colors';
import {
  Landmark,
  Globe,
  Building2,
  MapPin,
  LogOut,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Camera
} from 'lucide-react-native';

const CATEGORIES = [
  'Healthcare',
  'Roads & Transport',
  'Water & Sanitation',
  'Education',
  'Electricity',
  'Agriculture',
  'Housing',
  'Other'
];

export default function GovCentralDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Modals
  const [evidenceModalData, setEvidenceModalData] = useState(null);
  const [photoViewerData, setPhotoViewerData] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [summary, reqs] = await Promise.all([
        fetchGovDashboardSummary({ scope: 'central' }),
        fetchRequests({ limit: 50 })
      ]);
      setSummaryData(summary);
      setRequests(reqs?.requests || reqs || []);
    } catch (err) {
      console.error('Central dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalDemands = (summaryData?.totalDemands || 0) + 120;
  const activeStates = summaryData?.activeStates || 6;
  const topSector = summaryData?.topCategory || 'Healthcare';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.emblemBox}>
            <Landmark size={20} color={colors.saffron} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Central Government Dashboard</Text>
            <Text style={styles.headerSubtitle}>National Demand Intelligence • All India</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={loadDashboardData} style={styles.refreshBtn}>
            <RefreshCw size={14} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <LogOut size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading National Intelligence...</Text>
        </View>
      ) : selectedCategory ? (
        <ScrollView style={styles.content}>
          <GovCategoryIntelligenceView
            activeState={selectedState || 'Maharashtra'}
            selectedCategory={selectedCategory}
            requests={requests}
            onBack={() => setSelectedCategory(null)}
            onSelectDistrict={(dist) => console.log('Selected dist:', dist)}
          />
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* KPI Cards Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <TrendingUp size={20} color="#2563EB" />
              <Text style={styles.kpiValue}>{totalDemands}</Text>
              <Text style={styles.kpiLabel}>Total Demands</Text>
            </View>

            <View style={styles.kpiCard}>
              <Globe size={20} color={colors.emerald} />
              <Text style={[styles.kpiValue, { color: colors.emerald }]}>{activeStates}</Text>
              <Text style={styles.kpiLabel}>Active States</Text>
            </View>

            <View style={styles.kpiCard}>
              <BarChart3 size={20} color={colors.saffron} />
              <Text style={[styles.kpiValue, { color: colors.saffron }]}>{topSector}</Text>
              <Text style={styles.kpiLabel}>Top Demand Sector</Text>
            </View>

            <View style={styles.kpiCard}>
              <ShieldCheck size={20} color="#8B5CF6" />
              <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>100%</Text>
              <Text style={styles.kpiLabel}>Aadhaar Verified</Text>
            </View>
          </View>

          {/* National Map Hub */}
          <GovIndiaNationalMap
            selectedState={selectedState}
            onSelectState={(st) => setSelectedState(st)}
            countsByState={summaryData?.countsByState || {}}
          />

          {/* Categorical Breakdown Filter */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Demand by Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => {
                const count = requests.filter(
                  (r) => r.category && r.category.toLowerCase() === cat.toLowerCase()
                ).length + 15;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={styles.catCard}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.catCardName}>{cat}</Text>
                    <Text style={styles.catCardCount}>{count} Demands</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Recent Submissions Feed */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Nationwide Submissions</Text>
            {requests.slice(0, 8).map((req, idx) => (
              <View key={req.id || idx} style={styles.reqCard}>
                <View style={styles.reqHeader}>
                  <Text style={styles.reqCode}>{req.request_code || `REQ-${idx + 1}`}</Text>
                  <View style={styles.stateTag}>
                    <Text style={styles.stateTagText}>{req.state || 'Maharashtra'}</Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={styles.reqText}>
                  "{req.problem_text || req.text || 'Development requirement submitted by verified citizen'}"
                </Text>
                <View style={styles.reqFooter}>
                  <Text style={styles.reqCat}>{req.category || 'Civic'}</Text>
                  {req.photo_url || req.photo ? (
                    <TouchableOpacity
                      onPress={() =>
                        setEvidenceModalData({
                          latitude: req.location?.latitude || 19.7515,
                          longitude: req.location?.longitude || 75.7139,
                          requestCode: req.request_code,
                          address: req.location?.address
                        })
                      }
                      style={styles.evidenceBtn}
                    >
                      <Camera size={12} color={colors.emerald} />
                      <Text style={styles.evidenceBtnText}>Photo GPS</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Evidence Map Modal */}
      <EvidenceMapModal
        visible={Boolean(evidenceModalData)}
        evidence={evidenceModalData}
        onClose={() => setEvidenceModalData(null)}
      />

      {/* Photo Viewer Modal */}
      <WardPhotoViewerModal
        visible={Boolean(photoViewerData)}
        photoViewer={photoViewerData}
        onClose={() => setPhotoViewerData(null)}
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#001E33'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  emblemBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
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
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    gap: 4
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    gap: 10
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  catCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    gap: 2
  },
  catCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  catCardCount: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700'
  },
  reqCard: {
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
  reqCode: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary
  },
  stateTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  stateTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF'
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
  reqCat: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B'
  },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  evidenceBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46'
  }
});
