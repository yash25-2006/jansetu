import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { fetchCitizenRequests, sendCitizenReminder } from '../../services/api';
import { COLORS } from '../../theme/colors';

export default function CitizenHistoryModal({
  isOpen,
  citizenId,
  citizenName,
  onClose
}) {
  if (!isOpen) return null;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [citizenId]);

  const loadData = async () => {
    if (!citizenId) return;
    try {
      setLoading(true);
      const data = await fetchCitizenRequests(citizenId);
      setRequests(data || []);
    } catch (e) {
      console.warn('Error fetching citizen requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemind = async (reqId) => {
    try {
      setRemindingId(reqId);
      const res = await sendCitizenReminder(reqId, citizenId, citizenName);
      if (res.success) {
        Alert.alert('Reminder Sent', 'Official reminder sent to the Municipal Ward authorities.');
        loadData();
      } else {
        Alert.alert('Notice', res.error || 'Reminder cooldown active (7-day rule).');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send reminder.');
    } finally {
      setRemindingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const st = (status || 'PENDING').toUpperCase();
    if (st === 'APPROVED') return { bg: '#D1FAE5', text: '#065F46', label: 'Approved' };
    if (st === 'REJECTED') return { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' };
    if (st === 'COMPLETED') return { bg: '#E0E7FF', text: '#3730A3', label: 'Completed' };
    return { bg: '#FEF3C7', text: '#92400E', label: 'Pending Review' };
  };

  return (
    <Modal visible={isOpen} transparent={false} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>📋 My Submissions & Tracking</Text>
            <Text style={styles.headerSubtitle}>{citizenName} • {citizenId}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching your records...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Submissions Yet</Text>
            <Text style={styles.emptyDesc}>Your submitted civic demands and complaints will appear here.</Text>
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {requests.map((item) => {
              const badge = getStatusBadge(item.status);
              const isRemindEligible = !item.reminded_at && (item.status === 'PENDING' || item.status === 'pending');

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.codeText}>{item.request_code || `REQ-${item.id}`}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.categoryText}>📁 {item.category} • {item.request_type === 'complaint' ? '⚠️ Complaint' : '🏗️ Demand'}</Text>
                  <Text style={styles.issueText} numberOfLines={3}>{item.original_text || item.issue}</Text>

                  {item.ai_summary ? (
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryText}>💡 {item.ai_summary}</Text>
                    </View>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                      📅 {new Date(item.created_at).toLocaleDateString()}
                    </Text>

                    {isRemindEligible && (
                      <TouchableOpacity
                        onPress={() => handleRemind(item.id)}
                        style={styles.remindBtn}
                        disabled={remindingId === item.id}
                      >
                        <Text style={styles.remindBtnText}>
                          {remindingId === item.id ? 'Sending...' : '🔔 Remind (7-Day)'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 13
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4
  },
  list: {
    flex: 1
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  codeText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    fontFamily: 'monospace'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4
  },
  issueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 8
  },
  summaryBox: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8
  },
  summaryText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  remindBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  remindBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold'
  }
});
