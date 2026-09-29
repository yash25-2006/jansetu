import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { INDIAN_LANGUAGES } from '../../config/languages';
import { COLORS } from '../../theme/colors';

export default function BrowseMoreLanguagesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const activeLanguages = INDIAN_LANGUAGES.filter((l) => l.status === 'active');
  const pendingLanguages = INDIAN_LANGUAGES.filter((l) => l.status === 'pending_cloud');

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Indian Languages Support</Text>
              <Text style={styles.headerSubtitle}>Multi-dialect Linguistic Architecture</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Active Supported Languages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                ✓ CURRENTLY ACTIVE & SUPPORTED ({activeLanguages.length})
              </Text>
              <View style={styles.grid}>
                {activeLanguages.map((lang) => (
                  <View key={lang.code} style={styles.activeLangCard}>
                    <Text style={styles.langName}>{lang.name}</Text>
                    <Text style={styles.langNative}>{lang.nativeName}</Text>
                    <Text style={styles.activeBadge}>Fully Integrated</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Google Cloud Architecture Notice */}
            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>
                Google Cloud Language Services Not Connected
              </Text>
              <Text style={styles.noticeText}>
                Additional languages will be available after Google Cloud Speech-to-Text, Text-to-Speech, Translation, and Dialogflow services are connected.
              </Text>
            </View>

            {/* Upcoming Languages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitlePending}>
                UPCOMING CLOUD-INTEGRATED LANGUAGES ({pendingLanguages.length})
              </Text>
              <View style={styles.grid}>
                {pendingLanguages.map((lang) => (
                  <View key={lang.code} style={styles.pendingLangCard}>
                    <Text style={styles.pendingLangName}>{lang.name}</Text>
                    <Text style={styles.pendingLangNative}>{lang.nativeName}</Text>
                    <Text style={styles.pendingBadge}>Pending Cloud Integration</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Close</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%'
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 18,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  body: {
    flexGrow: 1
  },
  bodyContent: {
    padding: 18
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.accentGreenDark,
    marginBottom: 8,
    letterSpacing: 0.5
  },
  sectionTitlePending: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  activeLangCard: {
    flexBasis: '48%',
    backgroundColor: COLORS.accentGreenLight,
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10
  },
  langName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  langNative: {
    fontSize: 12,
    color: COLORS.accentGreenDark,
    marginVertical: 2
  },
  activeBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.accentGreenDark
  },
  noticeBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4
  },
  noticeText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16
  },
  pendingLangCard: {
    flexBasis: '48%',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10
  },
  pendingLangName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  pendingLangNative: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginVertical: 2
  },
  pendingBadge: {
    fontSize: 9,
    color: COLORS.textMuted
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#F8FAFC'
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13
  }
});
