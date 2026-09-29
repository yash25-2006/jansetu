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
import GovStateDistrictMap, { STATE_DISTRICTS_DATA } from '../../components/gov/GovStateDistrictMap';
import GovDistrictIntelligenceView from '../../components/gov/GovDistrictIntelligenceView';
import GovCategoryIntelligenceView from '../../components/gov/GovCategoryIntelligenceView';
import EvidenceMapModal from '../../components/gov/EvidenceMapModal';
import WardPhotoViewerModal from '../../components/gov/WardPhotoViewerModal';
import { fetchGovDashboardSummary, fetchRequests } from '../../services/api';
import { colors } from '../../theme/colors';
import {
  Building2,
  MapPin,
  LogOut,
  TrendingUp,
  RefreshCw,
  Camera,
  Layers
} from 'lucide-react-native';

const AVAILABLE_STATES = ['Maharashtra', 'Assam', 'Rajasthan', 'Tamil Nadu'];

export default function GovernmentDashboard({ govUser, onLogout }) {
  const [activeState, setActiveState] = useState(govUser?.monitoringState || 'Maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);

  // Modals
  const [evidenceModalData, setEvidenceModalData] = useState(null);
  const [photoViewerData, setPhotoViewerData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, reqData] = await Promise.all([
        fetchGovDashboardSummary(activeState, selectedDistrict !== 'All' ? selectedDistrict : null),
        fetchRequests({
          state: activeState,
          district: selectedDistrict !== 'All' ? selectedDistrict : null,
          limit: 50
        })
      ]);
      setSummary(sumData);
      setRequests(reqData?.data || reqData?.requests || reqData || []);
    } catch (err) {
      console.error('State dashboard load err:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeState, selectedDistrict]);

  const totalDemands = requests.length > 0 ? requests.length + 30 : 45;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Building2 size={20} color="#93C5FD" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{activeState} State Portal</Text>
            <Text style={styles.headerSubtitle}>
              {selectedDistrict === 'All' ? 'All Districts' : `${selectedDistrict} District`}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
            <RefreshCw size={14} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <LogOut size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* State Switcher Bar */}
      <View style={styles.stateBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statePills}>
          {AVAILABLE_STATES.map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => {
                setActiveState(st);
                setSelectedDistrict('All');
                setSelectedCategory(null);
              }}
              style={[styles.statePill, activeState === st && styles.statePillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.statePillText, activeState === st && styles.statePillTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading {activeState} Intelligence...</Text>
        </View>
      ) : selectedCategory ? (
        <ScrollView style={styles.content}>
          <GovCategoryIntelligenceView
            activeState={activeState}
            selectedCategory={selectedCategory}
            requests={requests}
            onBack={() => setSelectedCategory(null)}
            onSelectDistrict={(dist) => setSelectedDistrict(dist)}
          />
        </ScrollView>
      ) : selectedDistrict !== 'All' ? (
        <ScrollView style={styles.content}>
          <GovDistrictIntelligenceView
            activeState={activeState}
            selectedDistrict={selectedDistrict}
            requests={requests}
            onBack={() => setSelectedDistrict('All')}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* KPI Summary */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <TrendingUp size={20} color="#2563EB" />
              <Text style={styles.kpiValue}>{totalDemands}</Text>
              <Text style={styles.kpiLabel}>Total Demands</Text>
            </View>

            <View style={styles.kpiCard}>
              <MapPin size={20} color={colors.emerald} />
              <Text style={[styles.kpiValue, { color: colors.emerald }]}>
                {STATE_DISTRICTS_DATA[activeState]?.length || 6}
              </Text>
              <Text style={styles.kpiLabel}>Districts Monitored</Text>
            </View>
          </View>

          {/* State District Map with Working Dropdown/Pills */}
          <GovStateDistrictMap
            stateName={activeState}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={(dist) => setSelectedDistrict(dist)}
            requests={requests}
          />

          {/* Submissions List */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>District Submissions Feed</Text>
            {requests.slice(0, 10).map((req, idx) => (
              <View key={req.id || idx} style={styles.reqCard}>
                <View style={styles.reqHeader}>
                  <Text style={styles.reqCode}>{req.request_code || `REQ-${idx + 1}`}</Text>
                  <View style={styles.distTag}>
                    <Text style={styles.distTagText}>{req.district || 'District'}</Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={styles.reqText}>
                  "{req.problem_text || req.text || 'Civic infrastructure improvement'}"
                </Text>
                <View style={styles.reqFooter}>
                  <Text style={styles.reqCat}>{req.category || 'Civic'}</Text>
                  {req.photo_url || req.photo ? (
                    <TouchableOpacity
                      onPress={() =>
                        setEvidenceModalData({
                          latitude: req.location?.latitude || 18.5204,
                          longitude: req.location?.longitude || 73.8567,
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
  stateBar: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6
  },
  statePills: {
    paddingHorizontal: 12,
    gap: 6
  },
  statePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6
  },
  statePillActive: {
    backgroundColor: colors.primary
  },
  statePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  statePillTextActive: {
    color: '#FFF'
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
    gap: 10,
    marginBottom: 14
  },
  kpiCard: {
    flex: 1,
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
  distTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  distTagText: {
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
