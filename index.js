import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import * as RC from './rocketcyber.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mcp-rocketcyber', version: '3.0.0', timestamp: new Date().toISOString() });
});

app.all('/mcp', async (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const queryToken = req.query.token || '';
  const token = bearerToken || queryToken;
  if (process.env.MCP_SECRET_TOKEN && token !== process.env.MCP_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const server = new McpServer({ name: 'rocketcyber-mcp', version: '3.0.0' });

  server.tool('get_account',
    'Obtiene información de una cuenta/cliente: nombre, jerarquía, tipo, estado, sub-cuentas.',
    { accountId: z.number().describe('ID de la cuenta en RocketCyber') },
    async ({ accountId }) => {
      const r = await RC.getAccount({ accountId });
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  server.tool('list_agents',
    'Lista agentes/dispositivos. Filtra por accountId y conectividad (online/offline/isolated).',
    {
      accountId: z.number().optional().describe('ID de la cuenta para filtrar'),
      filterBy: z.string().optional().describe('Campo a filtrar. Usar: connectivity'),
      filterValue: z.enum(['online', 'offline', 'isolated']).optional().describe('Valor del filtro'),
      sortBy: z.enum(['id', 'hostname', 'agentVersion', 'lastConnected']).optional(),
      orderBy: z.enum(['asc', 'desc']).optional(),
      pageSize: z.number().optional().default(25),
    },
    async (p) => {
      const r = await RC.getAgents(p);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  server.tool('get_agent',
    'Obtiene detalles completos de un agente: OS, IP, versión, última conexión.',
    { agentId: z.string().describe('ID del agente') },
    async ({ agentId }) => {
      const r = await RC.getAgent({ agentId });
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  server.tool('list_incidents',
    'Lista incidentes SOC. Filtra por accountId, estado (open/resolved/false-positive) y app.',
    {
      accountId: z.number().optional().describe('ID de la cuenta'),
      status: z.enum(['open', 'resolved', 'false-positive']).optional(),
      appId: z.number().optional().describe('ID del monitor/app'),
      pageSize: z.number().optional().default(25),
    },
    async (p) => {
      const r = await RC.getIncidents(p);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  server.tool('get_incident',
    'Obtiene detalles completos de un incidente SOC específico.',
    { incidentId: z.number().describe('ID del incidente') },
    async ({ incidentId }) => {
      const r = await RC.getIncident({ incidentId });
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  server.tool('update_incident',
    'Actualiza el estado de un incidente SOC: open, resolved, false-positive.',
    {
      incidentId: z.number().describe('ID del incidente'),
      status: z.enum(['open', 'resolved', 'false-positive']).describe('Nuevo estado'),
    },
    async (p) => {
      const r = await RC.updateIncident(p);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  server.tool('list_apps',
    'Lista los monitores/apps SOC activos. Filtra por accountId.',
    { accountId: z.number().optional().describe('ID de la cuenta') },
    async ({ accountId }) => {
      const r = await RC.getApps({ accountId });
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
  );

  server.tool('list_events',
    'Lista eventos de seguridad. Filtra por accountId, app y rango de fechas.',
    {
      accountId: z.number().optional().describe('ID de la cuenta'),
      appId: z.number().optional().describe('ID del monitor/app'),
      startDate: z.string().optional().describe('Fecha inicio ISO (ej: 2026-06-01T00:00:00Z)'),
      endDate: z.string().optional().describe('Fecha fin ISO (ej: 2026-06-30T23:59:59Z)'),
      pageSize: z.number().optional().default(25),
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
  console.log(`RocketCyber MCP server v3 listening on http://0.0.0.0:${PORT}/mcp`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
});
