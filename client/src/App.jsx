<<<<<<< HEAD
import React, { useState, useEffect, Suspense, lazy } from 'react';
import StartupPermissionModal from './components/common/StartupPermissionModal';

// Route-level code splitting for optimized bundles
=======
import React, { useState, useEffect, lazy, Suspense } from 'react';
import StartupPermissionModal from './components/common/StartupPermissionModal';

>>>>>>> dd0e3a88bd0e5dd9f6a8e5d67bd84003398e3618
const UnifiedLogin = lazy(() => import('./pages/auth/UnifiedLogin'));
const CitizenFlow = lazy(() => import('./pages/citizen/CitizenFlow'));
const GovCentralDashboard = lazy(() => import('./pages/central-government/GovCentralDashboard'));
const GovernmentDashboard = lazy(() => import('./pages/state-government/GovernmentDashboard'));
const GovWardDashboard = lazy(() => import('./pages/ward-government/GovWardDashboard'));

function LoadingFallback() {
  return (
<<<<<<< HEAD
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9]">
      <div className="flex flex-col items-center space-y-4 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
        <div className="w-10 h-10 border-3 border-[#002B49] border-t-[#FF9933] rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 animate-pulse">
          Loading India Development Intelligence...
        </p>
      </div>
=======
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-300 font-medium tracking-wide">Loading Jan Setu...</p>
>>>>>>> dd0e3a88bd0e5dd9f6a8e5d67bd84003398e3618
    </div>
  );
}

