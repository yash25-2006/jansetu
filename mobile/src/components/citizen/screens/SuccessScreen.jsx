import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import {
  CheckCircle2,
  PlusCircle,
  ListFilter,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react-native';
import { TRANSLATIONS } from '../../../constants/translations';
import { colors } from '../../../theme/colors';

export default function SuccessScreen({
  language,
  submissionResult,
  onReportAnother,
  onViewMyRequests
}) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const reqData = submissionResult?.data || submissionResult?.request || {};
  const requestCode = submissionResult?.requestId || reqData?.request_code || 'REQ-0001';
  const reqType = (submissionResult?.request_type || reqData?.request_type || 'demand').toLowerCase();
  const isPhotoAttached = Boolean(submissionResult?.photoAttached || reqData?.photo_url);
  const isPhotoException = Boolean(submissionResult?.photo_exception || reqData?.photo_exception);

  return (
    <View style={styles.card}>
      {/* Official Success Banner */}
      <View style={styles.banner}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={36} color="#FFF" />
        </View>
        <Text style={styles.bannerTitle}>{t.successTitle}</Text>
      </View>

      <View style={styles.body}>
        {/* Request ID Display Card */}
        <View style={styles.codeCard}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.typeBadge,
                reqType === 'complaint' ? styles.typeBadgeComplaint : styles.typeBadgeDemand
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {reqType === 'complaint'
                  ? (t.complaintBadge || '⚠️ Complaint')
                  : (t.demandBadge || '🏗️ Demand')}
              </Text>
            </View>
          </View>

          <Text style={styles.codeLabel}>{t.requestIdLabel}</Text>
          <Text style={styles.codeValue}>{requestCode}</Text>
          <Text style={styles.codeSub}>विकास नियोजन प्रणालीमध्ये सुरक्षितपणे नोंदवले</Text>

          {isPhotoAttached ? (
            <View style={styles.photoStatusRow}>
              <CheckCircle2 size={14} color={colors.emerald} />
              <Text style={styles.photoStatusText}>
                {t.photoAttachedSuccess || 'Photo attached successfully'}
              </Text>
            </View>
          ) : isPhotoException ? (
            <View style={styles.photoExceptionRow}>
              <ShieldAlert size={14} color="#D97706" />
              <Text style={styles.photoExceptionText}>
                {t.noPhotoExceptionBadge || '⚠️ No Photo — Citizen Exception'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Civic Acknowledgement Note */}
        <Text style={styles.thankYouText}>{t.thankYouMessage}</Text>

        {/* Verification Visit Notice */}
        {reqType === 'complaint' && !isPhotoAttached && (
          <View style={styles.noticeBox}>
            <View style={styles.noticeTitleRow}>
              <ShieldAlert size={14} color="#B45309" />
              <Text style={styles.noticeTitle}>स्थान पडताळणी सूचना (Verification Notice):</Text>
            </View>
            <Text style={styles.noticeBody}>
              {t.complaintVerifyVisitNote ||
                'Note: An authorized officer may visit your location to verify this complaint.'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onReportAnother}
            activeOpacity={0.8}
          >
            <PlusCircle size={16} color={colors.saffron} />
            <Text style={styles.primaryBtnText}>{t.reportAnotherBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onViewMyRequests}
            activeOpacity={0.8}
          >
            <ListFilter size={16} color="#334155" />
            <Text style={styles.secondaryBtnText}>{t.viewMyRequestsBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* Trust badge */}
        <View style={styles.trustRow}>
          <ShieldCheck size={14} color={colors.emerald} />
          <Text style={styles.trustText}>भारत विकास संवाद • अधिकृत नागरिक पोर्टल</Text>
        </View>
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
  banner: {
    backgroundColor: colors.primary,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center'
  },
  body: {
    padding: 20,
    gap: 16,
    alignItems: 'center'
  },
  codeCard: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6
  },
  badgeRow: {
    marginBottom: 4
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  typeBadgeDemand: {
    backgroundColor: '#DBEAFE'
  },
  typeBadgeComplaint: {
    backgroundColor: '#FEE2E2'
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B'
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase'
  },
  codeValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2
  },
  codeSub: {
    fontSize: 11,
    color: '#1D4ED8',
    textAlign: 'center'
  },
  photoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
    paddingTop: 8,
    marginTop: 4
  },
  photoStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emerald
  },
  photoExceptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
    paddingTop: 8,
    marginTop: 4
  },
  photoExceptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309'
  },
  thankYouText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19
  },
  noticeBox: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
    gap: 4
  },
  noticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  noticeBody: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15
  },
  actionGroup: {
    width: '100%',
    gap: 10,
    marginTop: 4
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  secondaryBtnText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700'
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  trustText: {
    fontSize: 11,
    color: '#94A3B8'
  }
});
