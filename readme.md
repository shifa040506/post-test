Nama Anggota Kelompok 4 :
1. Ibnu Abdillah
2. Shifa Wahyu Santoso
3. Muhammad Yusron Bima Sakti
4. Nikmatul Zumroh

Cara menjalankan :
npm install, node server.js, lalu node.simulator.js

tabel end-point :

| Method | Endpoint | Fungsi | Respons sukses |
|---|---|---|---|
| POST | `/api/readings` | Menerima data sensor dari perangkat | 201 + data tersimpan |
| GET | `/api/readings/latest` | Data terbaru untuk kartu nilai (opsional `?device_id=`) | 200 + objek JSON |
| GET | `/api/readings?limit=20` | Riwayat N data terakhir untuk grafik dan tabel (opsional `&device_id=`) | 200 + array JSON |
| GET | `/api/stats` | Rata-rata, minimum, maksimum suhu dan kelembapan (opsional `?device_id=`) | 200 + objek JSON |

bonus :
//multi devices
| GET | `/api/devices` | Daftar `device_id` yang pernah mengirim data | 200 + array JSON |
//ekspor csv
| GET | `/api/export/csv` | Ekspor semua data ke file CSV (opsional `?device_id=`) | 200 + file `readings.csv` |
