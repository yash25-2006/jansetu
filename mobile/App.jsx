import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator
} from 'react-native';
import UnifiedLogin from './src/pages/auth/UnifiedLogin';
import CitizenFlow from './src/pages/citizen/CitizenFlow';
import GovCentralDashboard from './src/pages/central-government/GovCentralDashboard';
import GovernmentDashboard from './src/pages/state-government/GovernmentDashboard';
import GovWardDashboard from './src/pages/ward-government/GovWardDashboard';
import { storage } from './src/utils/storage';
import { colors } from './src/theme/colors';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'citizen' | 'central_gov' | 'state_gov' | 'ward_gov'
  const [citizenLanguage, setCitizenLanguage] = useState('mr');

  // Load persisted session on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedLang = await storage.getItem('preferred_language');
        if (savedLang) setCitizenLanguage(savedLang);

        const savedUser = await storage.getItem('auth_user');
        const savedRole = await storage.getItem('auth_role');

        if (savedUser && savedRole) {
          setCurrentUser(savedUser);
          setUserRole(savedRole);
        }
      } catch (err) {
        console.warn('Session restoration notice:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  // Handlers for authentications
  const handleCitizenLoginSuccess = async (citizenData) => {
    setCurrentUser(citizenData);
    setUserRole('citizen');
    await storage.setItem('auth_user', citizenData);
    await storage.setItem('auth_role', 'citizen');
  };

  const handleGovLoginSuccess = async (govUserData, token) => {
    let role = 'central_gov';
    const email = (govUserData?.email || '').toLowerCase();
    const roleStr = (govUserData?.role || '').toLowerCase();

    if (email.includes('ward') || roleStr.includes('ward')) {
      role = 'ward_gov';
    } else if (email.includes('maharashtra') || email.includes('state') || roleStr.includes('state')) {
      role = 'state_gov';
    } else {
      role = 'central_gov';
    }

    setCurrentUser(govUserData);
    setUserRole(role);
    await storage.setItem('auth_user', govUserData);
    await storage.setItem('auth_role', role);
    if (token) await storage.setItem('auth_token', token);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setUserRole(null);
    await storage.removeItem('auth_user');
    await storage.removeItem('auth_role');
    await storage.removeItem('auth_token');
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing Jan Setu Governance Portal...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.appRoot}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {!currentUser && (
        <UnifiedLogin
          citizenLanguage={citizenLanguage}
          onCitizenLoginSuccess={handleCitizenLoginSuccess}
          onGovLoginSuccess={handleGovLoginSuccess}
        />
      )}

      {currentUser && userRole === 'citizen' && (
        <CitizenFlow
          initialProfile={currentUser}
          initialLanguage={citizenLanguage}
          onLogout={handleLogout}
        />
      )}

      {currentUser && userRole === 'central_gov' && (
        <GovCentralDashboard
          user={currentUser}
          onLogout={handleLogout}
        />
      )}

      {currentUser && userRole === 'state_gov' && (
        <GovernmentDashboard
          govUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {currentUser && userRole === 'ward_gov' && (
        <GovWardDashboard
          govUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  }
});
