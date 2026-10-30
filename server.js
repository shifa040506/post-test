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

// GET daftar device
app.get('/api/devices', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT device_id FROM readings ORDER BY device_id').all();
  res.status(200).json(rows.map(r => r.device_id));
});

// GET ekspor CSV
// Contoh: /api/export/csv                      -> semua data
//         /api/export/csv?device_id=GH-01      -> hanya satu device
//         /api/export/csv?limit=10             -> 10 data terakhir
//         /api/export/csv?device_id=GH-01&limit=10
app.get('/api/export/csv', (req, res) => {
  try {
    const SEP = ';'; // Excel versi Indonesia memakai titik koma sebagai pemisah kolom
    const { device_id } = req.query;
    const limit = parseInt(req.query.limit);

    // created_at disimpan dalam UTC, ditambah 7 jam jadi WIB
    const kolom = `id, device_id, suhu, kelembapan,
                   datetime(created_at, '+7 hours') AS waktu`;
    const where = device_id ? 'WHERE device_id = ?' : '';
    const params = device_id ? [device_id] : [];

    let rows;
    if (limit > 0) {
      rows = db.prepare(`
        SELECT * FROM (
          SELECT ${kolom} FROM readings ${where} ORDER BY id DESC LIMIT ?
        ) ORDER BY id ASC
      `).all(...params, limit);
    } else {
      rows = db.prepare(`
        SELECT ${kolom} FROM readings ${where} ORDER BY id ASC
      `).all(...params);
    }

    // Escape teks jika mengandung titik koma, tanda kutip, atau baris baru
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    // Angka memakai koma desimal supaya terbaca sebagai angka di Excel Indonesia
    const num = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','));

    const header = ['ID', 'Device', 'Suhu (C)', 'Kelembapan (%)', 'Waktu (WIB)'];
    const lines = rows.map(r => [
      esc(r.id),
      esc(r.device_id),
      num(r.suhu),
      num(r.kelembapan),
      esc(r.waktu)
    ].join(SEP));

    // \uFEFF = BOM supaya Excel membaca UTF-8 dengan benar
    const csv = '\uFEFF' + [header.join(SEP), ...lines].join('\r\n');

    const tgl = new Date().toISOString().slice(0, 10);
    const namaDevice = device_id ? '-' + String(device_id).replace(/[^\w-]/g, '') : '';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="riwayat-greenhouse${namaDevice}-${tgl}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error('Gagal ekspor CSV:', err.message);
    res.status(500).send('Gagal mengekspor data ke CSV: ' + err.message);
  }
});

app.listen(3000, () => console.log('Server jalan di http://localhost:3000'));