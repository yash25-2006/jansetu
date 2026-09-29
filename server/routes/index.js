const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const aiRoutes = require('./aiRoutes');
const cloudRoutes = require('./cloudRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const regionalRoutes = require('./regionalRoutes');
const citizenRoutes = require('./citizenRoutes');
const {
  createRequestHandler,
  remindRequestHandler,
  getRequestsHandler,
  getRequestByIdHandler,
  getStatsHandler,
  seedDemoDataHandler
} = require('../controllers/requestsController');
const { requireGovAuth } = require('../middleware/authMiddleware');

// Mount Sub-routers
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use(cloudRoutes);
router.use(dashboardRoutes);
router.use(regionalRoutes);
router.use(citizenRoutes);

// General Request & System Endpoints
router.post('/requests', createRequestHandler);
router.post('/requests/:id/remind', remindRequestHandler);
router.get('/requests', requireGovAuth, getRequestsHandler);
router.get('/requests/:id', getRequestByIdHandler);
router.get('/stats', getStatsHandler);
router.post('/seed', seedDemoDataHandler);

module.exports = router;
