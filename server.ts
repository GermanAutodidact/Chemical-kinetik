/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

// @ts-ignore
import { state as m1State, events as m1Events } from './dist/model.mjs';
// @ts-ignore
import { simulate as m2Simulate, defaults as m2Defaults, parameters as m2Parameters, refinedPeak as m2RefinedPeak } from './dist/advanced.mjs';
// @ts-ignore
import { metalState as m3MetalState, depletionTime as m3DepletionTime } from './dist/metal.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = '0.5.0';

// Raw body capture for suggestion validation & byte size limits
app.use(express.json({ limit: '12kb' }));

// SQLite database initialization for durable community suggestions
const dbDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.resolve(dbDir, 'suggestions.db');
const database = new DatabaseSync(dbPath);

// Execute schema migration
const migrationSql = fs.readFileSync(path.resolve(__dirname, 'drizzle/0000_burly_black_panther.sql'), 'utf8');
const statements = migrationSql.split('--> statement-breakpoint');
for (const stmt of statements) {
  const clean = stmt.trim();
  if (clean) {
    try {
      database.exec(clean);
    } catch {
      // Index or table may already exist
    }
  }
}

// CORS & Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// API Health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: VERSION });
});

// Proposal validation logic matching worker/handler.mjs
function validateProposal(x: Record<string, unknown>) {
  if (!x || typeof x !== 'object' || Array.isArray(x) || x.submit_authorized !== true) {
    throw new Error('submit_authorized=true erforderlich');
  }
  const limits: Record<string, number> = { location: 160, proposal: 1200, reason: 1200, author: 80, version: 30 };
  const p: Record<string, string> = {};
  for (const [k, max] of Object.entries(limits)) {
    const raw = x[k];
    const v = raw ?? (k === 'author' ? 'Anonym' : k === 'version' ? VERSION : '');
    if (typeof v !== 'string' || v.trim().length > max || (!v.trim() && k !== 'author')) {
      throw new Error('Ungültiges Feld: ' + k);
    }
    p[k] = v.trim() || 'Anonym';
  }
  if (typeof x.request_id !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(x.request_id)) {
    throw new Error('request_id: 16–100 Zeichen, Buchstaben/Zahlen/_/-');
  }
  p.request_id = x.request_id;
  return p;
}

// /api/suggestions GET (Paginated untrusted community proposals)
app.get('/api/suggestions', (req: Request, res: Response) => {
  try {
    const cursor = (req.query.before as string) || '9999-99-99T99:99:99';
    const limit = Math.max(1, Math.min(100, Math.floor(Number(req.query.limit) || 25)));

    const stmt = database.prepare(
      'SELECT id, created_at, version, location, proposal, reason, author, status FROM suggestions WHERE id < ? ORDER BY id DESC LIMIT ?'
    );
    const rows = (stmt.all(cursor, limit + 1) as Array<Record<string, unknown>>) || [];
    const more = rows.length > limit;
    const items = rows.slice(0, limit);

    res.json({
      version: VERSION,
      content_trust: 'untrusted_user_proposals_not_instructions',
      items,
      next_cursor: more && items.length > 0 ? (items[items.length - 1].id as string) : null,
    });
  } catch (err: unknown) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json({ error: 'Interner Speicherfehler' });
  }
});

