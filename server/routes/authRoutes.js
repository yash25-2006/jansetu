const express = require('express');
const router = express.Router();
const {
  verifyAadhaarMock,
  getDemoProfilesList,
  getDemoGovTiersList,
  sendCitizenOtpHandler,
  verifyCitizenOtpHandler
} = require('../controllers/authController');
const { govLoginHandler } = require('../controllers/dashboardController');

// Citizen Aadhaar & OTP Auth Endpoints
router.post('/citizen/send-otp', sendCitizenOtpHandler);
router.post('/citizen/verify-otp', verifyCitizenOtpHandler);
router.post('/verify-aadhaar', verifyAadhaarMock);
router.get('/demo-profiles', getDemoProfilesList);
router.get('/demo-gov-tiers', getDemoGovTiersList);

// Government Portal Auth Endpoints
router.post('/gov-login', govLoginHandler);

module.exports = router;
