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

// --- AGENTS (global, filtrable por accountId) ---
export async function getAgents({ accountId, filterBy, filterValue, sortBy, orderBy, pageSize } = {}) {
  return request('GET', '/agents', {
    ...(accountId && { accountId }),
    ...(filterBy && { filterBy }),
    ...(filterValue && { filterValue }),
    ...(sortBy && { sortBy }),
    ...(orderBy && { orderBy }),
    ...(pageSize && { pageSize }),
  });
}

export async function getAgent({ agentId }) {
  return request('GET', `/agents/${agentId}`);
}

// --- INCIDENTS ---
export async function getIncidents({ accountId, status, appId, pageSize } = {}) {
  return request('GET', '/incidents', {
    ...(accountId && { accountId }),
    ...(status && { status }),
    ...(appId && { appId }),
    ...(pageSize && { pageSize }),
  });
}

export async function getIncident({ incidentId }) {
  return request('GET', `/incidents/${incidentId}`);
}

export async function updateIncident({ incidentId, status }) {
  return request('PUT', `/incidents/${incidentId}`, { status });
}

// --- APPS ---
export async function getApps({ accountId } = {}) {
  return request('GET', '/apps', {
    ...(accountId && { accountId }),
  });
}

// --- EVENTS ---
export async function getEvents({ accountId, appId, startDate, endDate, pageSize } = {}) {
  return request('GET', '/events', {
    ...(accountId && { accountId }),
    ...(appId && { appId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(pageSize && { pageSize }),
  });
}
