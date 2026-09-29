import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { CheckCircle2, AlertTriangle, CheckCheck, X, AlertCircle } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function WardConfirmationModal({
  visible,
  confirmationModal,
  wardName = 'Ward',
  rejectionReasonInput,
  setRejectionReasonInput,
  actionError,
  isSubmittingAction,
  onClose,
  onConfirm
}) {
  if (!confirmationModal) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {confirmationModal.mode === 'approve' && <CheckCircle2 size={20} color={colors.emerald} />}
              {confirmationModal.mode === 'reject' && <AlertTriangle size={20} color={colors.danger} />}
              {confirmationModal.mode === 'complete' && <CheckCheck size={20} color={colors.emerald} />}
              <Text style={styles.headerTitle}>
                {confirmationModal.mode === 'approve' && 'Confirm Approval'}
                {confirmationModal.mode === 'reject' && 'Rejection Reason'}
                {confirmationModal.mode === 'complete' && 'Mark Category Completed'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {confirmationModal.mode === 'approve' && (
              <View style={styles.textGroup}>
                <Text style={styles.mainText}>
                  Approve <Text style={styles.boldEmerald}>{confirmationModal.count}</Text> selected{' '}
                  <Text style={styles.boldPrimary}>{confirmationModal.category}</Text> request(s)?
                </Text>
                <Text style={styles.subText}>
                  This will advance only the selected requests to the Approved stage in {wardName}.
                </Text>
              </View>
            )}

            {confirmationModal.mode === 'complete' && (
              <View style={styles.textGroup}>
                <Text style={styles.mainText}>
                  Mark all <Text style={styles.boldEmerald}>{confirmationModal.count}</Text> approved request(s) in{' '}
                  <Text style={styles.boldPrimary}>{confirmationModal.category}</Text> as{' '}
                  <Text style={styles.boldEmerald}>Completed</Text>?
                </Text>
                <Text style={styles.subText}>
                  This will record the completion timestamp and mark the civic works in this sector as fulfilled.
                </Text>
              </View>
            )}

            {confirmationModal.mode === 'reject' && (
              <View style={styles.textGroup}>
                <Text style={styles.mainText}>
                  You are rejecting <Text style={styles.boldDanger}>{confirmationModal.count}</Text> selected request(s) in{' '}
                  <Text style={styles.boldPrimary}>{confirmationModal.category}</Text>.
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Reason for Rejection *</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={3}
                    value={rejectionReasonInput}
                    onChangeText={setRejectionReasonInput}
                    placeholder="e.g. Covered under ongoing municipal road tender / duplicate request"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            )}

            {actionError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color={colors.danger} />
                <Text style={styles.errorText}>{actionError}</Text>
              </View>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmittingAction}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isSubmittingAction}
              style={[
                styles.confirmBtn,
                confirmationModal.mode === 'approve' && { backgroundColor: '#065F46' },
                confirmationModal.mode === 'reject' && { backgroundColor: '#BE123C' },
                confirmationModal.mode === 'complete' && { backgroundColor: colors.emerald }
              ]}
            >
              {isSubmittingAction ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.confirmText}>
                  {confirmationModal.mode === 'approve' && 'Confirm Approval'}
                  {confirmationModal.mode === 'reject' && 'Confirm Rejection'}
                  {confirmationModal.mode === 'complete' && 'Mark Completed'}
                </Text>
              )}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    gap: 8
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary
  },
  closeBtn: {
    padding: 4
  },
  body: {
    padding: 16,
    gap: 12
  },
  textGroup: {
    gap: 8
  },
  mainText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19
  },
  subText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16
  },
  boldEmerald: {
    fontWeight: '800',
    color: '#065F46'
  },
  boldDanger: {
    fontWeight: '800',
    color: colors.danger
  },
  boldPrimary: {
    fontWeight: '800',
    color: colors.primary
  },
  fieldGroup: {
    gap: 6,
    marginTop: 4
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase'
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    color: colors.danger
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  confirmText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF'
  }
});
