const express = require('express');
const router = express.Router();
const {
  createRequestHandler,
  getCitizenRequestsHandler,
  getCitizenCooldownStatusHandler,
  getGovernmentPerformanceHandler,
  getGovernmentPlansHandler,
  getGovernmentPlanByIdHandler,
  remindRequestHandler,
  getRequestsHandler,
  getRequestByIdHandler,
  getStatsHandler,
  seedDemoDataHandler
} = require('../controllers/requestsController');
const {
  verifyAadhaarMock,
  getDemoProfilesList,
  sendCitizenOtpHandler,
  verifyCitizenOtpHandler
} = require('../controllers/authController');
const {
  govLoginHandler,
  getDashboardSummaryHandler,
  getMapRequestsHandler
} = require('../controllers/dashboardController');
const {
  getRegionalIntelligenceHandler,
  getHotspotsHandler,
  resolveLocationHandler,
  batchUpdateWardRequestsStatusHandler
} = require('../controllers/regionalController');
const { getAiSummaryHandler, getAiMetricsHandler } = require('../controllers/aiController');
const { requireGovAuth } = require('../middleware/authMiddleware');
const googleCloudService = require('../services/googleCloudService');

// Google Cloud Language & Voice Services Architecture Endpoints
router.get('/cloud/status', (req, res) => {
  res.json(googleCloudService.getConnectionStatus());
});
router.post('/voice/speech-to-text', async (req, res) => {
  const result = await googleCloudService.transcribeAudio(req.body?.audio, req.body?.languageCode);
  res.status(result.connected ? 200 : 503).json(result);
});
router.post('/voice/text-to-speech', async (req, res) => {
  const result = await googleCloudService.synthesizeSpeech(req.body?.text, req.body?.languageCode);
  res.status(result.connected ? 200 : 503).json(result);
});
router.post('/translate', async (req, res) => {
  const result = await googleCloudService.translateText(req.body?.text, req.body?.targetLanguage, req.body?.sourceLanguage);
  res.status(result.connected ? 200 : 503).json(result);
});
router.post('/dialogflow/detect-intent', async (req, res) => {
  const result = await googleCloudService.detectIntent(req.body?.queryText, req.body?.sessionId, req.body?.languageCode);
  res.status(result.connected ? 200 : 503).json(result);
});

// Central AI Structured Intelligence Summary & Telemetry Endpoints
router.get('/ai/summary', requireGovAuth, getAiSummaryHandler);
router.post('/ai/summary', requireGovAuth, getAiSummaryHandler);
router.get('/ai/metrics', getAiMetricsHandler);

// Citizen Mock Aadhaar & OTP Auth Endpoints
router.post('/auth/citizen/send-otp', sendCitizenOtpHandler);
router.post('/auth/citizen/verify-otp', verifyCitizenOtpHandler);
router.post('/auth/verify-aadhaar', verifyAadhaarMock);
router.get('/auth/demo-profiles', getDemoProfilesList);

// Government Portal Auth Endpoints
router.post('/auth/gov-login', govLoginHandler);

// Government Dashboard Analytics & Map Endpoints (with regional authorization)
router.get('/dashboard/summary', requireGovAuth, getDashboardSummaryHandler);
router.get('/map/requests', requireGovAuth, getMapRequestsHandler);

// Phase 2A: Regional Intelligence & Hotspots Endpoints
router.get('/regions/hotspots', requireGovAuth, getHotspotsHandler);
router.get('/regions/:id/intelligence', requireGovAuth, getRegionalIntelligenceHandler);
router.post('/regions/:id/requests/batch-status', requireGovAuth, batchUpdateWardRequestsStatusHandler);
router.post('/regions/resolve', resolveLocationHandler);

// Citizen Specific Requests, Cooldown Status & Government Performance
router.get('/citizen/requests', getCitizenRequestsHandler);
router.get('/citizen/cooldown-status', getCitizenCooldownStatusHandler);
router.get('/citizen/performance', getGovernmentPerformanceHandler);
router.get('/citizen/plans', getGovernmentPlansHandler);
router.get('/citizen/plans/:id', getGovernmentPlanByIdHandler);
router.get('/plans', getGovernmentPlansHandler);
router.get('/plans/:id', getGovernmentPlanByIdHandler);

// Submit citizen request (text or voice)
router.post('/requests', createRequestHandler);

// Remind existing request (7-day rule)
router.post('/requests/:id/remind', remindRequestHandler);

// Retrieve requests with filtering, searching, pagination (Government Dashboard)
router.get('/requests', requireGovAuth, getRequestsHandler);

// Retrieve individual request detail
router.get('/requests/:id', getRequestByIdHandler);

// Retrieve general dashboard statistics
router.get('/stats', getStatsHandler);

// Seed demonstration data
router.post('/seed', seedDemoDataHandler);

module.exports = router;