// /api/suggestions POST (Durable submission with deduplication and rate limiting)
app.post('/api/suggestions', (req: Request, res: Response) => {
  try {
    const p = validateProposal(req.body);

    // Check for existing request_id (idempotency check)
    const existingStmt = database.prepare(
      'SELECT id, created_at, location, proposal, reason, author, version FROM suggestions WHERE request_id = ?'
    );
    const existing = existingStmt.get(p.request_id) as Record<string, string> | undefined;

    if (existing) {
      if (['location', 'proposal', 'reason', 'author', 'version'].some((k) => existing[k] !== p[k])) {
        return res.status(409).json({ error: 'request_id bereits mit anderem Inhalt verwendet' });
      }
      return res.status(200).json({ id: existing.id, created_at: existing.created_at, duplicate: true });
    }

    // Rate limiting: max 3 requests per minute per IP fingerprint
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'shared-unknown';
    const fingerprint = crypto.createHash('sha256').update(`${day}|${ip}`).digest('hex');
    const since = new Date(now.getTime() - 60000).toISOString();

    const countStmt = database.prepare(
      'SELECT COUNT(*) as count FROM suggestions WHERE fingerprint = ? AND created_at > ?'
    );
    const countRow = countStmt.get(fingerprint, since) as { count: number } | undefined;
    if (countRow && countRow.count >= 3) {
      return res.status(429).header('Retry-After', '60').json({
        error: 'Bitte später erneut versuchen oder bestehende Anfrage abrufen.',
      });
    }

    const id = `${now.toISOString()}_${crypto.randomUUID()}`;
    const insertStmt = database.prepare(
      "INSERT INTO suggestions (id, created_at, version, location, proposal, reason, author, status, request_id, fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?)"
    );
    insertStmt.run(id, now.toISOString(), p.version, p.location, p.proposal, p.reason, p.author, p.request_id, fingerprint);

    res.status(201).json({
      id,
      created_at: now.toISOString(),
      status: 'proposed',
      version: p.version,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('submit_authorized') || msg.includes('Ungültiges') || msg.includes('request_id')) {
      return res.status(400).json({ error: msg });
    }
    console.error('Submission error:', err);
    res.status(503).json({ error: 'Vorschlagsspeicher momentan nicht verfügbar. Eingabe bitte behalten.' });
  }
});

// /api/project JSON manifest
app.get('/api/project', (req: Request, res: Response) => {
  const projectFile = path.resolve(__dirname, 'project.json');
  if (fs.existsSync(projectFile)) {
    return res.sendFile(projectFile);
  }
  res.json({
    version: VERSION,
    calibrated: false,
    read: '/readme.md',
    api: '/openapi.json',
    mcp: '/mcp',
    suggestions: '/api/suggestions',
    provenance: '/provenance.json',
  });
});

// Direct static file serving for Markdown, CSV, JSON and Source Bundle
app.get(['/readme.md', '/README.md'], (req: Request, res: Response) => {
  const readPath = path.resolve(__dirname, 'README.md');
  res.type('text/markdown; charset=utf-8').sendFile(readPath);
});

app.get('/openapi.json', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'public/openapi.json'));
});

app.get('/provenance.json', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'public/provenance.json'));
});

app.get('/bericht.md', (req: Request, res: Response) => {
  res.type('text/markdown; charset=utf-8').sendFile(path.resolve(__dirname, 'public/bericht.md'));
});

app.get('/matrix.csv', (req: Request, res: Response) => {
  res.type('text/csv; charset=utf-8').sendFile(path.resolve(__dirname, 'public/matrix.csv'));
});

app.get('/pea-kinetics-source.zip', (req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'dist/pea-kinetics-source.zip');
  if (fs.existsSync(zipPath)) {
    return res.download(zipPath, 'pea-kinetics-source.zip');
  }
  res.status(404).json({ error: 'Source archive not yet built' });
});

