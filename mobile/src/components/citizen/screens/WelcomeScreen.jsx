import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Landmark, Phone, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react-native';
import { TRANSLATIONS } from '../../../constants/translations';
import { colors } from '../../../theme/colors';

export default function WelcomeScreen({ language, onLogin, onDirectAadhaar }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');

  const handleAction = (type) => {
    setError('');
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length > 0 && cleanMobile.length !== 10) {
      setError(
        language === 'mr'
          ? 'कृपया १० अंकी मोबाईल नंबर टाका.'
          : language === 'hi'
          ? 'कृपया १० अंकों का मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }
    onLogin({ mobile: cleanMobile || '9823014589', action: type });
  };

  return (
    <View style={styles.card}>
      {/* Official Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIconContainer}>
          <Landmark size={32} color={colors.saffron} />
        </View>
        <Text style={styles.bannerTitle}>{t.appName}</Text>
        <Text style={styles.bannerSubtitle}>{t.appSubtitle}</Text>
      </View>

      <View style={styles.body}>
        {/* Civic Subheading */}
        <View style={styles.subheadingContainer}>
          <Text style={styles.subheadingTitle}>{t.welcomeTitle}</Text>
          <Text style={styles.subheadingText}>{t.welcomeSubtitle}</Text>
        </View>

        {/* Mobile Number Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Phone size={14} color={colors.primary} />
            <Text style={styles.label}>{t.mobileNumberLabel}</Text>
          </View>
          <View style={styles.inputRow}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              maxLength={10}
              placeholder={t.mobilePlaceholder}
              placeholderTextColor="#94A3B8"
              value={mobileNumber}
              onChangeText={(text) => setMobileNumber(text.replace(/\D/g, ''))}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleAction('login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>{t.loginBtn}</Text>
            <ArrowRight size={16} color={colors.saffron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => handleAction('signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>{t.signupBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* Or direct Aadhaar mock route */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t.orContinueWithAadhaar}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.aadhaarBtn}
          onPress={onDirectAadhaar}
          activeOpacity={0.8}
        >
          <UserCheck size={16} color="#B45309" />
          <Text style={styles.aadhaarBtnText}>{t.directAadhaarBtn}</Text>
        </TouchableOpacity>

        {/* Trust & Privacy Badge */}
        <View style={styles.trustBadge}>
          <ShieldCheck size={14} color={colors.emerald} />
          <Text style={styles.trustText}>{t.privacyNote}</Text>
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
  bannerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center'
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
    textAlign: 'center'
  },
  body: {
    padding: 20,
    gap: 16
  },
  subheadingContainer: {
    alignItems: 'center',
    gap: 4
  },
  subheadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center'
  },
  subheadingText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18
  },
  fieldGroup: {
    gap: 6
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase'
  },
  inputRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    alignItems: 'center',
    overflow: 'hidden'
  },
  prefixContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F1F5F9'
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155'
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A'
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 2
  },
  actionGroup: {
    gap: 10
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 1
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  secondaryBtnText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0'
  },
  dividerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500'
  },
  aadhaarBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  aadhaarBtnText: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '700'
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4
  },
  trustText: {
    fontSize: 11,
    color: '#64748B'
  }
});
