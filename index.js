import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import * as RC from './rocketcyber.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mcp-rocketcyber', timestamp: new Date().toISOString() });
});

app.all('/mcp', async (req, res) => {

  // --- AUTENTICACIÓN: Bearer header o query param ?token= ---
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const queryToken = req.query.token || '';
  const token = bearerToken || queryToken;
  if (process.env.MCP_SECRET_TOKEN && token !== process.env.MCP_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const server = new McpServer({ name: 'rocketcyber-mcp', version: '2.0.0' });

  // --- TOOL: get_account ---
  server.tool('get_account',
    'Obtiene información de una cuenta/cliente de RocketCyber: nombre, jerarquía, tipo, estado, lista de sub-cuentas.',
    { accountId: z.number().describe('ID de la cuenta en RocketCyber') },
    async ({ accountId }) => {
      const r = await RC.getAccount({ accountId });
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  // --- TOOL: list_agents ---
  server.tool('list_agents',
    'Lista los agentes/dispositivos de una cuenta. Filtra por conectividad: online, offline, isolated.',
    {
      accountId: z.number().describe('ID de la cuenta'),
      filterBy: z.string().optional().describe('Campo a filtrar. Usar: connectivity'),
      filterValue: z.enum(['online', 'offline', 'isolated']).optional().describe('Valor del filtro de conectividad'),
      sortBy: z.enum(['id', 'hostname', 'agentVersion', 'lastConnected']).optional(),
      orderBy: z.enum(['asc', 'desc']).optional(),
    },
    async (p) => {
      const r = await RC.getAgents(p);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  // --- TOOL: get_agent ---
  server.tool('get_agent',
    'Obtiene detalles completos de un agente: OS, IP, versión, última conexión, estado.',
    { agentId: z.string().describe('ID del agente') },
    async ({ agentId }) => {
      const r = await RC.getAgent({ agentId });
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  // --- TOOL: list_incidents ---
  server.tool('list_incidents',
    'Lista los incidentes SOC de una cuenta. Filtra por estado (open, resolved, false-positive) y por app.',
    {
      accountId: z.number().describe('ID de la cuenta'),
      status: z.enum(['open', 'resolved', 'false-positive']).optional().describe('Estado del incidente'),
      appId: z.number().optional().describe('ID del monitor/app para filtrar'),
      page: z.number().optional(),
      limit: z.number().optional().default(25),
    },
    async (p) => {
      const r = await RC.getIncidents(p);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  // --- TOOL: get_incident ---
  server.tool('get_incident',
    'Obtiene detalles completos de un incidente SOC específico.',
    { incidentId: z.number().describe('ID del incidente') },
    async ({ incidentId }) => {
      const r = await RC.getIncident({ incidentId });
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  // --- TOOL: update_incident ---
  server.tool('update_incident',
    'Actualiza el estado de un incidente SOC.',
    {
      incidentId: z.number().describe('ID del incidente'),
      status: z.enum(['open', 'resolved', 'false-positive']).describe('Nuevo estado'),
    },
    async (p) => {
      const r = await RC.updateIncident(p);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  // --- TOOL: list_apps ---
  server.tool('list_apps',
    'Lista los monitores/apps SOC activos en una cuenta (Advanced Breach Detection, Ransomware, etc.).',
    { accountId: z.number().describe('ID de la cuenta') },
    async ({ accountId }) => {
      const r = await RC.getApps({ accountId });
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  // --- TOOL: list_events ---
  server.tool('list_events',
    'Lista eventos de seguridad de una cuenta. Filtra por app y rango de fechas ISO.',
    {
      accountId: z.number().describe('ID de la cuenta'),
      appId: z.number().optional().describe('ID del monitor/app'),
      startDate: z.string().optional().describe('Fecha inicio ISO (ej: 2026-06-01T00:00:00Z)'),
      endDate: z.string().optional().describe('Fecha fin ISO (ej: 2026-06-30T23:59:59Z)'),
      page: z.number().optional(),
      limit: z.number().optional().default(25),
    },
    async (p) => {
      const r = await RC.getEvents(p);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RocketCyber MCP server v2 listening on http://0.0.0.0:${PORT}/mcp`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
});
