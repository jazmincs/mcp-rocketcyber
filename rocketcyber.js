import fetch from 'node-fetch';

const BASE_URL = process.env.RC_BASE_URL || 'https://api-us.rocketcyber.com/v3';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.RC_API_KEY}`,
  };
}

async function request(method, endpoint, params = null) {
  let url = `${BASE_URL}${endpoint}`;
  if (params && method === 'GET') {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
    );
    if (query.toString()) url += `?${query.toString()}`;
  }
  const options = { method, headers: getHeaders() };
  if (params && method !== 'GET') options.body = JSON.stringify(params);

  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`RocketCyber API error ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

// --- ACCOUNTS ---
export async function getAccount({ accountId }) {
  return request('GET', `/account/${accountId}`);
}

export async function getAccounts({ page = 1, limit = 25 } = {}) {
  return request('GET', '/account', { page, limit });
}

// --- AGENTS (dispositivos) ---
export async function getAgents({ accountId, page = 1, limit = 25, filterBy, sortBy, order } = {}) {
  return request('GET', `/account/${accountId}/agent`, {
    page, limit,
    ...(filterBy && { filterBy }),
    ...(sortBy && { sortBy }),
    ...(order && { order }),
  });
}

export async function getAgent({ agentId }) {
  return request('GET', `/agent/${agentId}`);
}

// --- INCIDENTS ---
export async function getIncidents({ accountId, page = 1, limit = 25, status, appId } = {}) {
  return request('GET', `/account/${accountId}/incident`, {
    page, limit,
    ...(status && { status }),
    ...(appId && { appId }),
  });
}

export async function getIncident({ incidentId }) {
  return request('GET', `/incident/${incidentId}`);
}

export async function updateIncident({ incidentId, status }) {
  // status: open, resolved, false-positive
  return request('PUT', `/incident/${incidentId}`, { status });
}

// --- APPS (monitores SOC) ---
export async function getApps({ accountId, page = 1, limit = 25 } = {}) {
  return request('GET', `/account/${accountId}/app`, { page, limit });
}

// --- EVENTS ---
export async function getEvents({ accountId, page = 1, limit = 25, appId, startDate, endDate } = {}) {
  return request('GET', `/account/${accountId}/event`, {
    page, limit,
    ...(appId && { appId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });
}
