import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { CheckCircle2, Ban, X, Check } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function WardSelectionModal({
  visible,
  selectionModal,
  rawRequests = [],
  selectedRequestIds = [],
  setSelectedRequestIds,
  isPendingStatus = (status) => !status || status.toLowerCase() === 'pending',
  onClose,
  onProceedToConfirm
}) {
  if (!selectionModal) return null;

  const eligibleList = rawRequests.filter(
    (r) => r.category === selectionModal.category && isPendingStatus(r.status)
  );
  const allSelected = eligibleList.length > 0 && selectedRequestIds.length === eligibleList.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(eligibleList.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedRequestIds.includes(id)) {
      setSelectedRequestIds(selectedRequestIds.filter((item) => item !== id));
    } else {
      setSelectedRequestIds([...selectedRequestIds, id]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {selectionModal.mode === 'approve' ? (
                <CheckCircle2 size={20} color={colors.emerald} />
              ) : (
                <Ban size={20} color={colors.danger} />
              )}
              <View>
                <Text style={styles.headerTitle}>
                  {selectionModal.mode === 'approve' ? 'Approve Requests' : 'Reject Requests'}
                </Text>
                <Text style={styles.headerSub}>
                  {selectionModal.category} • {eligibleList.length} pending
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Select All Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllRow}>
              <View style={[styles.checkbox, allSelected && styles.checkboxChecked]}>
                {allSelected && <Check size={12} color="#FFF" />}
              </View>
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {selectedRequestIds.length} of {eligibleList.length} selected
              </Text>
            </View>
          </View>

          {/* List */}
          <ScrollView style={styles.list} contentContainerStyle={{ padding: 12, gap: 8 }}>
            {eligibleList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No pending requests available in this category.</Text>
              </View>
            ) : (
              eligibleList.map((stmt) => {
                const isSelected = selectedRequestIds.includes(stmt.id);
                const reqCode = stmt.request_code || `REQ-${String(stmt.id).padStart(4, '0')}`;

                return (
                  <TouchableOpacity
                    key={stmt.id}
                    onPress={() => toggleSelectOne(stmt.id)}
                    style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.itemCodeRow}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                          {isSelected && <Check size={12} color="#FFF" />}
                        </View>
                        <Text style={styles.itemCode}>{reqCode}</Text>
                      </View>
                      <Text style={styles.itemDate}>
                        {new Date(stmt.created_at || Date.now()).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    <Text numberOfLines={2} style={styles.itemText}>
                      "{stmt.problem_text || stmt.text || 'Citizen submission'}"
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onProceedToConfirm}
              disabled={selectedRequestIds.length === 0}
              style={[
                styles.proceedBtn,
                selectedRequestIds.length === 0 && styles.proceedBtnDisabled,
                selectionModal.mode === 'approve' ? { backgroundColor: '#065F46' } : { backgroundColor: '#BE123C' }
              ]}
            >
              <Text style={styles.proceedText}>
                Proceed ({selectedRequestIds.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  card: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B'
  },
  closeBtn: {
    padding: 4
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  countBadge: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  list: {
    flex: 1
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B'
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  itemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF'
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  itemCode: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary
  },
  itemDate: {
    fontSize: 10,
    color: '#94A3B8'
  },
  itemText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9'
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  proceedBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10
  },
  proceedBtnDisabled: {
    backgroundColor: '#94A3B8'
  },
  proceedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF'
  }
});
