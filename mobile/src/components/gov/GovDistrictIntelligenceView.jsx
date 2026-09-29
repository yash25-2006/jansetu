import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { ArrowLeft, MapPin, BarChart3, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function GovDistrictIntelligenceView({
  activeState = 'Maharashtra',
  selectedDistrict = 'Pune',
  requests = [],
  onBack = () => {},
  onSelectCategory = () => {}
}) {
  const districtRequests = requests.filter(
    (r) => r.district && r.district.toLowerCase() === selectedDistrict.toLowerCase()
  );

  const total = districtRequests.length;

  // Group by category
  const categoryCounts = {};
  districtRequests.forEach((r) => {
    const cat = r.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={16} color="#FFF" />
          <Text style={styles.backText}>All Districts</Text>
        </TouchableOpacity>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{total} Demands</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.title}>{selectedDistrict} District Intelligence</Text>
        <Text style={styles.subtitle}>
          Categorical demand distribution and citizen priorities for {selectedDistrict} ({activeState}).
        </Text>

        {/* Categories Breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Demand by Category</Text>
          </View>

          {sortedCategories.length === 0 ? (
            <Text style={styles.emptyText}>No registered requests in {selectedDistrict} yet.</Text>
          ) : (
            sortedCategories.map(([category, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => onSelectCategory(category)}
                  style={styles.categoryRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.catMeta}>
                    <Text style={styles.catName}>{category}</Text>
                    <Text style={styles.catCount}>{count} ({pct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Requests List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Submissions in {selectedDistrict}</Text>
          {districtRequests.slice(0, 10).map((req, idx) => (
            <View key={req.id || idx} style={styles.requestCard}>
              <View style={styles.reqHeader}>
                <Text style={styles.reqCode}>{req.request_code || `REQ-${idx + 1}`}</Text>
                <Text style={styles.reqCat}>{req.category || 'Civic'}</Text>
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
  categoryRow: {
    gap: 4
  },
  catMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  catName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  catCount: {
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
  reqCat: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700'
  },
  reqText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16
  }
});
