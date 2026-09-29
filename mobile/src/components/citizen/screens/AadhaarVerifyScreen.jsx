import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { ShieldCheck, UserCheck, AlertCircle, Sparkles } from 'lucide-react-native';
import { TRANSLATIONS } from '../../../constants/translations';
import { verifyAadhaarMock, getDemoProfiles } from '../../../services/api';
import { colors } from '../../../theme/colors';

export default function AadhaarVerifyScreen({ language, mobile, onVerificationSuccess, onBack }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [aadhaarInput, setAadhaarInput] = useState('2345 6789 0123');
  const [consent, setConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoProfiles, setDemoProfiles] = useState([]);

  useEffect(() => {
    getDemoProfiles()
      .then(setDemoProfiles)
      .catch((err) => console.warn('Could not load demo profiles:', err));
  }, []);

  const handleInputChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += digits[i];
    }
    setAadhaarInput(formatted);
    setError('');
  };

  const handleSelectDemoProfile = (rawAadhaar) => {
    handleInputChange(rawAadhaar);
  };

  const handleVerify = async () => {
    setError('');
    const rawDigits = aadhaarInput.replace(/\D/g, '');
    if (rawDigits.length !== 12) {
      setError(t.invalidAadhaarError || 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    if (!consent) {
      setError('Please check the consent box to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyAadhaarMock(rawDigits, mobile);
      if (response.success && response.data) {
        onVerificationSuccess(response.data);
      } else {
        throw new Error(response.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Identity verification could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = aadhaarInput.replace(/\D/g, '').length === 12 && !isLoading;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <UserCheck size={24} color={colors.saffron} />
        </View>
        <Text style={styles.headerTitle}>{t.verifyIdentityTitle}</Text>
        <Text style={styles.headerSubtitle}>{t.verifyIdentitySubtitle}</Text>
      </View>

      <View style={styles.body}>
        {/* Quick Pick Demo Citizens */}
        {demoProfiles.length > 0 && (
          <View style={styles.demoBox}>
            <Text style={styles.demoBoxTitle}>{t.quickPickCitizen}</Text>
            <View style={styles.demoChipsRow}>
              {demoProfiles.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleSelectDemoProfile(p.sampleAadhaarRaw)}
                  style={styles.demoChip}
                >
                  <Text style={styles.demoChipText}>
                    {p.name.split(' ')[0]} ({p.district})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Aadhaar Input Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t.aadhaarLabel}</Text>
            <Text style={styles.labelHint}>12 Digits</Text>
          </View>

          <TextInput
            style={styles.aadhaarInput}
            keyboardType="number-pad"
            maxLength={14}
            placeholder="XXXX XXXX XXXX"
            placeholderTextColor="#94A3B8"
            value={aadhaarInput}
            onChangeText={handleInputChange}
          />
        </View>

        {/* Consent Checkbox */}
        <TouchableOpacity
          onPress={() => setConsent(!consent)}
          style={styles.consentRow}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
            {consent && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.consentText}>{t.consentCheckbox}</Text>
        </TouchableOpacity>

        {/* Error Alert */}
        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Verify Action Button */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={!isFormValid}
          style={[styles.verifyBtn, !isFormValid && styles.verifyBtnDisabled]}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <ShieldCheck size={18} color={colors.saffron} />
              <Text style={styles.verifyBtnText}>{t.verifyBtn}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityBox}>
          <ShieldCheck size={14} color={colors.emerald} />
          <Text style={styles.securityText}>{t.securityNotice}</Text>
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
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
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
  demoBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  demoBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  demoChipsRow: {
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
  fieldGroup: {
    gap: 6
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase'
  },
  labelHint: {
    fontSize: 10,
    color: '#94A3B8'
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
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
  consentText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16
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
  verifyBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  verifyBtnDisabled: {
    backgroundColor: '#94A3B8'
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8
  },
  securityText: {
    flex: 1,
    fontSize: 10,
    color: '#64748B'
  }
});
