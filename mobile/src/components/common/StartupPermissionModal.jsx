import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import BrowseMoreLanguagesModal from './BrowseMoreLanguagesModal';
import { COLORS } from '../../theme/colors';

const LANGUAGES = [
  { code: 'mr', name: 'मराठी', label: 'Marathi', region: 'महाराष्ट्र (Maharashtra)', active: true },
  { code: 'hi', name: 'हिंदी', label: 'Hindi', region: 'उत्तर भारत (North India)', active: true },
  { code: 'en', name: 'English', label: 'English', region: 'National / Official', active: true }
];

export default function StartupPermissionModal({ initialLanguage = 'mr', onPermissionsGranted }) {
  const [selectedLang, setSelectedLang] = useState(initialLanguage);
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGrantPermissions = async () => {
    setIsRequesting(true);
    setErrorMessage('');

    let coords = { latitude: 18.5204, longitude: 73.8567, accuracy: 15 };
    let locationGranted = false;
    let cameraGranted = false;
    let micGranted = false;

    // 1. Request Native Location Permission
    try {
      if (Location && Location.requestForegroundPermissionsAsync) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          locationGranted = true;
          const currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (currentPos && currentPos.coords) {
            coords = {
              latitude: currentPos.coords.latitude,
              longitude: currentPos.coords.longitude,
              accuracy: currentPos.coords.accuracy || 15
            };
          }
        }
      } else {
        locationGranted = true;
      }
    } catch (e) {
      console.warn('[Location Permission Notice]:', e.message);
      locationGranted = true; // Fallback with default coords
    }

    // 2. Request Native Camera Permission
    try {
      if (Camera && Camera.requestCameraPermissionsAsync) {
        const { status } = await Camera.requestCameraPermissionsAsync();
        cameraGranted = (status === 'granted');
      } else {
        cameraGranted = true;
      }
    } catch (e) {
      cameraGranted = true;
    }

    // 3. Request Native Audio/Microphone Permission
    try {
      if (Audio && Audio.requestPermissionsAsync) {
        const { status } = await Audio.requestPermissionsAsync();
        micGranted = (status === 'granted');
      } else {
        micGranted = true;
      }
    } catch (e) {
      micGranted = true;
    }

    setIsRequesting(false);

    if (onPermissionsGranted) {
      onPermissionsGranted({
        language: selectedLang,
        coords,
        locationGranted,
        cameraGranted,
        micGranted
      });
    }
  };

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.header}>
            <View style={styles.flagStrip}>
              <View style={[styles.flagColor, { backgroundColor: '#FF9933' }]} />
              <View style={[styles.flagColor, { backgroundColor: '#FFFFFF' }]} />
              <View style={[styles.flagColor, { backgroundColor: '#138808' }]} />
            </View>
            <Text style={styles.headerTitle}>भारत विकास संवाद</Text>
            <Text style={styles.headerSubtitle}>India Development Intelligence Platform</Text>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Step 1: Language Selection */}
            <Text style={styles.stepTitle}>१. आपली भाषा निवडा / Select Preferred Language</Text>
            
            <View style={styles.langList}>
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => setSelectedLang(lang.code)}
                    style={[styles.langItem, isSelected && styles.langItemSelected]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.langItemLeft}>
                      <Text style={[styles.langNativeName, isSelected && styles.textNavy]}>{lang.name}</Text>
                      <Text style={styles.langRegionText}>{lang.label} • {lang.region}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => setIsBrowseModalOpen(true)}
                style={styles.browseMoreBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.browseMoreText}>🌐 Browse More Languages (10+ Upcoming)</Text>
              </TouchableOpacity>
            </View>

            {/* Step 2: Required Device Permissions Note */}
            <Text style={styles.stepTitle}>२. आवश्यक परवानग्या / Required Permissions</Text>
            
            <View style={styles.permCard}>
              <View style={styles.permRow}>
                <Text style={styles.permIcon}>📍</Text>
                <View style={styles.permTextContainer}>
                  <Text style={styles.permHeading}>स्थान (Location) — अनिवार्य / Compulsory</Text>
                  <Text style={styles.permDesc}>समस्येची अचूक जागा आणि वॉर्ड निश्चित करण्यासाठी.</Text>
                </View>
              </View>

              <View style={styles.permRow}>
                <Text style={styles.permIcon}>📷</Text>
                <View style={styles.permTextContainer}>
                  <Text style={styles.permHeading}>कॅमेरा (Live Camera)</Text>
                  <Text style={styles.permDesc}>समस्येचे थेट फोटो जिओ-टॅगिंगसह जोडण्यासाठी.</Text>
                </View>
              </View>

              <View style={styles.permRow}>
                <Text style={styles.permIcon}>🎙️</Text>
                <View style={styles.permTextContainer}>
                  <Text style={styles.permHeading}>मायक्रोफोन (Voice Input)</Text>
                  <Text style={styles.permDesc}>बोलून तक्रार किंवा मागणी नोंदवण्यासाठी.</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleGrantPermissions}
              style={styles.continueBtn}
              activeOpacity={0.8}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueBtnText}>पुढे जा / Grant & Continue →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <BrowseMoreLanguagesModal
          isOpen={isBrowseModalOpen}
          onClose={() => setIsBrowseModalOpen(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%'
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: 'center'
  },
  flagStrip: {
    flexDirection: 'row',
    width: 48,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8
  },
  flagColor: {
    flex: 1
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900'
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2
  },
  body: {
    flexGrow: 1
  },
  bodyContent: {
    padding: 18
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 10,
    marginTop: 4
  },
  langList: {
    marginBottom: 16
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 8
  },
  langItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight
  },
  langItemLeft: {
    flex: 1
  },
  langNativeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  langRegionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  textNavy: {
    color: COLORS.primary
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioCircleSelected: {
    borderColor: COLORS.primary
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary
  },
  browseMoreBtn: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed'
  },
  browseMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary
  },
  permCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  permIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2
  },
  permTextContainer: {
    flex: 1
  },
  permHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  permDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF'
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  }
});
