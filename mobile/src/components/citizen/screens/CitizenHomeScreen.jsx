import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native';
import {
  Mic,
  Send,
  MapPin,
  RefreshCw,
  Camera,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Navigation,
  HelpCircle,
  AlertCircle
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { TRANSLATIONS } from '../../../constants/translations';
import NativeCameraModal from '../../common/NativeCameraModal';
import NativeMapPickerModal from '../../common/NativeMapPickerModal';
import NativeAudioRecorder from '../../common/NativeAudioRecorder';
import GeoTagHelpModal from '../../common/GeoTagHelpModal';
import ComplaintNoPhotoWarningModal from '../../common/ComplaintNoPhotoWarningModal';
import { reverseGeocodeCoords } from '../../../utils/reverseGeocoder';
import { fetchCitizenCooldownStatus } from '../../../services/api';
import { colors } from '../../../theme/colors';

export default function CitizenHomeScreen({
  language,
  citizenProfile,
  startupLocationCoords = null,
  onProceedToReview,
  onOpenMyRequests
}) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Request Type Toggle ('demand' | 'complaint') - Default: demand
  const [requestType, setRequestType] = useState('demand');
  const [problemText, setProblemText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Location State
  const [gpsCoords, setGpsCoords] = useState(
    startupLocationCoords
      ? { latitude: startupLocationCoords.latitude, longitude: startupLocationCoords.longitude }
      : citizenProfile?.coordinates?.latitude && citizenProfile?.coordinates?.longitude
      ? { latitude: citizenProfile.coordinates.latitude, longitude: citizenProfile.coordinates.longitude }
      : { latitude: 20.5937, longitude: 78.9629 }
  );
  const [locationAccuracy, setLocationAccuracy] = useState(startupLocationCoords?.accuracy || 15);
  const [locationCapturedAt, setLocationCapturedAt] = useState(new Date().toISOString());
  const [humanReadableAddress, setHumanReadableAddress] = useState(
    citizenProfile?.address || 'Location Identified'
  );
  const [isLocating, setIsLocating] = useState(false);

  // Problem Location (Complaint Specific)
  const [problemLocation, setProblemLocation] = useState(null);
  const [isProblemMapModalOpen, setIsProblemMapModalOpen] = useState(false);
  const [isSettingProblemLocation, setIsSettingProblemLocation] = useState(false);

  // Photo & Modals
  const [attachedPhoto, setAttachedPhoto] = useState(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Complaint No-Photo Exception State
  const [noPhotoExceptionChecked, setNoPhotoExceptionChecked] = useState(false);
  const [noPhotoExceptionAcknowledged, setNoPhotoExceptionAcknowledged] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // Cooldown status
  const [cooldownData, setCooldownData] = useState(null);

  useEffect(() => {
    if (!citizenProfile?.citizenId) return;
    fetchCitizenCooldownStatus(citizenProfile.citizenId)
      .then((data) => setCooldownData(data))
      .catch((err) => console.warn('Cooldown notice:', err.message));
  }, [citizenProfile?.citizenId]);

  // Fetch Current Location
  const fetchCurrentLocation = async (isManualRefresh = false) => {
    setIsLocating(true);
    setErrorMessage('');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const fallback = await reverseGeocodeCoords(
          gpsCoords?.latitude || 20.5937,
          gpsCoords?.longitude || 78.9629,
          citizenProfile
        );
        setHumanReadableAddress(fallback.address || citizenProfile?.address || 'Location Identified');
        if (isManualRefresh) {
          setErrorMessage(t.locationDeniedNotice || 'Location access not permitted. Using registered address.');
        }
        setIsLocating(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = parseFloat(pos.coords.latitude.toFixed(6));
      const lng = parseFloat(pos.coords.longitude.toFixed(6));
      const acc = Math.round(pos.coords.accuracy || 15);
      const nowIso = new Date().toISOString();

      setGpsCoords({ latitude: lat, longitude: lng });
      setLocationAccuracy(acc);
      setLocationCapturedAt(nowIso);

      const geoResult = await reverseGeocodeCoords(lat, lng, citizenProfile);
      setHumanReadableAddress(geoResult.address);
    } catch (err) {
      console.warn('Location fetch err:', err);
      const fallback = await reverseGeocodeCoords(
        gpsCoords?.latitude || 20.5937,
        gpsCoords?.longitude || 78.9629,
        citizenProfile
      );
      setHumanReadableAddress(fallback.address || citizenProfile?.address || 'Location Identified');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation(false);
  }, [citizenProfile]);

  // Handle Camera Return
  const handleCameraCaptureComplete = (photoPayload) => {
    setErrorMessage('');
    setAttachedPhoto(photoPayload);

    if (photoPayload?.photoLocation?.address && photoPayload.photoLocation.address !== 'Address temporarily unavailable') {
      setHumanReadableAddress(photoPayload.photoLocation.address);
    }
    if (photoPayload?.photoLocation?.latitude && photoPayload?.photoLocation?.longitude) {
      setGpsCoords({
        latitude: photoPayload.photoLocation.latitude,
        longitude: photoPayload.photoLocation.longitude
      });
      setLocationAccuracy(photoPayload.photoLocation.accuracy || 10);
    }

    setNoPhotoExceptionChecked(false);
    setNoPhotoExceptionAcknowledged(false);
  };

  // Complaint Current GPS Location as Problem Location
  const handleUseCurrentLocationAsProblemLocation = async () => {
    setIsSettingProblemLocation(true);
    setErrorMessage('');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy || 15);
        const geoResult = await reverseGeocodeCoords(lat, lng, citizenProfile);

        setProblemLocation({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          address: geoResult.address || humanReadableAddress || 'Current Location',
          source: 'current_location'
        });
      } else {
        const fallbackLat = gpsCoords?.latitude || 18.5158;
        const fallbackLng = gpsCoords?.longitude || 73.7711;
        const geoResult = await reverseGeocodeCoords(fallbackLat, fallbackLng, citizenProfile);
        setProblemLocation({
          latitude: fallbackLat,
          longitude: fallbackLng,
          accuracy: 15,
          address: geoResult.address || humanReadableAddress || 'Current Location',
          source: 'current_location'
        });
      }
    } catch (err) {
      console.warn('Problem loc err:', err);
    } finally {
      setIsSettingProblemLocation(false);
    }
  };

  const handleAudioTranscript = (transcriptText) => {
    setProblemText((prev) => (prev ? `${prev} ${transcriptText.trim()}` : transcriptText.trim()));
  };

  const handleSubmitToReview = () => {
    setErrorMessage('');
    const trimmed = problemText.trim();
    if (!trimmed) {
      setErrorMessage(t.emptyRequestError || 'Please describe your request.');
      return;
    }

    if (!humanReadableAddress) {
      setErrorMessage(t.locationRequired || 'Location is required to submit a request.');
      return;
    }

    if (requestType === 'complaint') {
      if (!problemLocation || !problemLocation.address) {
        setErrorMessage(
          t.problemLocationRequiredError ||
          'Please specify where the problem occurred (Use Current Location or Mark on Map).'
        );
        return;
      }

      if (!attachedPhoto && (!noPhotoExceptionChecked || !noPhotoExceptionAcknowledged)) {
        setErrorMessage(
          t.complaintPhotoRequiredError ||
          'A photo is required for complaints, or you must acknowledge submitting without photographic evidence.'
        );
        return;
      }
    }

    onProceedToReview({
      requestType,
      text: trimmed,
      inputType: 'text',
      problemLocation: requestType === 'complaint' ? problemLocation : null,
      photo: attachedPhoto
        ? {
            uri: attachedPhoto.uri,
            data: attachedPhoto.data || attachedPhoto.uri,
            name: attachedPhoto.name,
            size: attachedPhoto.size,
            type: attachedPhoto.type,
            source: attachedPhoto.source || 'camera',
            locationCaptured: attachedPhoto.locationCaptured || false,
            photoLocation: attachedPhoto.photoLocation || null,
            capturedAtFormatted: attachedPhoto.capturedAtFormatted
          }
        : null,
      photoException: Boolean(noPhotoExceptionChecked && noPhotoExceptionAcknowledged),
      photoExceptionAcknowledged: Boolean(noPhotoExceptionAcknowledged),
      location: {
        latitude: gpsCoords?.latitude || citizenProfile?.coordinates?.latitude || 20.5937,
        longitude: gpsCoords?.longitude || citizenProfile?.coordinates?.longitude || 78.9629,
        accuracy: locationAccuracy || 15,
        capturedAt: locationCapturedAt || new Date().toISOString(),
        district: citizenProfile?.district || '',
        state: citizenProfile?.state || '',
        address: humanReadableAddress || citizenProfile?.address || 'Location Identified'
      }
    });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <ShieldCheck size={20} color={colors.saffron} />
          </View>
          <View>
            <Text style={styles.greetingText}>
              {t.namaste}, {citizenProfile?.name || t.verifiedCitizen}
            </Text>
            <Text style={styles.appNameText}>{t.appName}</Text>
          </View>
        </View>

        {onOpenMyRequests && (
          <TouchableOpacity onPress={onOpenMyRequests} style={styles.historyBtn}>
            <Clock size={14} color="#FDE68A" />
            <Text style={styles.historyBtnText}>{t.viewMyRequestsBtn || 'My Requests'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cooldown Alert Banner if active */}
      {cooldownData?.inCooldown && (
        <View style={styles.cooldownBanner}>
          <Clock size={16} color="#92400E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cooldownTitle}>Submission Notice</Text>
            <Text style={styles.cooldownSubtitle}>
              You submitted recently. Submissions are processed with civic priority.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.body}>
        {/* Toggle Demand vs Complaint */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setRequestType('demand')}
            style={[styles.toggleBtn, requestType === 'demand' && styles.toggleBtnDemandActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleBtnText, requestType === 'demand' && styles.toggleBtnTextActive]}>
              🏗️ {t.demandLabel || 'Demand (New Work)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRequestType('complaint')}
            style={[styles.toggleBtn, requestType === 'complaint' && styles.toggleBtnComplaintActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleBtnText, requestType === 'complaint' && styles.toggleBtnTextActive]}>
              ⚠️ {t.complaintLabel || 'Complaint (Fix Issue)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Audio Recorder Trigger */}
        <NativeAudioRecorder language={language} onTranscript={handleAudioTranscript} />

        {/* Text Input Box */}
        <View style={styles.inputBox}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>
              {requestType === 'complaint'
                ? (t.complaintInputLabel || 'Describe the issue or grievance:')
                : (t.demandInputLabel || 'Describe the development requirement:')}
            </Text>
            <Text style={styles.charCount}>{problemText.length} chars</Text>
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder={
              requestType === 'complaint'
                ? (t.complaintPlaceholder || 'Explain the problem (e.g. Broken road near market, pothole depth...)')
                : (t.demandPlaceholder || 'Explain what is needed (e.g. Need primary health clinic or street lights...)')
            }
            placeholderTextColor="#94A3B8"
            value={problemText}
            onChangeText={setProblemText}
          />
        </View>

        {/* Problem Location Picker for Complaints */}
        {requestType === 'complaint' && (
          <View style={styles.problemLocationCard}>
            <View style={styles.problemLocHeader}>
              <View style={styles.problemLocTitleRow}>
                <MapPin size={16} color="#E11D48" />
                <Text style={styles.problemLocTitle}>
                  {t.problemLocationLabel || 'Problem Location'} (Compulsory)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsHelpModalOpen(true)}>
                <HelpCircle size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {problemLocation ? (
              <View style={styles.selectedProbLoc}>
                <Text style={styles.selectedProbLocAddress}>📍 {problemLocation.address}</Text>
                <View style={styles.probLocMeta}>
                  <Text style={styles.probLocSource}>
                    {problemLocation.source === 'map_selected' ? '🗺️ Marked on Map' : '📍 Current GPS'}
                  </Text>
                  <TouchableOpacity onPress={() => setProblemLocation(null)}>
                    <Text style={styles.changeProbLocText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.probLocButtonsRow}>
                <TouchableOpacity
                  onPress={handleUseCurrentLocationAsProblemLocation}
                  disabled={isSettingProblemLocation}
                  style={styles.probLocBtn}
                  activeOpacity={0.8}
                >
                  <Navigation size={14} color="#1E293B" />
                  <Text style={styles.probLocBtnText}>
                    {isSettingProblemLocation ? 'Locating...' : 'Use Current GPS'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsProblemMapModalOpen(true)}
                  style={[styles.probLocBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                  activeOpacity={0.8}
                >
                  <MapPin size={14} color="#2563EB" />
                  <Text style={[styles.probLocBtnText, { color: '#1E40AF' }]}>
                    Mark on Map 🗺️
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Photo Capture Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoHeader}>
            <View style={styles.photoHeaderLeft}>
              <Camera size={16} color={colors.primary} />
              <Text style={styles.photoSectionTitle}>
                {requestType === 'complaint'
                  ? `${t.attachPhotoLabel || 'Grievance Photo'} (Required)`
                  : `${t.attachPhotoLabel || 'Site Photo'} (Optional)`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsHelpModalOpen(true)}>
              <HelpCircle size={15} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {attachedPhoto ? (
            <View style={styles.photoPreviewCard}>
              <Image
                source={{ uri: attachedPhoto.uri || attachedPhoto.data }}
                style={styles.photoThumb}
              />
              <View style={styles.photoInfo}>
                <Text numberOfLines={1} style={styles.photoNameText}>
                  {attachedPhoto.name || 'Captured Photo'}
                </Text>
                {attachedPhoto.photoLocation?.address ? (
                  <Text numberOfLines={2} style={styles.photoAddressText}>
                    📍 {attachedPhoto.photoLocation.address}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setAttachedPhoto(null)} style={styles.deletePhotoBtn}>
                <Trash2 size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsCameraModalOpen(true)}
              style={styles.cameraTriggerBtn}
              activeOpacity={0.8}
            >
              <Camera size={20} color={colors.primary} />
              <Text style={styles.cameraTriggerText}>
                {t.takeLivePhoto || 'Take Geo-tagged Live Photo'}
              </Text>
            </TouchableOpacity>
          )}

          {/* No photo checkbox for complaints */}
          {requestType === 'complaint' && !attachedPhoto && (
            <TouchableOpacity
              onPress={() => setIsWarningModalOpen(true)}
              style={styles.noPhotoCheckboxRow}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, noPhotoExceptionChecked && styles.checkboxChecked]}>
                {noPhotoExceptionChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.noPhotoCheckboxLabel}>
                {t.noPhotoCheckboxLabel || "I don't have a photo right now (Officer may inspect site)"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Citizen Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locLeft}>
              <MapPin size={14} color={colors.saffron} />
              <Text style={styles.locTitle}>Registered Device Location</Text>
            </View>
            <TouchableOpacity
              onPress={() => fetchCurrentLocation(true)}
              disabled={isLocating}
              style={styles.refreshLocBtn}
            >
              <RefreshCw size={12} color="#2563EB" />
              <Text style={styles.refreshLocText}>
                {isLocating ? 'Locating...' : 'Refresh GPS'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.addressText}>📍 {humanReadableAddress}</Text>
          <Text style={styles.accuracyText}>Accuracy: ±{locationAccuracy}m</Text>
        </View>

        {/* Error Alert */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmitToReview}
          style={styles.submitBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>{t.continueBtn || 'Review & Submit'}</Text>
          <Send size={16} color={colors.saffron} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <NativeCameraModal
        visible={isCameraModalOpen}
        onCapture={handleCameraCaptureComplete}
        onClose={() => setIsCameraModalOpen(false)}
        citizenProfile={citizenProfile}
      />

      <NativeMapPickerModal
        visible={isProblemMapModalOpen}
        initialCoords={gpsCoords}
        onConfirm={handleConfirmProblemLocationFromMap}
        onClose={() => setIsProblemMapModalOpen(false)}
      />

      <GeoTagHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <ComplaintNoPhotoWarningModal
        isOpen={isWarningModalOpen}
        onConfirm={() => {
          setNoPhotoExceptionChecked(true);
          setNoPhotoExceptionAcknowledged(true);
          setIsWarningModalOpen(false);
        }}
        onCancel={() => {
          setNoPhotoExceptionChecked(false);
          setNoPhotoExceptionAcknowledged(false);
          setIsWarningModalOpen(false);
        }}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  greetingText: {
    fontSize: 11,
    color: '#CBD5E1'
  },
  appNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF'
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  historyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF'
  },
  cooldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    padding: 10,
    gap: 8
  },
  cooldownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  cooldownSubtitle: {
    fontSize: 10,
    color: '#78350F'
  },
  body: {
    padding: 16,
    gap: 14
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 4
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  toggleBtnDemandActive: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    elevation: 1
  },
  toggleBtnComplaintActive: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    elevation: 1
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  toggleBtnTextActive: {
    color: '#0F172A'
  },
  inputBox: {
    gap: 6
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  charCount: {
    fontSize: 10,
    color: '#94A3B8'
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top'
  },
  problemLocationCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  problemLocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  problemLocTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  problemLocTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9F1239'
  },
  selectedProbLoc: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 4
  },
  selectedProbLocAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  probLocMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  probLocSource: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B21A8'
  },
  changeProbLocText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB'
  },
  probLocButtonsRow: {
    flexDirection: 'row',
    gap: 8
  },
  probLocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6
  },
  probLocBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B'
  },
  photoSection: {
    backgroundColor: '#F8FAFC',
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
  photoSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  photoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 8,
    gap: 10
  },
  photoThumb: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  photoInfo: {
    flex: 1,
    gap: 2
  },
  photoNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B'
  },
  photoAddressText: {
    fontSize: 10,
    color: '#64748B'
  },
  deletePhotoBtn: {
    padding: 8
  },
  cameraTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8
  },
  cameraTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  noPhotoCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkmark: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800'
  },
  noPhotoCheckboxLabel: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15
  },
  locationCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 10,
    gap: 4
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  locLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  locTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF'
  },
  refreshLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  refreshLocText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB'
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B'
  },
  accuracyText: {
    fontSize: 10,
    color: '#64748B'
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
  submitBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
