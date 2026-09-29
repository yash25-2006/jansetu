import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function ComplaintNoPhotoWarningModal({
  isOpen,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.headerTitle}>No Photo Evidence Attached</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.bodyText}>
              Civic complaints submitted with verified photo evidence receive higher priority and immediate assignment by Municipal Ward Officers.
            </Text>
            <Text style={styles.subText}>
              Are you sure you want to proceed without attaching a camera photo?
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>📷 Add Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Proceed Anyway</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F59E0B'
  },
  header: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  warningIcon: {
    fontSize: 20
  },
  headerTitle: {
    color: '#92400E',
    fontWeight: '900',
    fontSize: 15
  },
  body: {
    padding: 18,
    gap: 10
  },
  bodyText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18
  },
  subText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  confirmBtnText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 12
  }
});
