import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  StyleSheet
} from 'react-native';
import WelcomeScreen from '../../components/citizen/screens/WelcomeScreen';
import LanguageSelectScreen from '../../components/citizen/screens/LanguageSelectScreen';
import AadhaarVerifyScreen from '../../components/citizen/screens/AadhaarVerifyScreen';
import ConfirmDetailsScreen from '../../components/citizen/screens/ConfirmDetailsScreen';
import CitizenHomeScreen from '../../components/citizen/screens/CitizenHomeScreen';
import ReviewScreen from '../../components/citizen/screens/ReviewScreen';
import SuccessScreen from '../../components/citizen/screens/SuccessScreen';
import CitizenHistoryModal from '../../components/citizen/CitizenHistoryModal';
import StartupPermissionModal from '../../components/common/StartupPermissionModal';
import CitizenPerformanceModal from '../../components/citizen/CitizenPerformanceModal';
import GovernmentPlansModal from '../../components/citizen/GovernmentPlansModal';
import BrowseMoreLanguagesModal from '../../components/common/BrowseMoreLanguagesModal';
import { TRANSLATIONS } from '../../constants/translations';
import { submitRequest } from '../../services/api';
import { colors } from '../../theme/colors';
import {
  Landmark,
  Languages,
  LogOut,
  ChevronLeft,
  ShieldCheck,
  Award,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react-native';

export default function CitizenFlow({
  initialProfile = null,
  initialLanguage = 'mr',
  onLogout = () => {}
}) {
  const [hasCompletedStartupPermissions, setHasCompletedStartupPermissions] = useState(false);
  const [startupPermsResult, setStartupPermsResult] = useState(null);

  // Steps: 1: Welcome, 2: Language, 3: Aadhaar, 4: Confirm, 5: Home, 7: Review, 8: Success
  const [currentStep, setCurrentStep] = useState(initialProfile ? 5 : 1);
  const [language, setLanguage] = useState(initialLanguage || 'mr');
  const [isBrowseLanguagesOpen, setIsBrowseLanguagesOpen] = useState(false);
  const [mobile, setMobile] = useState('');

  // Citizen Profile
  const [citizenProfile, setCitizenProfile] = useState(initialProfile);

  // Request & Submission State
  const [draftRequest, setDraftRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionError, setSubmissionError] = useState('');

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [matchedPlanModalData, setMatchedPlanModalData] = useState(null);
  const [duplicateModalData, setDuplicateModalData] = useState(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleStartupPermsComplete = (permsResult) => {
    setStartupPermsResult(permsResult);
    if (permsResult?.selectedLanguage) {
      setLanguage(permsResult.selectedLanguage);
    }
    setHasCompletedStartupPermissions(true);
  };

  // Step 1: Login / Signup
  const handleLogin = ({ mobile: mob }) => {
    setMobile(mob);
    setCurrentStep(2);
  };

  const handleDirectAadhaar = () => {
    setCurrentStep(3);
  };

  // Step 2: Language
  const handleSelectLanguage = (langCode) => {
    setLanguage(langCode);
  };

  const handleLanguageConfirmed = () => {
    setCurrentStep(3);
  };

  // Step 3: Aadhaar
  const handleAadhaarVerified = (verifiedData) => {
    setCitizenProfile(verifiedData);
    setCurrentStep(4);
  };

  // Step 4: Confirm Details
  const handleDetailsConfirmed = (finalProfile) => {
    setCitizenProfile(finalProfile);
    setCurrentStep(5);
  };

  // Step 5: Proceed to Review
  const handleProceedToReview = (draft) => {
    setDraftRequest(draft);
    setSubmissionError('');
    setCurrentStep(7);
  };

  // Step 7: Confirm & Submit to Backend
  const handleConfirmSend = async (finalDraft) => {
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      const payload = {
        originalText: finalDraft.text,
        citizenId: citizenProfile?.citizenId || 'CIT-DEMO-001',
        language: language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English',
        inputType: finalDraft.inputType || 'text',
        photo: finalDraft.photo || null,
        requestType: finalDraft.requestType || 'demand',
        photoException: Boolean(finalDraft.photoException),
        photoExceptionAcknowledged: Boolean(finalDraft.photoExceptionAcknowledged),
        problemLocation: finalDraft.problemLocation || null,
        locationAccuracy: finalDraft.location?.accuracy || null,
        locationCapturedAt: finalDraft.location?.capturedAt || null,
        location: {
          district: finalDraft.location?.district || citizenProfile?.district || 'Pune',
          state: finalDraft.location?.state || citizenProfile?.state || 'Maharashtra',
          address: finalDraft.location?.address || citizenProfile?.address || 'Maharashtra',
          latitude: finalDraft.location?.latitude,
          longitude: finalDraft.location?.longitude,
          accuracy: finalDraft.location?.accuracy || null,
          captured_at: finalDraft.location?.capturedAt || null
        }
      };

      const res = await submitRequest(payload);

      // Check Plan Matched Gate
      if (res && res.planMatched && res.matchedPlan) {
        setMatchedPlanModalData(res.matchedPlan);
        setCurrentStep(5);
        return;
      }

      // Check Duplicate Notice Gate
      if (res && res.isDuplicate && res.existingRequest) {
        setDuplicateModalData({
          existing: res.existingRequest,
          newSubmission: res.request || res.data
        });
      }

      setSubmissionResult(res);
      setCurrentStep(8); // Success
    } catch (err) {
      console.error('Submission error:', err);
      setSubmissionError(err.message || 'Submission could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          {currentStep > 1 && currentStep < 8 && (
            <TouchableOpacity
              onPress={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              style={styles.backIconBtn}
            >
              <ChevronLeft size={20} color="#FFF" />
            </TouchableOpacity>
          )}
          <View style={styles.emblemIcon}>
            <Landmark size={18} color={colors.saffron} />
          </View>
          <Text style={styles.headerAppName}>{t.appName}</Text>
        </View>

        {/* Quick Access Action Controls */}
        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            onPress={() => setShowPlansModal(true)}
            style={styles.headerPill}
            activeOpacity={0.8}
          >
            <Building2 size={13} color="#93C5FD" />
            <Text style={styles.headerPillText}>Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPerformanceModal(true)}
            style={styles.headerPill}
            activeOpacity={0.8}
          >
            <Award size={13} color={colors.saffron} />
            <Text style={styles.headerPillText}>Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowHistoryModal(true)}
            style={styles.headerPill}
            activeOpacity={0.8}
          >
            <Clock size={13} color="#A7F3D0" />
            <Text style={styles.headerPillText}>History</Text>
          </TouchableOpacity>

          {onLogout && (
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <LogOut size={16} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Body Screen */}
      <ScrollView contentContainerStyle={styles.scrollBody}>
        {currentStep === 1 && (
          <WelcomeScreen
            language={language}
            onLogin={handleLogin}
            onDirectAadhaar={handleDirectAadhaar}
          />
        )}

        {currentStep === 2 && (
          <LanguageSelectScreen
            selectedLanguage={language}
            onSelectLanguage={handleSelectLanguage}
            onContinue={handleLanguageConfirmed}
          />
        )}

        {currentStep === 3 && (
          <AadhaarVerifyScreen
            language={language}
            mobile={mobile}
            onVerificationSuccess={handleAadhaarVerified}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 4 && (
          <ConfirmDetailsScreen
            language={language}
            citizenProfile={citizenProfile}
            onConfirmDetails={handleDetailsConfirmed}
          />
        )}

        {currentStep === 5 && (
          <CitizenHomeScreen
            language={language}
            citizenProfile={citizenProfile}
            startupLocationCoords={startupPermsResult?.locationCoords}
            onProceedToReview={handleProceedToReview}
            onOpenMyRequests={() => setShowHistoryModal(true)}
          />
        )}

        {currentStep === 7 && (
          <ReviewScreen
            language={language}
            draftRequest={draftRequest}
            citizenProfile={citizenProfile}
            onEdit={() => setCurrentStep(5)}
            onConfirmSend={handleConfirmSend}
            isSubmitting={isSubmitting}
            submissionError={submissionError}
          />
        )}

        {currentStep === 8 && (
          <SuccessScreen
            language={language}
            submissionResult={submissionResult}
            onReportAnother={() => {
              setDraftRequest(null);
              setSubmissionResult(null);
              setCurrentStep(5);
            }}
            onViewMyRequests={() => setShowHistoryModal(true)}
          />
        )}
      </ScrollView>

      {/* Startup Permissions Modal */}
      {!hasCompletedStartupPermissions && (
        <StartupPermissionModal
          visible={!hasCompletedStartupPermissions}
          onComplete={handleStartupPermsComplete}
        />
      )}

      {/* Citizen History Modal */}
      <CitizenHistoryModal
        visible={showHistoryModal}
        citizenProfile={citizenProfile}
        language={language}
        onClose={() => setShowHistoryModal(false)}
      />

      {/* Citizen Performance Modal */}
      <CitizenPerformanceModal
        visible={showPerformanceModal}
        language={language}
        onClose={() => setShowPerformanceModal(false)}
      />

      {/* Government Plans Modal */}
      <GovernmentPlansModal
        visible={showPlansModal}
        language={language}
        onClose={() => setShowPlansModal(false)}
      />

      {/* Plan Matched Intercept Modal */}
      {matchedPlanModalData && (
        <Modal visible={Boolean(matchedPlanModalData)} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.noticeCard}>
              <View style={styles.noticeIconCircle}>
                <Building2 size={24} color={colors.primary} />
              </View>
              <Text style={styles.noticeTitle}>Already in Government Plan!</Text>
              <Text style={styles.noticeBody}>
                Your requirement is already approved under upcoming scheme:
              </Text>
              <View style={styles.schemeInfoBox}>
                <Text style={styles.schemeTitle}>{matchedPlanModalData.title}</Text>
                <Text style={styles.schemeDesc}>{matchedPlanModalData.description}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMatchedPlanModalData(null)}
                style={styles.noticeBtn}
              >
                <Text style={styles.noticeBtnText}>Acknowledge & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Browse More Languages Modal */}
      <BrowseMoreLanguagesModal
        isOpen={isBrowseLanguagesOpen}
        onClose={() => setIsBrowseLanguagesOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#001E33'
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  backIconBtn: {
    padding: 2
  },
  emblemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerAppName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF'
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF'
  },
  logoutBtn: {
    padding: 6
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  noticeCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 12
  },
  noticeIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  noticeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center'
  },
  noticeBody: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center'
  },
  schemeInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4
  },
  schemeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  schemeDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16
  },
  noticeBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4
  },
  noticeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF'
  }
});
