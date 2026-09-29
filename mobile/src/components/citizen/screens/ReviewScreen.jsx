import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import {
  Send,
  Edit3,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  MapPin,
  ShieldAlert,
  CameraOff
} from 'lucide-react-native';
import { TRANSLATIONS } from '../../../constants/translations';
import { colors } from '../../../theme/colors';

export default function ReviewScreen({
  language,
  draftRequest,
  citizenProfile,
  onEdit,
  onConfirmSend,
  isSubmitting,
  submissionError
}) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [editedText, setEditedText] = useState(draftRequest?.text || '');
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState(draftRequest?.photo || null);

  const reqType = draftRequest?.requestType || 'demand';
  const isPhotoException = Boolean(draftRequest?.photoException);

  const handleSend = () => {
    onConfirmSend({
      ...draftRequest,
      text: editedText,
      photo: attachedPhoto
    });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.reviewTitle}</Text>
        <Text style={styles.headerSubtitle}>{t.reviewSubtitle}</Text>
      </View>

      <View style={styles.body}>
        {/* Type & Profile Banner */}
        <View style={styles.bannerRow}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeLabel}>{t.requestTypeLabel || 'Request Type:'}</Text>
            <View
              style={[
                styles.typeBadge,
                reqType === 'complaint' ? styles.typeBadgeComplaint : styles.typeBadgeDemand
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {reqType === 'complaint'
                  ? `⚠️ ${t.complaintLabel || 'Complaint'}`
                  : `🏗️ ${t.demandLabel || 'Demand'}`}
              </Text>
            </View>
          </View>

          <Text style={styles.citizenName}>{citizenProfile?.name || 'Verified Citizen'}</Text>
        </View>

        {/* User Message Box */}
        <View style={styles.messageBox}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageLabel}>{t.yourMessageLabel}</Text>
            <TouchableOpacity
              onPress={() => setIsEditingInline(!isEditingInline)}
              style={styles.editBtn}
            >
              <Edit3 size={14} color="#2563EB" />
              <Text style={styles.editText}>{isEditingInline ? 'Save' : t.editBtn}</Text>
            </TouchableOpacity>
          </View>

          {isEditingInline ? (
            <TextInput
              style={styles.textInputArea}
              multiline
              numberOfLines={4}
              value={editedText}
              onChangeText={setEditedText}
            />
          ) : (
            <View style={styles.textDisplayArea}>
              <Text style={styles.messageContent}>"{editedText}"</Text>
            </View>
          )}
        </View>

        {/* Attached Photo Preview */}
        {attachedPhoto ? (
          <View style={styles.photoBox}>
            <View style={styles.photoHeader}>
              <View style={styles.photoHeaderLeft}>
                <CheckCircle2 size={16} color={colors.emerald} />
                <Text style={styles.photoTitle}>{t.attachedPhoto || 'Attached Photo'}</Text>
              </View>
              <TouchableOpacity onPress={() => setAttachedPhoto(null)}>
                <Text style={styles.removePhotoText}>{t.removePhotoBtn || 'Remove Photo'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photoContentRow}>
              <Image
                source={{ uri: attachedPhoto.uri || attachedPhoto.data || attachedPhoto.dataUrl }}
                style={styles.photoPreview}
              />
              <View style={styles.photoMeta}>
                <Text numberOfLines={1} style={styles.photoName}>
                  {attachedPhoto.name || 'photo.jpg'}
                </Text>
                {attachedPhoto.locationCaptured ? (
                  <View style={styles.geoBox}>
                    <View style={styles.geoLabelRow}>
                      <MapPin size={12} color={colors.emerald} />
                      <Text style={styles.geoLabel}>{t.geoTaggedLocationCaptured || 'Geo-tagged'}:</Text>
                    </View>
                    <Text numberOfLines={2} style={styles.geoAddress}>
                      📍 {attachedPhoto.photoLocation?.address || attachedPhoto.photoAddress || draftRequest?.location?.address || citizenProfile?.address || 'Verified Location'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noGeoRow}>
                    <AlertCircle size={12} color="#D97706" />
                    <Text style={styles.noGeoText}>⚠️ {t.noLocationAttached || 'No GPS'}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : isPhotoException ? (
          <View style={styles.exceptionBox}>
            <View style={styles.exceptionHeader}>
              <ShieldAlert size={16} color="#B45309" />
              <Text style={styles.exceptionTitle}>{t.noPhotoExceptionBadge || '⚠️ No Photo — Citizen Exception'}</Text>
            </View>
            <Text style={styles.exceptionText}>
              {t.complaintVerifyVisitNote || 'Note: An authorized officer may visit your location to verify this complaint.'}
            </Text>
          </View>
        ) : (
          <View style={styles.noPhotoBox}>
            <View style={styles.noPhotoLeft}>
              <CameraOff size={16} color="#94A3B8" />
              <Text style={styles.noPhotoText}>{t.noPhotoAttached || 'No photo attached.'}</Text>
            </View>
            <Text style={styles.noPhotoNote}>{reqType === 'demand' ? 'Optional for Demand' : 'Standard'}</Text>
          </View>
        )}

        {/* Problem Location (for complaints) */}
        {reqType === 'complaint' && draftRequest?.problemLocation && (
          <View style={styles.problemLocationBox}>
            <View style={styles.problemLocationHeader}>
              <View style={styles.problemLocLeft}>
                <MapPin size={14} color="#E11D48" />
                <Text style={styles.problemLocTitle}>{t.problemLocationLabel || 'Problem Location'}:</Text>
              </View>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText}>
                  {draftRequest.problemLocation.source === 'map_selected'
                    ? `🗺️ ${t.sourceMapSelected || 'Marked on Map'}`
                    : `📍 ${t.sourceCurrentLocation || 'Current GPS'}`}
                </Text>
              </View>
            </View>
            <Text style={styles.problemAddress}>📍 {draftRequest.problemLocation.address}</Text>
          </View>
        )}

        {/* Citizen Location Preview */}
        <View style={styles.citizenLocationBox}>
          <MapPin size={14} color={colors.saffron} />
          <View style={{ flex: 1 }}>
            <Text style={styles.citLocLabel}>
              {reqType === 'complaint' ? 'Citizen Location:' : 'Registered Location:'}
            </Text>
            <Text style={styles.citLocAddress}>
              {draftRequest?.location?.address || citizenProfile?.address || 'Location Identified'}
            </Text>
          </View>
        </View>

        {/* Error Alert */}
        {submissionError ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={colors.danger} />
            <Text style={styles.errorText}>{submissionError}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={onEdit}
            disabled={isSubmitting}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <ArrowLeft size={16} color="#334155" />
            <Text style={styles.backBtnText}>{t.editBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSend}
            disabled={isSubmitting || !editedText.trim()}
            style={[
              styles.sendBtn,
              (isSubmitting || !editedText.trim()) && styles.sendBtnDisabled
            ]}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.sendBtnText}>{t.confirmSendBtn}</Text>
                <Send size={16} color={colors.saffron} />
              </>
            )}
          </TouchableOpacity>
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
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center'
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
    gap: 14
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  typeBadgeDemand: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  typeBadgeComplaint: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B'
  },
  citizenName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  messageBox: {
    gap: 6
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase'
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB'
  },
  textInputArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  textDisplayArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12
  },
  messageContent: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    fontWeight: '500'
  },
  photoBox: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  photoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  photoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  removePhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger
  },
  photoContentRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  photoPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  photoMeta: {
    flex: 1,
    gap: 4
  },
  photoName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  geoBox: {
    gap: 2
  },
  geoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  geoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald
  },
  geoAddress: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 14
  },
  noGeoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  noGeoText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600'
  },
  exceptionBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
    gap: 4
  },
  exceptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  exceptionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  exceptionText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15
  },
  noPhotoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10
  },
  noPhotoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  noPhotoText: {
    fontSize: 11,
    color: '#64748B'
  },
  noPhotoNote: {
    fontSize: 10,
    color: '#94A3B8'
  },
  problemLocationBox: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    padding: 10,
    gap: 4
  },
  problemLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  problemLocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  problemLocTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9F1239'
  },
  sourceBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B21A8'
  },
  problemAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16
  },
  citizenLocationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 10
  },
  citLocLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF'
  },
  citLocAddress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  sendBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8'
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF'
  }
});
