const PROD_API_BASE_URL = 'https://india-dev-intelligence-api-1037794417743.asia-south1.run.app/api';
const DEV_API_BASE_URL = 'http://localhost:5000/api';

/**
 * Resolves the appropriate API Base URL depending on environment and host.
 * - In local development (localhost / 127.0.0.1), connects to local backend http://localhost:5000/api.
 * - In production (e.g. jan-setu-gdg.web.app), connects to Google Cloud Run API.
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (isLocal) {
      return DEV_API_BASE_URL;
    }
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '' && envUrl !== '/api') {
    return envUrl.replace(/\/+$/, '');
  }

  return PROD_API_BASE_URL;
}

const BASE_URL = getApiBaseUrl();

/**
 * Safely parse response as JSON.
 * If the response is not valid JSON (e.g. HTML error page or SPA fallback),
 * constructs a detailed diagnostic error indicating HTTP status, request URL, Content-Type, and response preview.
 */
async function parseJsonResponse(response, requestUrl) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  let data = null;

  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      const truncatedText = text.length > 250 ? `${text.substring(0, 250)}...` : text;
      const errorMsg = `API Error: Expected JSON but received non-JSON response from [HTTP ${response.status} ${response.statusText}] ${requestUrl} (Content-Type: "${contentType || 'none'}"). Response: ${truncatedText.trim()}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.statusText = response.statusText;
      err.contentType = contentType;
      err.url = requestUrl;
      err.responseText = text;
      throw err;
    }
  } else {
    data = {};
  }

  if (!response.ok) {
    const errorMsg = (data && (data.error || data.message)) || `Request failed with HTTP status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.statusText = response.statusText;
    err.data = data;
    if (data) {
      if (data.remainingAttempts !== undefined) err.remainingAttempts = data.remainingAttempts;
      if (data.code !== undefined) err.code = data.code;
      if (data.isDuplicate !== undefined) err.isDuplicate = data.isDuplicate;
      if (data.matchedRequest !== undefined) err.matchedRequest = data.matchedRequest;
      if (data.cooldown !== undefined) err.cooldown = data.cooldown;
      if (data.categoryRestricted !== undefined) err.categoryRestricted = data.categoryRestricted;
    }
    throw err;
  }

  return data;
}

/**
 * Core API fetch helper
 */
async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = { ...options.headers };
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return parseJsonResponse(response, url);
}

export async function sendCitizenOtp(aadhaarNumber) {
  return apiRequest('/auth/citizen/send-otp', {
    method: 'POST',
    body: JSON.stringify({ aadhaarNumber }),
  });
}

export async function verifyCitizenOtp(txnId, otp, aadhaarNumber = null) {
  return apiRequest('/auth/citizen/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ txnId, otp, aadhaarNumber }),
  });
}

export async function verifyAadhaarMock(aadhaarNumber, mobile = null) {
  return apiRequest('/auth/verify-aadhaar', {
    method: 'POST',
    body: JSON.stringify({ aadhaarNumber, mobile }),
  });
}

export async function getDemoProfiles() {
  const data = await apiRequest('/auth/demo-profiles');
  return data.data;
}

export async function fetchCitizenRequests(citizenId) {
  const data = await apiRequest(`/citizen/requests?citizenId=${encodeURIComponent(citizenId)}`);
  return data.data;
}

export async function fetchCitizenCooldownStatus(citizenId) {
  return apiRequest(`/citizen/cooldown-status?citizenId=${encodeURIComponent(citizenId)}`);
}

export async function sendCitizenReminder(requestId, citizenId, notes = null) {
  return apiRequest(`/requests/${requestId}/remind`, {
    method: 'POST',
    body: JSON.stringify({ citizenId, notes }),
  });
}

