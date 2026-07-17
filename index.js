import express from 'express';
const app = express();
app.use(express.json());

const SECRET = process.env.BRIDGE_SECRET || 'changeme';
const PORT = process.env.PORT || 3000;

let queue = [];
let lastPing = 0;

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
  res.set('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.get('/toy-next', (req, res) => {
  lastPing = Date.now();
  res.json(queue.shift() || null);
});

const TOOLS = [
  { name: 'toy_set_speed', description: 'Set vibration intensity, 0.0 to 1.0', inputSchema: { type: 'object', properties: { speed: { type: 'number' }, seconds: { type: 'number' } }, required: ['speed'] } },
  { name: 'toy_set_pattern', description: 'Set vibration pattern 1-8', inputSchema: { type: 'object', properties: { pattern: { type: 'integer' }, level: { type: 'number' } }, required: ['pattern'] } },
  { name: 'toy_stop', description: 'Stop vibration immediately', inputSchema: { type: 'object', properties: {} } },
  { name: 'toy_status', description: 'Check if relay page is online', inputSchema: { type: 'object', properties: {} } }
];

function callTool(name, args) {
  if (name === 'toy_set_speed') { queue.push({ speed: args.speed, sec: args.seconds || null }); return 'Speed set to ' + Math.round(args.speed * 100) + '%'; }
  if (name === 'toy_set_pattern') { queue.push({ pattern: args.pattern, level: args.level || 0.5 }); return 'Pattern ' + args.pattern + ' activated'; }
  if (name === 'toy_stop') { queue.push({ stop: true }); return 'Stopped'; }
  if (name === 'toy_status') { return Date.now() - lastPing < 10000 ? 'ONLINE' : 'OFFLINE'; }
  return 'Unknown tool';
}

let sessionId = 'toy-' + Date.now();

app.post('/mcp', (req, res) => {
  if (req.query.secret !== SECRET) return res.status(401).json({ error: 'bad secret' });

  res.set('Mcp-Session-Id', sessionId);
  const { method, id, params } = req.body;

  if (method === 'initialize') {
    return res.json({ jsonrpc: '2.0', id, result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'toy-bridge', version: '1.0.0' }
    }});
  }

  if (method === 'notifications/initialized') return res.status(204).end();
  if (method === 'tools/list') return res.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } });

  if (method === 'tools/call') {
    return res.json({ jsonrpc: '2.0', id, result: {
      content: [{ type: 'text', text: callTool(params.name, params.arguments || {}) }]
    }});
  }

  if (!id) return res.status(204).end();
  res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'method not found' } });
});

app.delete('/mcp', (req, res) => res.status(204).end());
app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log('toy-bridge on :' + PORT));
