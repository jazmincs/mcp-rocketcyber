import fetch from 'node-fetch';

const BASE_URL_V3 = process.env.RC_BASE_URL || 'https://api-us.rocketcyber.com/v3';
const BASE_URL_V2 = 'https://api-us.rocketcyber.com/v2';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.RC_API_KEY}`,
  };
}

async function request(method, endpoint, params = null, baseUrl = BASE_URL_V3) {
  let url = `${baseUrl}${endpoint}`;
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

// --- ACCOUNT (v2) ---
export async function getAccount({ accountId }) {
  return request('GET', `/account/${accountId}`, null, BASE_URL_V2);
}

// --- LIST CUSTOMERS (sub-cuentas del provider via v2) ---
export async function listCustomers() {
  const providerId = process.env.RC_PROVIDER_ID || '99551';
  const provider = await request('GET', `/account/${providerId}`, null, BASE_URL_V2);
  if (!provider.customers || provider.customers.length === 0) {
    return { customers: [], total: 0 };
  }
  const results = await Promise.all(
    provider.customers.map(async (id) => {
      try {
        const acc = await request('GET', `/account/${id}`, null, BASE_URL_V2);
        return { id, name: acc.name, type: acc.type, status: acc.status };
      } catch {
        return { id, name: 'Error al obtener', type: null, status: null };
      }
    })
  );
  return { customers: results, total: results.length };
}

// --- AGENTS (v3) ---
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

// --- INCIDENTS (v3) ---
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

// --- APPS (v3) ---
export async function getApps({ accountId } = {}) {
  return request('GET', '/apps', {
    ...(accountId && { accountId }),
  });
}

// --- EVENTS (v3) ---
export async function getEvents({ accountId, appId, startDate, endDate, pageSize } = {}) {
  return request('GET', '/events', {
    ...(accountId && { accountId }),
    ...(appId && { appId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(pageSize && { pageSize }),
  });
}
