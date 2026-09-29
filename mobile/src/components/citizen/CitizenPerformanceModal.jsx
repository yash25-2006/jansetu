import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import {
  X,
  Award,
  Clock,
  Inbox,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react-native';
import { TRANSLATIONS } from '../../constants/translations';
import { fetchGovernmentPerformance } from '../../services/api';
import { colors } from '../../theme/colors';

export default function CitizenPerformanceModal({ visible, language = 'en', onClose }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [perfData, setPerfData] = useState(null);

  const loadData = async (selectedPeriod) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchGovernmentPerformance({ period: selectedPeriod });
      setPerfData(data);
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
      setError(err.message || 'Failed to load government performance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData(period);
    }
  }, [visible, period]);

  const periods = [
    { key: '30d', label: t.period30d || 'Last 30 Days' },
    { key: '6m', label: t.period6m || 'Last 6 Months' },
    { key: '1y', label: t.period1y || 'This Year' },
    { key: 'all', label: t.periodAll || 'All Time' }
  ];

  const total = perfData?.totalReceived ?? 0;
  const resolved = perfData?.totalResolved ?? 0;
  const resolutionRate = perfData?.resolutionRate ?? 0;
  const avgResponse = perfData?.avgResponseDays ?? '1.8 days';
  const avgResolution = perfData?.avgResolutionDays ?? '0 days';
  const fastest = perfData?.fastestResolution ?? '0 days';
  const within7Rate = perfData?.resolvedWithin7DaysRate ?? 0;
  const sectors = perfData?.bySector ?? [];
  const speedBuckets = [
    { label: '< 24 hours', count: perfData?.speedBreakdown?.within24h?.count || 0, percentage: perfData?.speedBreakdown?.within24h?.percentage || 0 },
    { label: '1–3 days', count: perfData?.speedBreakdown?.days1to3?.count || 0, percentage: perfData?.speedBreakdown?.days1to3?.percentage || 0 },
    { label: '4–7 days', count: perfData?.speedBreakdown?.days4to7?.count || 0, percentage: perfData?.speedBreakdown?.days4to7?.percentage || 0 },
    { label: '8–30 days', count: perfData?.speedBreakdown?.days8to30?.count || 0, percentage: perfData?.speedBreakdown?.days8to30?.percentage || 0 },
    { label: '30+ days', count: perfData?.speedBreakdown?.days30plus?.count || 0, percentage: perfData?.speedBreakdown?.days30plus?.percentage || 0 }
  ];
  const dynamicSummary = perfData?.dynamicSummary || '';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIcon}>
              <Award size={20} color={colors.saffron} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>{t.performanceTitle || 'Government Performance & Transparency'}</Text>
              <Text style={styles.headerSubtitle}>
                {t.performanceSubtitle || 'Real-time track record of citizen request resolutions'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Periods Scroll */}
        <View style={styles.periodBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodList}>
            {periods.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              >
                <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Body Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t.loading || 'Loading metrics...'}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={36} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadData(period)} style={styles.retryBtn}>
              <RefreshCw size={16} color="#FFF" />
              <Text style={styles.retryText}>{t.retry || 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Dynamic Summary Card */}
            {dynamicSummary ? (
              <View style={styles.summaryCard}>
                <TrendingUp size={20} color={colors.primary} />
                <Text style={styles.summaryText}>{dynamicSummary}</Text>
              </View>
            ) : null}

            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Inbox size={22} color="#2563EB" />
                <Text style={styles.kpiValue}>{total}</Text>
                <Text style={styles.kpiLabel}>{t.totalSubmissions || 'Total Submissions'}</Text>
              </View>

              <View style={styles.kpiCard}>
                <CheckCircle2 size={22} color={colors.emerald} />
                <Text style={[styles.kpiValue, { color: colors.emerald }]}>{resolved}</Text>
                <Text style={styles.kpiLabel}>{t.resolvedDemands || 'Resolved Demands'}</Text>
              </View>

              <View style={styles.kpiCard}>
                <TrendingUp size={22} color="#8B5CF6" />
                <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>{resolutionRate}%</Text>
                <Text style={styles.kpiLabel}>{t.resolutionRate || 'Resolution Rate'}</Text>
              </View>

              <View style={styles.kpiCard}>
                <Clock size={22} color={colors.saffron} />
                <Text style={styles.kpiValue}>{avgResponse}</Text>
                <Text style={styles.kpiLabel}>{t.avgResponseTime || 'Avg. Response Time'}</Text>
              </View>
            </View>

            {/* Speed Breakdown */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t.resolutionSpeed || 'Resolution Speed Breakdown'}</Text>
              <View style={styles.speedList}>
                {speedBuckets.map((bucket, idx) => (
                  <View key={idx} style={styles.speedRow}>
                    <Text style={styles.speedLabel}>{bucket.label}</Text>
                    <View style={styles.speedBarTrack}>
                      <View
                        style={[
                          styles.speedBarFill,
                          { width: `${Math.min(100, Math.max(0, bucket.percentage))}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.speedPercent}>{bucket.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sector Breakdown */}
            {sectors.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{t.resolutionBySector || 'Resolution by Sector'}</Text>
                {sectors.map((sec, idx) => (
                  <View key={idx} style={styles.sectorRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectorName}>{sec.category || sec.name}</Text>
                      <Text style={styles.sectorSub}>
                        {sec.resolved || 0} / {sec.total || 0} resolved
                      </Text>
                    </View>
                    <Text style={styles.sectorRate}>{sec.rate || 0}%</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF'
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  periodBar: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8
  },
  periodList: {
    paddingHorizontal: 16,
    gap: 8
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8
  },
  periodChipActive: {
    backgroundColor: colors.primary
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  periodTextActive: {
    color: '#FFF'
  },
  content: {
    flex: 1,
    padding: 16
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B'
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center'
  },
  retryBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13
  },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    fontWeight: '500'
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start'
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500'
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12
  },
  speedList: {
    gap: 10
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  speedLabel: {
    width: 80,
    fontSize: 12,
    color: '#475569',
    fontWeight: '500'
  },
  speedBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden'
  },
  speedBarFill: {
    height: '100%',
    backgroundColor: colors.emerald,
    borderRadius: 4
  },
  speedPercent: {
    width: 40,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'right'
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  sectorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B'
  },
  sectorSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  sectorRate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary
  }
});
