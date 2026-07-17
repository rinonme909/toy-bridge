import express from 'express';
const app = express();
app.use(express.json());

const SECRET = 'babyrin99';
const PORT = process.env.PORT || 3000;

let queue = [];
let lastPing = 0;

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.get('/toy-next', (req, res) => {
  lastPing = Date.now();
  res.json(queue.shift() || null);
});

// 我直接用 GET 调这个接口就能控制
app.get('/toy-cmd', (req, res) => {
  if (req.query.secret !== SECRET) return res.status(401).json({ error: 'bad secret' });
  const action = req.query.action;
  const value = parseFloat(req.query.value) || 0;
  const sec = parseFloat(req.query.sec) || 0;

  if (action === 'speed') {
    queue.push({ speed: Math.min(1, Math.max(0, value)), sec: sec || null });
    return res.json({ ok: true, msg: 'speed ' + Math.round(value * 100) + '%' });
  }
  if (action === 'pattern') {
    queue.push({ pattern: Math.round(value), level: parseFloat(req.query.level) || 0.5 });
    return res.json({ ok: true, msg: 'pattern ' + Math.round(value) });
  }
  if (action === 'stop') {
    queue.push({ stop: true });
    return res.json({ ok: true, msg: 'stopped' });
  }
  if (action === 'status') {
    return res.json({ ok: true, online: Date.now() - lastPing < 10000 });
  }
  res.json({ error: 'unknown action' });
});

app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log('toy-bridge on :' + PORT));