export async function submitRequest(payload) {
  return apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function govLogin(email, password, requestedState = null) {
  return apiRequest('/auth/gov-login', {
    method: 'POST',
    body: JSON.stringify({ email, password, requestedState }),
  });
}

export async function fetchGovDashboardSummary(state = 'Maharashtra', district = null, userEmail = null) {
  const query = new URLSearchParams();
  if (state) query.append('state', state);
  if (district && district !== 'All' && district !== 'All Districts') query.append('district', district);

  const headers = {};
  if (userEmail) headers['x-gov-email'] = userEmail;

  const data = await apiRequest(`/dashboard/summary?${query.toString()}`, { headers });
  return data.data;
}

export async function fetchGovMapRequests(state = 'Maharashtra', district = null, category = null, urgency = null, userEmail = null) {
  const query = new URLSearchParams();
  if (state) query.append('state', state);
  if (district && district !== 'All' && district !== 'All Districts') query.append('district', district);
  if (category && category !== 'All') query.append('category', category);
  if (urgency && urgency !== 'All') query.append('urgency', urgency);

  const headers = {};
  if (userEmail) headers['x-gov-email'] = userEmail;

  const data = await apiRequest(`/map/requests?${query.toString()}`, { headers });
  return data.data || [];
}

export async function fetchGovHotspots(state = 'Maharashtra', district = null, userEmail = null) {
  const query = new URLSearchParams();
  if (state) query.append('state', state);
  if (district && district !== 'All' && district !== 'All Districts') query.append('district', district);

  const headers = {};
  if (userEmail) headers['x-gov-email'] = userEmail;

  const data = await apiRequest(`/regions/hotspots?${query.toString()}`, { headers });
  return data.data || [];
}

export async function fetchRegionalIntelligence(regionId, userEmail = null) {
  const headers = {};
  if (userEmail) headers['x-gov-email'] = userEmail;

  const data = await apiRequest(`/regions/${regionId}/intelligence`, { headers });
  return data.data;
}

export async function updateWardRequestsBatchStatus(regionId, payload, userEmail = null) {
  const headers = {};
  if (userEmail) headers['x-gov-email'] = userEmail;

  return apiRequest(`/regions/${regionId}/requests/batch-status`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

export async function resolveLocation(payload) {
  const data = await apiRequest('/regions/resolve', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function fetchRequests(params = {}, userEmail = null) {
  const query = new URLSearchParams();
  if (params.state && params.state !== 'All' && params.state !== 'National' && params.state !== 'All India') query.append('state', params.state);
  if (params.district && params.district !== 'All' && params.district !== 'All Districts') query.append('district', params.district);
  if (params.regionId) query.append('region_id', params.regionId);
  if (params.category && params.category !== 'All') query.append('category', params.category);
  if (params.urgency && params.urgency !== 'All') query.append('urgency', params.urgency);
  if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
  if (params.requestType && params.requestType !== 'All' && params.requestType !== 'all') query.append('request_type', params.requestType);
  if (params.request_type && params.request_type !== 'All' && params.request_type !== 'all') query.append('request_type', params.request_type);
  if (params.reminded) query.append('reminded', 'true');
  if (params.language && params.language !== 'All') query.append('language', params.language);
  if (params.status && params.status !== 'All') query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.limit) query.append('limit', params.limit);
  if (params.offset) query.append('offset', params.offset);

  const headers = {};
  if (userEmail) headers['x-gov-email'] = userEmail;

  return apiRequest(`/requests?${query.toString()}`, { headers });
}

export async function fetchRequestById(id) {
  const data = await apiRequest(`/requests/${id}`);
  return data.data;
}

export async function fetchStats() {
  const data = await apiRequest('/stats');
  return data.data;
}

export async function seedDemoData() {
  return apiRequest('/seed', { method: 'POST' });
}

/**
 * Fetch Structured AI Qualitative Intelligence Summary from Central Gemini Service
 */
export async function fetchAiSummary(params = {}, userEmail = null) {
  const query = new URLSearchParams();
  if (params.state && params.state !== 'All' && params.state !== 'National' && params.state !== 'All India') query.append('state', params.state);
  if (params.district && params.district !== 'All' && params.district !== 'All Districts') query.append('district', params.district);
  if (params.regionId) query.append('regionId', params.regionId);
  if (params.ward) query.append('ward', params.ward);
  if (params.category && params.category !== 'All' && params.category !== 'All Sectors') query.append('category', params.category);
  if (params.requestType && params.requestType !== 'All' && params.requestType !== 'all') query.append('requestType', params.requestType);
  if (params.request_type && params.request_type !== 'All' && params.request_type !== 'all') query.append('requestType', params.request_type);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.scopeLevel) query.append('scopeLevel', params.scopeLevel);

  const headers = {};
  if (userEmail) headers['x-gov-email'] = userEmail;

  const data = await apiRequest(`/ai/summary?${query.toString()}`, { headers });
  return data.data;
}

/**
 * Fetch Transparent Government Performance Statistics for Citizens
 */
export async function fetchGovernmentPerformance(params = {}) {
  const query = new URLSearchParams();
  if (params.period) query.append('period', params.period);
  if (params.state && params.state !== 'All' && params.state !== 'All India' && params.state !== 'National') query.append('state', params.state);
  if (params.district && params.district !== 'All' && params.district !== 'All Districts') query.append('district', params.district);
  if (params.ward && params.ward !== 'All') query.append('ward', params.ward);

  const data = await apiRequest(`/citizen/performance?${query.toString()}`);
  return data.data;
}

/**
 * Fetch Government Plans (Upcoming / Completed) for Citizens
 */
export async function fetchGovernmentPlans(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.category && params.category !== 'all' && params.category !== 'All Sectors' && params.category !== 'All') query.append('category', params.category);
  if (params.state && params.state !== 'All' && params.state !== 'All India') query.append('state', params.state);
  if (params.district && params.district !== 'All' && params.district !== 'All Districts') query.append('district', params.district);
  if (params.ward && params.ward !== 'All') query.append('ward', params.ward);
  if (params.village && params.village !== 'All') query.append('village', params.village);
  if (params.search) query.append('search', params.search);

  const data = await apiRequest(`/citizen/plans?${query.toString()}`);
  return data.plans || [];
}

/**
 * Fetch single Government Plan detail by ID
 */
export async function fetchGovernmentPlanById(id) {
  const data = await apiRequest(`/citizen/plans/${id}`);
  return data.plan;
}
