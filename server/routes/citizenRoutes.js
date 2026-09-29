const express = require('express');
const router = express.Router();
const {
  getCitizenRequestsHandler,
  getCitizenCooldownStatusHandler,
  getGovernmentPerformanceHandler,
  getGovernmentPlansHandler,
  getGovernmentPlanByIdHandler
} = require('../controllers/requestsController');

// Citizen-Specific Requests, Cooldown Status, Plans & Government Performance
router.get('/citizen/requests', getCitizenRequestsHandler);
router.get('/citizen/cooldown-status', getCitizenCooldownStatusHandler);
router.get('/citizen/performance', getGovernmentPerformanceHandler);
router.get('/citizen/plans', getGovernmentPlansHandler);
router.get('/citizen/plans/:id', getGovernmentPlanByIdHandler);
router.get('/plans', getGovernmentPlansHandler);
router.get('/plans/:id', getGovernmentPlanByIdHandler);

module.exports = router;
