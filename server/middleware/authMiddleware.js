const db = require('../db');

/**
 * Government Authentication & Regional Authorization Middleware
 * Enforces that government users must be authenticated and only access their authorized regional scope.
 */
function requireGovAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const govUserEmail = req.headers['x-gov-email'] || req.query.govUserEmail;

  if (!govUserEmail && !authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Government authentication required. Please log in.'
    });
  }

  const emailToLookup = govUserEmail || (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : '');

  if (!emailToLookup || !emailToLookup.trim()) {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication header. Please log in.'
    });
  }

  db.getGovernmentUserByEmail(emailToLookup.trim().toLowerCase())
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Official government credentials not recognized. Please log in again.'
        });
      }

      req.govUser = user;

      // 1. Enforce ward monitoring access constraint
      if (user.role === 'ward_monitor') {
        if (req.query.state && req.query.state !== user.monitoring_state && req.query.state !== 'All') {
          return res.status(403).json({
            success: false,
            error: `Access Denied: You are authorized to monitor only ${user.monitoring_ward || user.monitoring_state}.`
          });
        }
        if (req.query.district && user.monitoring_district && req.query.district !== user.monitoring_district) {
          return res.status(403).json({
            success: false,
            error: `Access Denied: You are authorized to monitor only district ${user.monitoring_district}.`
          });
        }
        if (req.query.region_id && user.region_id && parseInt(req.query.region_id, 10) !== parseInt(user.region_id, 10)) {
          return res.status(403).json({
            success: false,
            error: `Access Denied: You are authorized to monitor only ward region ${user.region_id}.`
          });
        }
        // Enforce the ward scope on queries
        req.query.state = user.monitoring_state;
        if (user.monitoring_district) req.query.district = user.monitoring_district;
        if (user.region_id) req.query.region_id = user.region_id;
      }
      // 2. Enforce state monitoring access constraint
      else if (user.role !== 'admin' && user.monitoring_state !== 'All India') {
        if (req.query.state && req.query.state !== user.monitoring_state && req.query.state !== 'All') {
          return res.status(403).json({
            success: false,
            error: `Access Denied: You are authorized to monitor only ${user.monitoring_state}.`
          });
        }
        // Enforce the state scope on queries
        req.query.state = user.monitoring_state;
      }

      next();
    })
    .catch((err) => {
      console.error('[Auth Middleware Error]:', err);
      return res.status(500).json({
        success: false,
        error: 'Authentication verification failed due to internal error.'
      });
    });
}

/**
 * Enforces Central Government / National Admin role authorization
 */
function requireCentralAdminAuth(req, res, next) {
  requireGovAuth(req, res, () => {
    const user = req.govUser;
    if (!user || (user.role !== 'admin' && user.monitoring_state !== 'All India')) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Central Government authorization is required for this action.'
      });
    }
    next();
  });
}

module.exports = {
  requireGovAuth,
  requireCentralAdminAuth
};
