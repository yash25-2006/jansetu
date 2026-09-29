import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import {
  Landmark,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Users,
  Building2,
  Globe,
  Home,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { govLogin, getDemoProfiles, sendCitizenOtp, verifyCitizenOtp } from '../../services/api';
import { TRANSLATIONS } from '../../constants/translations';
import BrowseMoreLanguagesModal from '../../components/common/BrowseMoreLanguagesModal';
import { colors } from '../../theme/colors';

import DEMO_GOVERNMENT_TIERS from '../../../../data/sample/gov_tiers.json';

export default function UnifiedLogin({
  onCitizenLoginSuccess = () => {},
  onGovLoginSuccess = () => {},
  citizenLanguage = 'mr',
  initialTab = 'citizen'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'citizen' or 'government'

  // Citizen Authentication Flow
  const [citizenStep, setCitizenStep] = useState(1); // 1: Aadhaar, 2: OTP, 3: Confirm
  const [aadhaarInput, setAadhaarInput] = useState('2345 6789 0123');
  const [otpInput, setOtpInput] = useState('');
  const [txnId, setTxnId] = useState(null);
  const [maskedMobile, setMaskedMobile] = useState('');
  const [maskedAadhaar, setMaskedAadhaar] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [citizenError, setCitizenError] = useState('');
  const [verifiedCitizen, setVerifiedCitizen] = useState(null);
  const [demoCitizens, setDemoCitizens] = useState([]);

  // Government Login State
  const [selectedGovTier, setSelectedGovTier] = useState('central');
  const [govEmail, setGovEmail] = useState(DEMO_GOVERNMENT_TIERS.central.email);
  const [govPassword, setGovPassword] = useState(DEMO_GOVERNMENT_TIERS.central.password);
  const [showPassword, setShowPassword] = useState(false);
  const [govLoading, setGovLoading] = useState(false);
  const [govError, setGovError] = useState('');
  const [isBrowseLanguagesOpen, setIsBrowseLanguagesOpen] = useState(false);

  const t = TRANSLATIONS[citizenLanguage] || TRANSLATIONS.en;

  useEffect(() => {
    getDemoProfiles()
      .then((profiles) => {
        if (Array.isArray(profiles) && profiles.length > 0) {
          setDemoCitizens(profiles);
        }
      })
      .catch((err) => console.warn('Could not load demo citizen profiles:', err));
  }, []);

  useEffect(() => {
    let timer = null;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleAadhaarChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += digits[i];
    }
    setAadhaarInput(formatted);
    setCitizenError('');
  };

  const handleSendOtp = async () => {
    setCitizenError('');
    const rawDigits = aadhaarInput.replace(/\D/g, '');
    if (rawDigits.length !== 12) {
      setCitizenError(t.invalidAadhaarError || 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setCitizenLoading(true);
    try {
      const response = await sendCitizenOtp(rawDigits);
      if (response.success) {
        const payloadData = response.data || response;
        setTxnId(payloadData.txnId);
        setMaskedMobile(payloadData.maskedMobile || 'XXXXXX7890');
        setMaskedAadhaar(payloadData.maskedAadhaar || `XXXX XXXX ${rawDigits.slice(-4)}`);
        setCitizenStep(2);
        setResendCountdown(30);
      } else {
        throw new Error(response.error || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('Send OTP Error:', err);
      setCitizenError(err.message || 'Identity service unavailable. Please retry.');
    } finally {
      setCitizenLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setCitizenError('');
    const cleanOtp = otpInput.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setCitizenError('Please enter a valid 6-digit OTP.');
      return;
    }

    setCitizenLoading(true);
    try {
      const response = await verifyCitizenOtp(txnId, cleanOtp);
      if (response.success && response.citizen) {
        setVerifiedCitizen(response.citizen);
        setCitizenStep(3);
      } else {
        throw new Error(response.error || 'Invalid OTP code.');
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setCitizenError(err.message || 'OTP verification failed.');
    } finally {
      setCitizenLoading(false);
    }
  };

  const handleGovTierSelect = (tierKey) => {
    setSelectedGovTier(tierKey);
    const tier = DEMO_GOVERNMENT_TIERS[tierKey];
    if (tier) {
      setGovEmail(tier.email);
      setGovPassword(tier.password);
      setGovError('');
    }
  };

  const handleGovLogin = async () => {
    setGovError('');
    if (!govEmail.trim() || !govPassword.trim()) {
      setGovError('Please provide both official email and security password.');
      return;
    }

    setGovLoading(true);
    try {
      const response = await govLogin({
        email: govEmail.trim(),
        password: govPassword.trim()
      });

      if (response.token && response.user) {
        onGovLoginSuccess(response.user, response.token);
      } else {
        throw new Error(response.error || 'Authentication rejected by security gate.');
      }
    } catch (err) {
      console.error('Government login error:', err);
      setGovError(err.message || 'Login failed. Please verify demo credentials.');
    } finally {
      setGovLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Branding */}
        <View style={styles.brandingCard}>
          <View style={styles.emblemContainer}>
            <Landmark size={32} color={colors.saffron} />
          </View>
          <Text style={styles.emblemTitle}>{t.appName}</Text>
          <Text style={styles.emblemSubtitle}>
            Unified Citizen & Government Governance Gateway
          </Text>
        </View>

        {/* Portal Switcher Tabs */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            onPress={() => setActiveTab('citizen')}
            style={[styles.portalTab, activeTab === 'citizen' && styles.portalTabActive]}
            activeOpacity={0.8}
          >
            <Users size={16} color={activeTab === 'citizen' ? colors.primary : '#64748B'} />
            <Text style={[styles.portalTabText, activeTab === 'citizen' && styles.portalTabTextActive]}>
              Citizen Portal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('government')}
            style={[styles.portalTab, activeTab === 'government' && styles.portalTabActive]}
            activeOpacity={0.8}
          >
            <Building2 size={16} color={activeTab === 'government' ? colors.primary : '#64748B'} />
            <Text style={[styles.portalTabText, activeTab === 'government' && styles.portalTabTextActive]}>
              Government Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* CITIZEN PORTAL CONTENT */}
        {activeTab === 'citizen' ? (
          <View style={styles.card}>
            {/* Step 1: Aadhaar Input */}
            {citizenStep === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>{t.verifyIdentityTitle || 'Citizen Authentication'}</Text>
                  <Text style={styles.stepSubtitle}>
                    Enter your 12-digit Aadhaar number to receive a secure OTP
                  </Text>
                </View>

                {/* Quick Pick Demo Citizens */}
                {demoCitizens.length > 0 && (
                  <View style={styles.demoPicker}>
                    <Text style={styles.demoPickerTitle}>{t.quickPickCitizen || 'Quick-Pick Demo Citizen:'}</Text>
                    <View style={styles.demoChips}>
                      {demoCitizens.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => handleAadhaarChange(c.sampleAadhaarRaw)}
                          style={styles.demoChip}
                        >
                          <Text style={styles.demoChipText}>
                            {c.name.split(' ')[0]} ({c.district})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.aadhaarLabel || 'Aadhaar Number'}</Text>
                  <TextInput
                    style={styles.aadhaarInput}
                    keyboardType="number-pad"
                    maxLength={14}
                    placeholder="XXXX XXXX XXXX"
                    placeholderTextColor="#94A3B8"
                    value={aadhaarInput}
                    onChangeText={handleAadhaarChange}
                  />
                </View>

                {citizenError ? (
                  <View style={styles.errorBox}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{citizenError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={citizenLoading || aadhaarInput.replace(/\D/g, '').length !== 12}
                  style={[
                    styles.primaryBtn,
                    (citizenLoading || aadhaarInput.replace(/\D/g, '').length !== 12) && styles.primaryBtnDisabled
                  ]}
                  activeOpacity={0.8}
                >
                  {citizenLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Send OTP</Text>
                      <ArrowRight size={16} color={colors.saffron} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: OTP Verification */}
            {citizenStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Enter Verification OTP</Text>
                  <Text style={styles.stepSubtitle}>
                    OTP sent to linked mobile ending in {maskedMobile}
                  </Text>
                </View>

                <View style={styles.sandboxNotice}>
                  <KeyRound size={14} color="#D97706" />
                  <Text style={styles.sandboxNoticeText}>Sandbox Mode: Use default OTP 123456</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>6-Digit OTP</Text>
                  <TextInput
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="• • • • • •"
                    placeholderTextColor="#94A3B8"
                    value={otpInput}
                    onChangeText={setOtpInput}
                  />
                </View>

                {citizenError ? (
                  <View style={styles.errorBox}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{citizenError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={citizenLoading || otpInput.replace(/\D/g, '').length !== 6}
                  style={[
                    styles.primaryBtn,
                    (citizenLoading || otpInput.replace(/\D/g, '').length !== 6) && styles.primaryBtnDisabled
                  ]}
                  activeOpacity={0.8}
                >
                  {citizenLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                      <ArrowRight size={16} color={colors.saffron} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCitizenStep(1)}
                  style={styles.backStepBtn}
                >
                  <Text style={styles.backStepText}>Change Aadhaar Number</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Verified Citizen Confirmation */}
            {citizenStep === 3 && verifiedCitizen && (
              <View style={styles.stepContainer}>
                <View style={styles.verifiedHeader}>
                  <View style={styles.verifiedCircle}>
                    <CheckCircle2 size={32} color={colors.emerald} />
                  </View>
                  <Text style={styles.stepTitle}>Identity Verified</Text>
                  <Text style={styles.stepSubtitle}>Aadhaar linked citizen record confirmed</Text>
                </View>

                <View style={styles.profileBox}>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Citizen Name:</Text>
                    <Text style={styles.profileValue}>{verifiedCitizen.name}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>District:</Text>
                    <Text style={styles.profileValue}>{verifiedCitizen.district}, {verifiedCitizen.state}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Mobile:</Text>
                    <Text style={styles.profileValue}>{verifiedCitizen.mobile || maskedMobile}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => onCitizenLoginSuccess(verifiedCitizen)}
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Proceed to Citizen Portal</Text>
                  <ArrowRight size={16} color={colors.saffron} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* GOVERNMENT PORTAL CONTENT */
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Government Administration Gateway</Text>
              <Text style={styles.stepSubtitle}>
                Select an administrative tier below for 1-click credential configuration
              </Text>
            </View>

            {/* 3 Government Demo Cards */}
            <View style={styles.govTiers}>
              {Object.values(DEMO_GOVERNMENT_TIERS).map((tier) => {
                const isSelected = selectedGovTier === tier.id;
                return (
                  <TouchableOpacity
                    key={tier.id}
                    onPress={() => handleGovTierSelect(tier.id)}
                    style={[styles.govTierCard, isSelected && styles.govTierCardSelected]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.govTierHeader}>
                      <View style={styles.tierEmojiBox}>
                        <Text style={{ fontSize: 20 }}>{tier.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tierTitle}>{tier.title}</Text>
                        <Text style={styles.tierSubtitle}>{tier.subtitle}</Text>
                      </View>
                      <View style={[styles.tierRadio, isSelected && styles.tierRadioActive]} />
                    </View>
                    <Text style={styles.tierRole}>{tier.roleLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Email & Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Official Email Address</Text>
              <View style={styles.inputWithIcon}>
                <Mail size={16} color="#94A3B8" />
                <TextInput
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={govEmail}
                  onChangeText={setGovEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Security Password</Text>
              <View style={styles.inputWithIcon}>
                <Lock size={16} color="#94A3B8" />
                <TextInput
                  style={styles.textInput}
                  secureTextEntry={!showPassword}
                  value={govPassword}
                  onChangeText={setGovPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                </TouchableOpacity>
              </View>
            </View>

            {govError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color={colors.danger} />
                <Text style={styles.errorText}>{govError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleGovLogin}
              disabled={govLoading}
              style={[styles.primaryBtn, govLoading && styles.primaryBtnDisabled]}
              activeOpacity={0.8}
            >
              {govLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Authenticate to Dashboard</Text>
                  <ArrowRight size={16} color={colors.saffron} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Browse Languages Trigger */}
        <TouchableOpacity
          onPress={() => setIsBrowseLanguagesOpen(true)}
          style={styles.langBrowseRow}
          activeOpacity={0.8}
        >
          <Globe size={14} color="#64748B" />
          <Text style={styles.langBrowseText}>13 Indian Languages Supported (Browse)</Text>
        </TouchableOpacity>

        {/* Trust Badges */}
        <View style={styles.trustBadgeRow}>
          <ShieldCheck size={14} color={colors.emerald} />
          <Text style={styles.trustBadgeText}>National Data Protection & Security Standard</Text>
        </View>
      </ScrollView>

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
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40
  },
  brandingCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6
  },
  emblemContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  emblemTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center'
  },
  emblemSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center'
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    gap: 4
  },
  portalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6
  },
  portalTabActive: {
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4
  },
  portalTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  portalTabTextActive: {
    color: colors.primary
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6
  },
  stepContainer: {
    gap: 14
  },
  stepHeader: {
    gap: 4
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },
  demoPicker: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
    gap: 6
  },
  demoPickerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  demoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  demoChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F'
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase'
  },
  aadhaarInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 2
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 6
  },
  sandboxNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8
  },
  sandboxNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0F172A'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4
  },
  primaryBtnDisabled: {
    backgroundColor: '#94A3B8'
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  backStepBtn: {
    alignItems: 'center',
    paddingVertical: 6
  },
  backStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB'
  },
  verifiedHeader: {
    alignItems: 'center',
    gap: 4
  },
  verifiedCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  profileBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  profileLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  profileValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  govTiers: {
    gap: 10
  },
  govTierCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    gap: 6
  },
  govTierCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF'
  },
  govTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  tierEmojiBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  tierSubtitle: {
    fontSize: 11,
    color: '#64748B'
  },
  tierRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1'
  },
  tierRadioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  tierRole: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginLeft: 48
  },
  langBrowseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6
  },
  langBrowseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  trustBadgeText: {
    fontSize: 11,
    color: '#94A3B8'
  }
});
