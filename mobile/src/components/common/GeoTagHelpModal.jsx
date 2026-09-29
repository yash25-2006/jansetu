import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function GeoTagHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📍 Camera Geo-Tagging Guidelines</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>1️⃣</Text>
              <Text style={styles.tipText}>
                Live camera capture automatically attaches verified GPS coordinates ($\pm$ accuracy).
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>2️⃣</Text>
              <Text style={styles.tipText}>
                Ensure location permissions are enabled for accurate ward delimitation.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>3️⃣</Text>
              <Text style={styles.tipText}>
                Take clear, well-lit photos directly showing the civic infrastructure breakdown or requirement.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.btn}>
              <Text style={styles.btnText}>Understood</Text>
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
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden'
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  closeBtn: {
    padding: 4
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  body: {
    padding: 18,
    gap: 12
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  tipIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13
  }
});
