<<<<<<< HEAD
const fs = require('fs');
const path = require('path');

function loadCitizenProfiles() {
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'data', 'sample', 'citizen_profiles.json'),
    path.join(__dirname, '..', 'data', 'demo', 'citizen_profiles.json'),
    path.join(__dirname, '..', 'data', 'sample', 'citizen_profiles.json')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        console.warn('Error reading citizen profiles JSON from', p, e.message);
      }
    }
  }
  return [];
}

function loadGovTiers() {
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'data', 'sample', 'government_tiers.json'),
    path.join(__dirname, '..', 'data', 'demo', 'government_tiers.json'),
    path.join(__dirname, '..', 'data', 'sample', 'government_tiers.json')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        console.warn('Error reading gov tiers JSON from', p, e.message);
      }
    }
  }
  return {};
=======
const path = require('path');
let DEMO_PROFILES = [];
try {
  DEMO_PROFILES = require(path.join(__dirname, '../../data/sample/citizens.json'));
} catch (e) {
  console.warn('Could not load sample citizens:', e.message);
>>>>>>> dd0e3a88bd0e5dd9f6a8e5d67bd84003398e3618
}

const { generateOtp, verifyOtp, maskAadhaarNumber, maskMobileNumber } = require('../services/otpService');

/**
 * Step 1: Send OTP to Citizen's registered mobile after Aadhaar validation
 * Endpoint: POST /api/auth/citizen/send-otp
 */
function sendCitizenOtpHandler(req, res) {
  try {
    const { aadhaarNumber } = req.body;
    const cleanAadhaar = (aadhaarNumber || '').toString().replace(/\D/g, '');

    if (cleanAadhaar.length !== 12) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 12-digit Aadhaar number.'
      });
    }

    // Match against database / demo profiles
    const profiles = loadCitizenProfiles();
    const suffix = cleanAadhaar.slice(-4);
    const matched = profiles.find(p => p.aadhaarSuffix === suffix) || profiles[0] || {
      name: 'Verified Citizen',
      mobile: '98000 00000',
      address: 'Registered Location',
      district: 'Pune',
      state: 'Maharashtra',
      defaultLanguage: 'mr',
      lat: 18.8475,
      lng: 73.9167
    };

    const citizenProfile = {
      citizenId: `CIT-${cleanAadhaar.slice(0, 4)}-${suffix}`,
      name: matched.name,
      mobile: matched.mobile,
      address: matched.address,
      district: matched.district,
      state: matched.state,
      defaultLanguage: matched.defaultLanguage,
      coordinates: {
        latitude: matched.lat,
        longitude: matched.lng
      },
      verifiedAt: new Date().toISOString()
    };

    const otpResult = generateOtp(cleanAadhaar, citizenProfile);

    return res.status(200).json({
      success: true,
      message: 'OTP has been sent to your registered mobile number.',
      data: {
        txnId: otpResult.txnId,
        maskedAadhaar: otpResult.maskedAadhaar,
        maskedMobile: otpResult.maskedMobile,
        expiresIn: otpResult.expiresIn
      }
    });

  } catch (err) {
    console.error('[Auth Controller] Error in sendCitizenOtpHandler:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to dispatch OTP. Please try again.'
    });
  }
}

/**
 * Step 2: Verify OTP and return authenticated citizen details
 * Endpoint: POST /api/auth/citizen/verify-otp
 */
function verifyCitizenOtpHandler(req, res) {
  try {
    const { txnId, otp, aadhaarNumber } = req.body;

    if (!txnId) {
      return res.status(400).json({
        success: false,
        error: 'OTP transaction ID is required.'
      });
    }

    if (!otp || otp.toString().trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit numeric OTP.'
      });
    }

    const verifyResult = verifyOtp(txnId, otp);

    if (!verifyResult.success) {
      const status = verifyResult.code === 'TOO_MANY_ATTEMPTS' ? 429 : 400;
      return res.status(status).json({
        success: false,
        error: verifyResult.error,
        code: verifyResult.code,
        remainingAttempts: verifyResult.remainingAttempts
      });
    }

    const citizen = verifyResult.citizenData;

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Aadhaar OTP verification successful.',
      data: citizen,
      citizen,
      token: citizen.citizenId
    });

  } catch (err) {
    console.error('[Auth Controller] Error in verifyCitizenOtpHandler:', err);
    return res.status(500).json({
      success: false,
      error: 'OTP verification failed. Please try again.'
    });
  }
}

function verifyAadhaarMock(req, res) {
  try {
    const { aadhaarNumber, mobile } = req.body;
    
    // Clean string input (remove spaces/hyphens)
    const cleaned = (aadhaarNumber || '').replace(/\D/g, '');
    
    if (cleaned.length !== 12) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 12-digit Aadhaar number for mock verification.'
      });
    }

    // Find matching demo profile or pick by last 4 digits / default
    const profiles = loadCitizenProfiles();
    const suffix = cleaned.slice(-4);
    let matchedProfile = profiles.find(p => p.aadhaarSuffix === suffix) || profiles[0] || {
      name: 'Verified Citizen',
      mobile: mobile || '98000 00000',
      address: 'Registered Location',
      district: 'Pune',
      state: 'Maharashtra',
      defaultLanguage: 'mr',
      lat: 18.8475,
      lng: 73.9167
    };

    // Generate internal safe citizen identifier (NEVER stores or returns real Aadhaar)
    const citizenId = `CIT-${cleaned.slice(0, 4)}-${suffix}`;
    const maskedAadhaar = `XXXX XXXX ${suffix}`;

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Identity verification successful (Mock Sandbox).',
      data: {
        citizenId,
        maskedAadhaar,
        name: matchedProfile.name,
        mobile: mobile || matchedProfile.mobile,
        address: matchedProfile.address,
        district: matchedProfile.district,
        state: matchedProfile.state,
        defaultLanguage: matchedProfile.defaultLanguage,
        coordinates: {
          latitude: matchedProfile.lat,
          longitude: matchedProfile.lng
        },
        verifiedAt: new Date().toISOString(),
        isDemoMock: true
      }
    });

  } catch (err) {
    console.error('Error during Aadhaar mock verification:', err);
    return res.status(500).json({
      success: false,
      error: 'Identity verification could not be completed. Please try again.'
    });
  }
}

function getDemoProfilesList(req, res) {
  const profiles = loadCitizenProfiles();
  const safeList = profiles.map((p, idx) => ({
    id: idx + 1,
    sampleAadhaar: `XXXX XXXX ${p.aadhaarSuffix}`,
    sampleAadhaarRaw: `23456789${p.aadhaarSuffix}`,
    name: p.name,
    district: p.district,
    state: p.state,
    language: p.defaultLanguage
  }));
  res.json({ success: true, data: safeList });
}

function getDemoGovTiersList(req, res) {
  const tiers = loadGovTiers();
  res.json({ success: true, data: tiers });
}

module.exports = {
  sendCitizenOtpHandler,
  verifyCitizenOtpHandler,
  verifyAadhaarMock,
  getDemoProfilesList,
  getDemoGovTiersList
};
