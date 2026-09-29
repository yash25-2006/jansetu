import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { CheckCircle, ArrowRight, Edit3, ShieldCheck } from 'lucide-react-native';
import { TRANSLATIONS } from '../../../constants/translations';
import { colors } from '../../../theme/colors';

export default function ConfirmDetailsScreen({ language, citizenProfile, onConfirmDetails }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: citizenProfile?.name || '',
    mobile: citizenProfile?.mobile || '',
    address: citizenProfile?.address || '',
    district: citizenProfile?.district || '',
    state: citizenProfile?.state || '',
    maskedAadhaar: citizenProfile?.maskedAadhaar || 'XXXX XXXX 0123'
  });

  const handleConfirm = () => {
    onConfirmDetails({
      ...citizenProfile,
      ...profileData
    });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <CheckCircle size={24} color={colors.emerald} />
        </View>
        <Text style={styles.headerTitle}>{t.confirmDetailsTitle}</Text>
        <Text style={styles.headerSubtitle}>{t.confirmDetailsSubtitle}</Text>
      </View>

      <View style={styles.body}>
        {/* Verification Success Pill */}
        <View style={styles.verifiedPill}>
          <View style={styles.verifiedLeft}>
            <ShieldCheck size={16} color={colors.emerald} />
            <Text style={styles.verifiedText}>{t.verifiedCitizen}</Text>
          </View>
          <Text style={styles.aadhaarText}>{profileData.maskedAadhaar}</Text>
        </View>

        {/* Profile Details List */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.nameLabel}</Text>
            <Text style={styles.detailValue}>{profileData.name || 'Citizen'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.mobileLabel}</Text>
            <Text style={styles.detailValue}>{profileData.mobile || '—'}</Text>
          </View>

          <View style={styles.addressBlock}>
            <Text style={styles.detailLabel}>{t.addressLabel}</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={profileData.address}
                onChangeText={(val) => setProfileData({ ...profileData, address: val })}
              />
            ) : (
              <Text style={styles.detailValueBlock}>{profileData.address || '—'}</Text>
            )}
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>{t.districtLabel}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={profileData.district}
                  onChangeText={(val) => setProfileData({ ...profileData, district: val })}
                />
              ) : (
                <Text style={styles.detailValue}>{profileData.district || '—'}</Text>
              )}
            </View>

            <View style={styles.col}>
              <Text style={styles.detailLabel}>{t.stateLabel}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={profileData.state}
                  onChangeText={(val) => setProfileData({ ...profileData, state: val })}
                />
              ) : (
                <Text style={styles.detailValue}>{profileData.state || '—'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Toggle Edit Details */}
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editToggleBtn}
          activeOpacity={0.8}
        >
          <Edit3 size={14} color="#2563EB" />
          <Text style={styles.editToggleText}>
            {isEditing ? 'Save Changes' : t.editDetails}
          </Text>
        </TouchableOpacity>

        {/* Confirm Action Button */}
        <TouchableOpacity
          onPress={handleConfirm}
          style={styles.confirmBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmBtnText}>{t.confirmAndContinueBtn}</Text>
          <ArrowRight size={16} color={colors.saffron} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
    textAlign: 'center'
  },
  body: {
    padding: 20,
    gap: 16
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  verifiedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46'
  },
  aadhaarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857'
  },
  detailsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  addressBlock: {
    padding: 12,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  detailValueBlock: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18
  },
  editInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#0F172A'
  },
  twoColRow: {
    flexDirection: 'row',
    divideColor: '#E2E8F0'
  },
  col: {
    flex: 1,
    padding: 12,
    gap: 4
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB'
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