export default function App() {
  // Startup Permissions Completed State
  const [hasCompletedStartupPerms, setHasCompletedStartupPerms] = useState(() => {
    try {
      return sessionStorage.getItem('idip_startup_perms_completed') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Global UI Language State
  const [appLanguage, setAppLanguage] = useState(() => {
    try {
      return localStorage.getItem('idip_language') || sessionStorage.getItem('idip_language') || 'mr';
    } catch (e) {
      return 'mr';
    }
  });

  // Authentication Session State: null | { type: 'citizen', profile, language } | { type: 'government', level: 'central'|'state'|'ward', user }
  const [authSession, setAuthSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem('idip_auth_session');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Sync session changes to sessionStorage
  useEffect(() => {
    try {
      if (authSession) {
        sessionStorage.setItem('idip_auth_session', JSON.stringify(authSession));
      } else {
        sessionStorage.removeItem('idip_auth_session');
      }
    } catch (e) {
      console.warn('Could not persist auth session:', e);
    }
  }, [authSession]);

  // Handle Startup Permission Grant
  const handleStartupPermissionsGranted = ({ language, coords, locationGranted }) => {
    try {
      sessionStorage.setItem('idip_startup_perms_completed', 'true');
      if (language) {
        setAppLanguage(language);
        localStorage.setItem('idip_language', language);
        sessionStorage.setItem('idip_language', language);
      }
      if (coords) {
        sessionStorage.setItem('idip_user_coords', JSON.stringify(coords));
      }
    } catch (e) {
      console.warn('Error saving startup perms info:', e);
    }
    setHasCompletedStartupPerms(true);
  };

  // Citizen Login Callback
  const handleCitizenLoginSuccess = (profile, language = appLanguage) => {
    const session = {
      type: 'citizen',
      profile,
      language: language || appLanguage
    };
    setAuthSession(session);
  };

  // Government Login Callback (Role & Level determined strictly by backend user profile)
  const handleGovLoginSuccess = (user) => {
    let level = 'state';
    if (user.role === 'admin' || user.monitoringState === 'All India' || user.monitoring_state === 'All India') {
      level = 'central';
    } else if (user.role === 'ward_monitor' || user.region_id || user.monitoring_ward) {
      level = 'ward';
    } else {
      level = 'state';
    }

    const session = {
      type: 'government',
      level,
      user
    };
    setAuthSession(session);
  };

  // Common Logout Callback
  const handleLogout = () => {
    sessionStorage.removeItem('idip_auth_session');
    setAuthSession(null);
  };

  // 0. Initial Launch -> Show Startup Permission + Language Selection Popup
  if (!hasCompletedStartupPerms && !authSession) {
    return (
      <div className="relative min-h-screen bg-slate-900">
        <StartupPermissionModal
          initialLanguage={appLanguage}
          onPermissionsGranted={handleStartupPermissionsGranted}
        />
      </div>
    );
  }

  // 1. Unauthenticated -> Show Unified Common Login Screen
  if (!authSession) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <UnifiedLogin
          citizenLanguage={appLanguage}
          onCitizenLoginSuccess={handleCitizenLoginSuccess}
          onGovLoginSuccess={handleGovLoginSuccess}
        />
      </Suspense>
    );
  }

  // 2. Authenticated Citizen Portal
  if (authSession.type === 'citizen') {
    return (
      <div className="relative min-h-screen flex flex-col bg-[#F4F6F9]">
        {/* Citizen Background Wallpaper */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 transition-opacity"
            style={{ backgroundImage: `url('/citizen-bg.jpg')` }}
          />
        </div>
        <div className="relative z-10 flex-1">
          <Suspense fallback={<LoadingFallback />}>
            <CitizenFlow
              initialProfile={authSession.profile}
              initialLanguage={authSession.language}
              onLogout={handleLogout}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  // 3. Authenticated Government Portal
  if (authSession.type === 'government') {
    const { level, user } = authSession;

    return (
      <div className="relative min-h-screen flex flex-col bg-[#F4F6F9]">
        {/* Government Portal Background Wallpaper & Logos */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85 transition-opacity"
            style={{ backgroundImage: `url('/gov-bg.jpg')` }}
          />

          {/* Wallpaper Overlay Logos (Hidden on Ward Government) */}
          {level !== 'ward' && (
            <>
              {/* Top-Left: Government of India Logo */}
              <div className="absolute top-10 left-4 sm:top-12 sm:left-6 md:left-8 z-0">
                <img
                  src="/gov-emblem.png"
                  alt="Government of India"
                  className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto object-contain opacity-95 drop-shadow-md"
                />
              </div>

              {/* Top-Right: Digital India Logo */}
              <div className="absolute top-12 right-4 sm:top-14 sm:right-6 md:right-8 z-0">
                <img
                  src="/digital-india.png"
                  alt="Digital India"
                  className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto object-contain opacity-95 drop-shadow-md"
                />
              </div>
            </>
          )}
        </div>

        <div className="relative z-10 flex-1">
          <Suspense fallback={<LoadingFallback />}>
            {level === 'central' ? (
              <GovCentralDashboard
                govUser={user}
                onLogout={handleLogout}
                onSwitchToStateView={(st) => {
                  setAuthSession((prev) => ({
                    ...prev,
                    level: 'state',
                    user: {
                      ...prev.user,
                      name: `National Admin (${st} Drilldown)`,
                      monitoringState: st,
                      monitoring_state: st
                    }
                  }));
                }}
              />
            ) : level === 'ward' ? (
              <GovWardDashboard
                govUser={user}
                onLogout={handleLogout}
              />
            ) : (
              <GovernmentDashboard
                govUser={user}
                onLogout={handleLogout}
                onBackToCentral={
                  user?.role === 'admin'
                    ? () => setAuthSession((prev) => ({ ...prev, level: 'central' }))
                    : null
                }
                onChangeState={
                  user?.role === 'admin'
                    ? (st) =>
                        setAuthSession((prev) => ({
                          ...prev,
                          user: { ...prev.user, monitoringState: st, monitoring_state: st }
                        }))
                    : null
                }
              />
            )}
          </Suspense>
        </div>
      </div>
    );
  }

  // Fallback -> Common Login
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnifiedLogin
        onCitizenLoginSuccess={handleCitizenLoginSuccess}
        onGovLoginSuccess={handleGovLoginSuccess}
      />
    </Suspense>
  );
}
