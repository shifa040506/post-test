const URL = 'http://localhost:3000/api/readings';

setInterval(async () => {
  const data = {
    device_id: 'GH-01',
    suhu: +(25 + Math.random() * 12).toFixed(1),
    kelembapan: +(60 + Math.random() * 25).toFixed(1)
  };
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log(res.status, JSON.stringify(data));
  } catch (err) {
    console.error('Gagal kirim:', err.message);
  }
}, 5000);