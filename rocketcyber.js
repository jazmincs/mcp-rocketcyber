import fetch from 'node-fetch';

const BASE_URL = process.env.RC_BASE_URL || 'https://api-us.rocketcyber.com/v2';

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
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
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

// --- ACCOUNT ---
export async function getAccount({ accountId }) {
  return request('GET', `/account/${accountId}`);
}

// --- AGENTS ---
export async function getAgents({ accountId, filterBy, filterValue, sortBy, orderBy } = {}) {
  // filterBy: 'connectivity', filterValue: 'online'|'offline'|'isolated'
  return request('GET', `/account/${accountId}/agents`, {
    ...(filterBy && { filterBy }),
    ...(filterValue && { filterValue }),
    ...(sortBy && { sortBy }),
    ...(orderBy && { orderBy }),
  });
}

export async function getAgent({ agentId }) {
  return request('GET', `/agent/${agentId}`);
}

// --- INCIDENTS ---
export async function getIncidents({ accountId, status, appId, page, limit } = {}) {
  return request('GET', `/account/${accountId}/incidents`, {
    ...(status && { status }),
    ...(appId && { appId }),
    ...(page && { page }),
    ...(limit && { limit }),
  });
}

export async function getIncident({ incidentId }) {
  return request('GET', `/incident/${incidentId}`);
}

export async function updateIncident({ incidentId, status }) {
  return request('PUT', `/incident/${incidentId}`, { status });
}

// --- APPS ---
export async function getApps({ accountId } = {}) {
  return request('GET', `/account/${accountId}/apps`);
}

// --- EVENTS ---
export async function getEvents({ accountId, appId, startDate, endDate, page, limit } = {}) {
  return request('GET', `/account/${accountId}/events`, {
    ...(appId && { appId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(page && { page }),
    ...(limit && { limit }),
  });
}
