const express = require('express');
const cron = require('node-cron');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ─── POSTGRES ─────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      time TEXT NOT NULL,
      days INTEGER[] NOT NULL
    );
  `);
  console.log('Base de datos lista');
}

async function getConfig() {
  const res = await pool.query('SELECT key, value FROM config');
  const cfg = {};
  res.rows.forEach(r => cfg[r.key] = r.value);
  return cfg;
}

async function setConfig(key, value) {
  await pool.query(
    'INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2',
    [key, value]
  );
}

async function getTasks() {
  const res = await pool.query('SELECT * FROM tasks ORDER BY time');
  return res.rows;
}

// ─── TELEGRAM ─────────────────────────────────────────────────────────────────
async function sendTelegram(token, chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    return data.ok;
  } catch (e) {
    console.error('Telegram error:', e.message);
    return false;
  }
}

// ─── CRON: cada minuto ────────────────────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  try {
    const cfg = await getConfig();
    if (!cfg.token || !cfg.chatId) return;
    const tasks = await getTasks();
    if (!tasks.length) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;
    const currentDay = now.getDay();

    const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    for (const task of tasks) {
      if (task.time === currentTime && task.days.includes(currentDay)) {
        const msg = `🔔 <b>Recordatorio</b>\n\n📌 ${task.name}\n⏰ ${task.time} — ${DAYS_FULL[currentDay]}`;
        const ok = await sendTelegram(cfg.token, cfg.chatId, msg);
        console.log(`[${currentTime}] ${ok ? '✓' : '✗'} ${task.name}`);
      }
    }
  } catch(e) {
    console.error('Cron error:', e.message);
  }
});

// ─── API ──────────────────────────────────────────────────────────────────────

app.post('/api/config', async (req, res) => {
  const { token, chatId } = req.body;
  if (!token || !chatId) return res.status(400).json({ ok: false, error: 'Faltan datos' });
  await setConfig('token', token);
  await setConfig('chatId', chatId);
  const ok = await sendTelegram(token, chatId, '✅ <b>Conexión exitosa!</b>\n\nTu agenda está funcionando 24/7 desde el servidor.');
  res.json({ ok });
});

app.get('/api/tasks', async (req, res) => {
  const [tasks, cfg] = await Promise.all([getTasks(), getConfig()]);
  res.json({ tasks, config: { hasToken: !!cfg.token, chatId: cfg.chatId } });
});

app.post('/api/tasks', async (req, res) => {
  const { name, time, days } = req.body;
  if (!name || !time || !days?.length)
    return res.status(400).json({ ok: false, error: 'Faltan datos' });
  const id = Date.now();
  await pool.query('INSERT INTO tasks(id,name,time,days) VALUES($1,$2,$3,$4)', [id, name, time, days]);
  res.json({ ok: true, task: { id, name, time, days } });
});

app.delete('/api/tasks/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=$1', [parseInt(req.params.id)]);
  res.json({ ok: true });
});

app.get('/health', async (req, res) => {
  const cfg = await getConfig();
  const tasks = await getTasks();
  res.json({ status: 'ok', tasks: tasks.length, hasConfig: !!cfg.token });
});

// ─── INICIO ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`Agenda corriendo en puerto ${PORT}`));
}).catch(e => {
  console.error('Error DB:', e.message);
  process.exit(1);
});