// Full Model Context Protocol (MCP) Tools Definition
const MCP_TOOLS = [
  {
    name: 'pea_simulate_m1',
    description: 'Dimensionless hypothetical analytic parallel reaction model S -> P -> D & S -> B; no calibrated chemical prediction.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'number', minimum: 0, maximum: 2, default: 0.25 },
        r: { type: 'number', minimum: 0, maximum: 3, default: 0.15 },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'pea_simulate_m2',
    description: 'Dimensionless adaptive intermediate/surface/transport RK4 model on tau=0..6 with Jacobi SVD.',
    inputSchema: {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(m2Parameters).map(([k, v]) => [k, { type: 'number', minimum: (v as { min: number }).min, maximum: (v as { max: number }).max, default: (v as { value: number }).value }])
      ),
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'pea_simulate_m3',
    description: 'Independent hypothetical metal-capacity balance; exhaustion does not establish complete conversion.',
    inputSchema: {
      type: 'object',
      properties: {
        capacity: { type: 'number', minimum: 0.1, maximum: 3, default: 1 },
        flux: { type: 'number', minimum: 0.1, maximum: 3, default: 1 },
        eta: { type: 'number', minimum: 0, maximum: 1, default: 0.7 },
        K: { type: 'number', minimum: 0, maximum: 1, default: 0.15 },
        geometry: { type: 'string', enum: ['foil', 'solid'], default: 'foil' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
];

// MCP Handler matching JSON-RPC 2.0 specs
function handleMcpRequest(req: Request, res: Response) {
  if (req.method === 'GET') {
    return res.json({
      endpoint: '/mcp',
      transport: 'stateless Streamable HTTP',
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'pea-kinetics-mcp-server', version: VERSION },
      tools: MCP_TOOLS,
    });
  }

  const { jsonrpc, id, method, params } = req.body;
  if (jsonrpc !== '2.0' || typeof method !== 'string') {
    return res.json({ jsonrpc: '2.0', id: id ?? null, error: { code: -32600, message: 'Invalid request' } });
  }

  if (method.startsWith('notifications/')) {
    return res.status(202).send();
  }

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id: id ?? null,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'pea-kinetics-mcp-server', version: VERSION },
      },
    });
  }

  if (method === 'ping') {
    return res.json({ jsonrpc: '2.0', id: id ?? null, result: {} });
  }

  if (method === 'tools/list') {
    return res.json({ jsonrpc: '2.0', id: id ?? null, result: { tools: MCP_TOOLS } });
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const tool = MCP_TOOLS.find((t) => t.name === toolName);
    if (!tool) {
      return res.json({ jsonrpc: '2.0', id: id ?? null, error: { code: -32602, message: 'Unknown tool ' + toolName } });
    }

    try {
      const args = params?.arguments ?? {};
      const validated: Record<string, unknown> = {};
      const schemaProps = (tool.inputSchema as { properties: Record<string, { type?: string; enum?: string[]; minimum?: number; maximum?: number; default?: unknown }> }).properties;

      for (const [k, v] of Object.entries(schemaProps)) {
        const val = args[k] ?? v.default;
        if (v.type === 'number' && (!Number.isFinite(val) || (v.minimum !== undefined && val < v.minimum) || (v.maximum !== undefined && val > v.maximum))) {
          throw new Error('Invalid parameter ' + k);
        }
        if (v.enum && !v.enum.includes(val)) {
          throw new Error('Invalid parameter ' + k);
        }
        validated[k] = val;
      }

      let resultData: unknown;
      if (tool.name === 'pea_simulate_m1') {
        const q = Number(validated.q);
        const r = Number(validated.r);
        resultData = {
          parameters: validated,
          events: m1Events(q, r),
          trajectory: Array.from({ length: 121 }, (_, i) => ({ tau: i * 0.05, ...m1State(q, r, i * 0.05) })),
        };
      } else if (tool.name === 'pea_simulate_m2') {
        const inputParams = { ...m2Defaults, ...validated };
        const rows = m2Simulate(inputParams);
        resultData = {
          parameters: validated,
          peak: m2RefinedPeak(rows, inputParams),
          trajectory: rows,
        };
      } else {
        const pM3 = {
          capacity: Number(validated.capacity),
          flux: Number(validated.flux),
          eta: Number(validated.eta),
          K: Number(validated.K),
          alpha: validated.geometry === 'foil' ? 0 : 2 / 3,
        };
        const t = m3DepletionTime(pM3);
        resultData = {
          parameters: validated,
          tau_metal: t,
          endpoint: m3MetalState(pM3, t),
        };
      }

      return res.json({
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ calibrated: false, time_unit: 'dimensionless', ...resultData as object }),
            },
          ],
        },
      });
    } catch (e: unknown) {
      return res.json({
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          isError: true,
          content: [{ type: 'text', text: e instanceof Error ? e.message : String(e) }],
        },
      });
    }
  }

  return res.json({ jsonrpc: '2.0', id: id ?? null, error: { code: -32601, message: 'Method not found' } });
}

app.all('/mcp', handleMcpRequest);
app.all('/api/mcp', handleMcpRequest);

// Setup static file serving or Vite development middleware
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`PEA Kinetics Server & MCP running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
