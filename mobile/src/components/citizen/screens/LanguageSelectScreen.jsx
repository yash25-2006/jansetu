import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Languages, Check, ArrowRight, Globe, ChevronRight } from 'lucide-react-native';
import { TRANSLATIONS } from '../../../constants/translations';
import BrowseMoreLanguagesModal from '../../common/BrowseMoreLanguagesModal';
import { colors } from '../../../theme/colors';

const LANGUAGES = [
  {
    code: 'mr',
    native: 'मराठी',
    sub: 'Marathi',
    badge: 'महाराष्ट्र शासन / ग्रामीण विकास',
    greeting: 'नमस्कार, समस्या सांगा'
  },
  {
    code: 'hi',
    native: 'हिन्दी',
    sub: 'Hindi',
    badge: 'भारतीय जन संवाद',
    greeting: 'नमस्ते, समस्या बताएं'
  },
  {
    code: 'en',
    native: 'English',
    sub: 'India Development Intelligence',
    badge: 'Civic Platform',
    greeting: 'Welcome, share your issue'
  }
];

export default function LanguageSelectScreen({ selectedLanguage, onSelectLanguage, onContinue }) {
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Languages size={24} color={colors.saffron} />
        </View>
        <Text style={styles.headerTitle}>{t.chooseLanguageTitle}</Text>
        <Text style={styles.headerSubtitle}>{t.chooseLanguageSubtitle}</Text>
      </View>

      <View style={styles.body}>
        {/* Language Selection List */}
        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => onSelectLanguage(lang.code)}
                style={[styles.langCard, isSelected && styles.langCardSelected]}
                activeOpacity={0.8}
              >
                <View>
                  <View style={styles.langTitleRow}>
                    <Text style={styles.langNative}>{lang.native}</Text>
                    <Text style={styles.langSub}>({lang.sub})</Text>
                  </View>
                  <Text style={styles.langGreeting}>{lang.greeting}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <Check size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Browse More Languages Button */}
          <TouchableOpacity
            onPress={() => setIsBrowseOpen(true)}
            style={styles.browseBtn}
            activeOpacity={0.8}
          >
            <View style={styles.browseIconContainer}>
              <Globe size={18} color="#475569" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.browseTitle}>Browse More Languages (10+)</Text>
              <Text style={styles.browseSubtitle}>Bengali, Gujarati, Tamil, Telugu & more</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={onContinue}
          style={styles.continueBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>{t.continueBtn}</Text>
          <ArrowRight size={16} color={colors.saffron} />
        </TouchableOpacity>
      </View>

      {/* Browse More Languages Modal */}
      <BrowseMoreLanguagesModal
        isOpen={isBrowseOpen}
        onClose={() => setIsBrowseOpen(false)}
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
  list: {
    gap: 10
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF'
  },
  langCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF'
  },
  langTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  langNative: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  langSub: {
    fontSize: 12,
    color: '#64748B'
  },
  langGreeting: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    marginTop: 4
  },
  browseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  browseTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  browseSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1
  },
  continueBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 6
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
