import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import {
  X,
  Building2,
  Calendar,
  Search,
  MapPin,
  Landmark,
  IndianRupee,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react-native';
import { TRANSLATIONS } from '../../constants/translations';
import { fetchGovernmentPlans } from '../../services/api';
import { colors } from '../../theme/colors';

const CATEGORIES = [
  'All',
  'Healthcare',
  'Roads & Transport',
  'Water & Sanitation',
  'Education',
  'Electricity',
  'Waste Management',
  'Housing',
  'Agriculture',
  'Other'
];

export default function GovernmentPlansModal({ visible, language = 'en', onClose, initialPlan = null }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [activeTab, setActiveTab] = useState(initialPlan && initialPlan.status === 'completed' ? 'completed' : 'upcoming');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || null);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchGovernmentPlans({
        status: activeTab,
        category: categoryFilter !== 'All' ? categoryFilter : null,
        search: searchQuery.trim() || null
      });
      setPlans(data || []);
    } catch (err) {
      console.error('Failed to load government plans:', err);
      setError(err.message || 'Failed to retrieve government plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadPlans();
    }
  }, [visible, activeTab, categoryFilter]);

  const getPlanTitle = (plan) => {
    if (language === 'mr' && plan.title_mr) return plan.title_mr;
    if (language === 'hi' && plan.title_hi) return plan.title_hi;
    return plan.title || plan.title_mr || plan.title_hi || 'Government Development Plan';
  };

  const getPlanDescription = (plan) => {
    if (language === 'mr' && plan.description_mr) return plan.description_mr;
    if (language === 'hi' && plan.description_hi) return plan.description_hi;
    return plan.description || plan.description_mr || plan.description_hi || '';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIcon}>
              <Building2 size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>{t.governmentPlansTitle || 'Government Development Plans'}</Text>
              <Text style={styles.headerSubtitle}>
                {t.governmentPlansSubtitle || 'Upcoming & completed public infrastructure projects'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Tabs & Search */}
        <View style={styles.filterBar}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => { setActiveTab('upcoming'); setSelectedPlan(null); }}
              style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'upcoming' && styles.tabBtnTextActive]}>
                {t.upcomingProjects || 'Upcoming Projects'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setActiveTab('completed'); setSelectedPlan(null); }}
              style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'completed' && styles.tabBtnTextActive]}>
                {t.completedProjects || 'Completed Projects'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlansPlaceholder || 'Search schemes, projects...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={loadPlans}
              returnKeyType="search"
            />
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoryFilter(cat)}
                style={[styles.catChip, categoryFilter === cat && styles.catChipActive]}
              >
                <Text style={[styles.catText, categoryFilter === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Body Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t.loading || 'Loading plans...'}</Text>
          </View>
        ) : selectedPlan ? (
          /* Detail View */
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 30 }}>
            <TouchableOpacity onPress={() => setSelectedPlan(null)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← {t.backToPlans || 'Back to list'}</Text>
            </TouchableOpacity>

            <View style={styles.detailCard}>
              <View style={styles.badgeRow}>
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{selectedPlan.category || 'Civic'}</Text>
                </View>
                <View style={[styles.statusBadge, selectedPlan.status === 'completed' ? styles.statusBadgeCompleted : styles.statusBadgeUpcoming]}>
                  <Text style={[styles.statusBadgeText, selectedPlan.status === 'completed' ? { color: colors.emerald } : { color: '#2563EB' }]}>
                    {selectedPlan.status === 'completed' ? 'Completed' : 'Upcoming / Ongoing'}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailTitle}>{getPlanTitle(selectedPlan)}</Text>
              <Text style={styles.detailDesc}>{getPlanDescription(selectedPlan)}</Text>

              <View style={styles.metaList}>
                {selectedPlan.allocated_budget ? (
                  <View style={styles.metaItem}>
                    <IndianRupee size={16} color="#64748B" />
                    <Text style={styles.metaLabel}>Budget:</Text>
                    <Text style={styles.metaValue}>₹{selectedPlan.allocated_budget}</Text>
                  </View>
                ) : null}

                {selectedPlan.department ? (
                  <View style={styles.metaItem}>
                    <Landmark size={16} color="#64748B" />
                    <Text style={styles.metaLabel}>Department:</Text>
                    <Text style={styles.metaValue}>{selectedPlan.department}</Text>
                  </View>
                ) : null}

                {selectedPlan.target_completion_date ? (
                  <View style={styles.metaItem}>
                    <Calendar size={16} color="#64748B" />
                    <Text style={styles.metaLabel}>Target Date:</Text>
                    <Text style={styles.metaValue}>{selectedPlan.target_completion_date}</Text>
                  </View>
                ) : null}

                {selectedPlan.location_name ? (
                  <View style={styles.metaItem}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.metaLabel}>Location:</Text>
                    <Text style={styles.metaValue}>{selectedPlan.location_name}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        ) : plans.length === 0 ? (
          <View style={styles.centerContainer}>
            <Info size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>{t.noPlansFound || 'No government plans found matching your criteria.'}</Text>
          </View>
        ) : (
          /* Plans List */
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 30 }}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id || plan._id || Math.random()}
                onPress={() => setSelectedPlan(plan)}
                style={styles.planCard}
                activeOpacity={0.7}
              >
                <View style={styles.planCardHeader}>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{plan.category || 'Civic'}</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </View>

                <Text style={styles.planTitle}>{getPlanTitle(plan)}</Text>
                <Text numberOfLines={2} style={styles.planDesc}>{getPlanDescription(plan)}</Text>

                <View style={styles.planFooter}>
                  {plan.target_completion_date ? (
                    <View style={styles.planDate}>
                      <Calendar size={13} color="#64748B" />
                      <Text style={styles.planDateText}>{plan.target_completion_date}</Text>
                    </View>
                  ) : null}
                  {plan.allocated_budget ? (
                    <Text style={styles.planBudget}>₹{plan.allocated_budget}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
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
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  filterBar: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 12,
    gap: 10
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  tabBtnTextActive: {
    color: '#2563EB'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A'
  },
  catList: {
    gap: 6
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6
  },
  catChipActive: {
    backgroundColor: colors.primary
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  catTextActive: {
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
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center'
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  catBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB'
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  planDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8
  },
  planDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  planDateText: {
    fontSize: 11,
    color: '#64748B'
  },
  planBudget: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emerald
  },
  backBtn: {
    marginBottom: 12
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB'
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusBadgeUpcoming: {
    backgroundColor: '#EFF6FF'
  },
  statusBadgeCompleted: {
    backgroundColor: '#ECFDF5'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8
  },
  detailDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16
  },
  metaList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 8
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  }
});
