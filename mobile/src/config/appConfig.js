import { Platform } from 'react-native';

// Dynamically determine the backend base URL for Android Emulator / iOS Simulator / Web / Real Device
const getDevApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    // 10.0.2.2 is the default host loopback address in Android Emulator
    return 'http://10.0.2.2:5000/api';
  }
  // iOS simulator or default local host
  return 'http://localhost:5000/api';
};

export const APP_CONFIG = {
  apiBaseUrl: getDevApiBaseUrl(),
  appName: 'India Development Intelligence Platform',
  appNameIndic: 'भारत विकास संवाद',
  version: '1.0.0 (Native)',
  defaultLanguage: 'mr',
  supportedLanguages: ['en', 'hi', 'mr'],
  requestTimeoutMs: 15000
};

export default APP_CONFIG;
