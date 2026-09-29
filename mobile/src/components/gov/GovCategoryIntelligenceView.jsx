import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { ArrowLeft, BarChart3, FileText, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function GovCategoryIntelligenceView({
  activeState = 'Maharashtra',
  selectedCategory = 'Healthcare',
  requests = [],
  onBack = () => {},
  onSelectDistrict = () => {}
}) {
  const categoryRequests = requests.filter(
    (r) => r.category && r.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const total = categoryRequests.length;
  const districtCounts = {};
  const districtDemandTopics = {};

  categoryRequests.forEach((r) => {
    const dist = r.district || 'Unassigned District';
    districtCounts[dist] = (districtCounts[dist] || 0) + 1;
    if (!districtDemandTopics[dist]) {
      districtDemandTopics[dist] = new Set();
    }
    if (r.issue || r.title) {
      districtDemandTopics[dist].add(r.issue || r.title);
    }
  });

  const sortedDistricts = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={16} color="#FFF" />
          <Text style={styles.backText}>Back to {activeState}</Text>
        </TouchableOpacity>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{total} Total Demands</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.title}>{selectedCategory} Demand — {activeState}</Text>
        <Text style={styles.subtitle}>
          Comparative district breakdown and specific citizen demand themes.
        </Text>

        {/* District Breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Demand by District</Text>
          </View>

          {sortedDistricts.length === 0 ? (
            <Text style={styles.emptyText}>No requests in this category yet.</Text>
          ) : (
            sortedDistricts.map(([district, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <TouchableOpacity
                  key={district}
                  onPress={() => onSelectDistrict(district)}
                  style={styles.districtRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.distMeta}>
                    <Text style={styles.distName}>{district}</Text>
                    <Text style={styles.distCount}>{count} ({pct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Specific Citizen Requests */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FileText size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Recent Submissions in {selectedCategory}</Text>
          </View>

          {categoryRequests.slice(0, 10).map((req, idx) => (
            <View key={req.id || idx} style={styles.requestCard}>
              <View style={styles.reqHeader}>
                <Text style={styles.reqCode}>{req.request_code || `REQ-${idx + 1}`}</Text>
                <Text style={styles.reqDistrict}>{req.district || activeState}</Text>
              </View>
              <Text style={styles.reqText} numberOfLines={2}>
                "{req.problem_text || req.text || 'Civic infrastructure improvement'}"
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF'
  },
  totalBadge: {
    backgroundColor: colors.saffron,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#002B49'
  },
  body: {
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    gap: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    paddingVertical: 8
  },
  districtRow: {
    gap: 4
  },
  distMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  distName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  distCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  barTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    gap: 4
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
  reqDistrict: {
    fontSize: 10,
    color: '#64748B'
  },
  reqText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16
  }
});
