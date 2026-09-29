import { APP_CONFIG } from '../config/appConfig';

const API_BASE = APP_CONFIG.apiBaseUrl;

// Helper to make standardized fetch requests
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

// 1. Citizen Identity & Authentication APIs
export async function sendCitizenOtp(aadhaarNumber) {
  return request('/auth/citizen/send-otp', {
    method: 'POST',
    body: JSON.stringify({ aadhaarNumber })
  });
}

export async function verifyCitizenOtp(txnId, otp, aadhaarNumber = null) {
  return request('/auth/citizen/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ txnId, otp, aadhaarNumber })
  });
}

export async function getDemoProfiles() {
  const res = await request('/auth/demo-profiles');
  return res?.data || res || [];
}

export async function verifyAadhaarMock(aadhaarNumber, mobile = '') {
  return request('/auth/verify-aadhaar', {
    method: 'POST',
    body: JSON.stringify({ aadhaarNumber, mobile })
  });
}

// 2. Government Authentication APIs
export async function govLogin(payloadOrEmail, maybePassword) {
  const body = typeof payloadOrEmail === 'object'
    ? payloadOrEmail
    : { email: payloadOrEmail, password: maybePassword };
  return request('/auth/gov-login', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// 3. Citizen Requests & Submissions APIs
export async function submitRequest(payload) {
  return request('/requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchCitizenRequests(citizenId) {
  const data = await request(`/citizen/requests?citizenId=${encodeURIComponent(citizenId)}`);
  return data.data || [];
}

export async function fetchCitizenCooldownStatus(citizenId) {
  return request(`/citizen/cooldown-status?citizenId=${encodeURIComponent(citizenId)}`);
}

export async function sendCitizenReminder(requestId, citizenId, citizenName) {
  return request(`/requests/${requestId}/remind`, {
    method: 'POST',
    body: JSON.stringify({ citizenId, citizenName })
  });
}

export async function fetchGovernmentPerformance(period = 'all') {
  return request(`/citizen/performance?period=${encodeURIComponent(period)}`);
}

export async function fetchGovernmentPlans(category = '', status = '') {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (status && status !== 'ALL') params.append('status', status);
  return request(`/citizen/plans?${params.toString()}`);
}

export async function fetchGovernmentPlanById(id) {
  return request(`/citizen/plans/${id}`);
}

// 4. Government Dashboard Analytics & Spatial Intelligence
export async function fetchGovDashboardSummary(state = 'Maharashtra', district = null, token = null) {
  let endpoint = `/dashboard/summary?state=${encodeURIComponent(state)}`;
  if (district) endpoint += `&district=${encodeURIComponent(district)}`;
  return request(endpoint, {
    headers: token ? { Authorization: token } : {}
  });
}

export async function fetchGovMapRequests(state = 'Maharashtra', district = null, category = null, urgency = null, token = null) {
  const params = new URLSearchParams({ state });
  if (district) params.append('district', district);
  if (category && category !== 'All') params.append('category', category);
  if (urgency && urgency !== 'All') params.append('urgency', urgency);
  return request(`/map/requests?${params.toString()}`, {
    headers: token ? { Authorization: token } : {}
  });
}

export async function fetchGovHotspots(state = 'Maharashtra', district = null, token = null) {
  let endpoint = `/regions/hotspots?state=${encodeURIComponent(state)}`;
  if (district) endpoint += `&district=${encodeURIComponent(district)}`;
  return request(endpoint, {
    headers: token ? { Authorization: token } : {}
  });
}

export async function fetchRegionalIntelligence(regionId, token = null) {
  return request(`/regions/${regionId}/intelligence`, {
    headers: token ? { Authorization: token } : {}
  });
}

export async function updateWardRequestsBatchStatus(regionId, requestIds, status, notes = '', token = null) {
  return request(`/regions/${regionId}/requests/batch-status`, {
    method: 'POST',
    headers: token ? { Authorization: token } : {},
    body: JSON.stringify({ requestIds, status, notes })
  });
}

export async function resolveLocationCoordinates(latitude, longitude, manualHint = '') {
  return request('/regions/resolve', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, manualHint })
  });
}

export async function fetchRequests(filters = {}, token = null) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'All') {
      params.append(k, v);
    }
  });
  return request(`/requests?${params.toString()}`, {
    headers: token ? { Authorization: token } : {}
  });
}

export async function fetchRequestById(id) {
  return request(`/requests/${id}`);
}

// 5. AI & Cloud Services
export async function fetchAiSummary(filters = {}, token = null) {
  return request('/ai/summary', {
    method: 'POST',
    headers: token ? { Authorization: token } : {},
    body: JSON.stringify(filters)
  });
}

export async function fetchAiMetrics() {
  return request('/ai/metrics');
}

export async function fetchCloudStatus() {
  return request('/cloud/status');
}

export default {
  sendCitizenOtp,
  verifyCitizenOtp,
  getDemoProfiles,
  verifyAadhaarMock,
  govLogin,
  submitRequest,
  fetchCitizenRequests,
  fetchCitizenCooldownStatus,
  sendCitizenReminder,
  fetchGovernmentPerformance,
  fetchGovernmentPlans,
  fetchGovernmentPlanById,
  fetchGovDashboardSummary,
  fetchGovMapRequests,
  fetchGovHotspots,
  fetchRegionalIntelligence,
  updateWardRequestsBatchStatus,
  resolveLocationCoordinates,
  fetchRequests,
  fetchRequestById,
  fetchAiSummary,
  fetchAiMetrics,
  fetchCloudStatus
};
