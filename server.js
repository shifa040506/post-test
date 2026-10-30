const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// POST: terima data sensor + validasi
app.post('/api/readings', (req, res) => {
  const { device_id, suhu, kelembapan } = req.body;
  if (typeof suhu !== 'number' || typeof kelembapan !== 'number')
    return res.status(400).json({ error: 'suhu dan kelembapan harus angka' });
  if (suhu < -40 || suhu > 80)
    return res.status(400).json({ error: 'suhu harus -40 s.d. 80 °C' });
  if (kelembapan < 0 || kelembapan > 100)
    return res.status(400).json({ error: 'kelembapan harus 0 s.d. 100 %' });

  const info = db.prepare(
    'INSERT INTO readings (device_id, suhu, kelembapan) VALUES (?, ?, ?)'
  ).run(device_id || 'GH-01', suhu, kelembapan);

  const saved = db.prepare('SELECT * FROM readings WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(saved);
});

// GET data terbaru
app.get('/api/readings/latest', (req, res) => {
  const row = db.prepare('SELECT * FROM readings ORDER BY id DESC LIMIT 1').get();
  res.status(200).json(row || {});
});

// GET riwayat N data terakhir
app.get('/api/readings', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 500);
  const rows = db.prepare('SELECT * FROM readings ORDER BY id DESC LIMIT ?').all(limit);
  res.status(200).json(rows.reverse()); // urut lama -> baru untuk grafik
});

// GET statistik
app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT AVG(suhu) AS suhu_avg, MIN(suhu) AS suhu_min, MAX(suhu) AS suhu_max,
           AVG(kelembapan) AS hum_avg, MIN(kelembapan) AS hum_min, MAX(kelembapan) AS hum_max
    FROM readings
  `).get();
  res.status(200).json(stats);
});

app.listen(3000, () => console.log('Server jalan di http://localhost:3000'));