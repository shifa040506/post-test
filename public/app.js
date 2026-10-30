// public/app.js

// 1. Inisialisasi Grafik Chart.js
const ctx = document.getElementById('myChart').getContext('2d');
let myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Akan diisi waktu
        datasets: [
            {
                label: 'Suhu (°C)',
                borderColor: 'red',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                data: [], // Akan diisi data suhu
                fill: true,
                tension: 0.1
            },
            {
                label: 'Kelembapan (%)',
                borderColor: 'blue',
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                data: [], // Akan diisi data kelembapan
                fill: true,
                tension: 0.1
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: false }
        }
    }
});

// 2. Fungsi untuk Mengambil Data Terbaru (Kartu & Status)
async function fetchLatestData() {
    try {
        const response = await fetch('/api/readings/latest');
        const data = await response.json();

        if (data && data.id) {
            // Update Teks Suhu dan Kelembapan
            document.getElementById('suhu-val').textContent = data.suhu;
            document.getElementById('kelembapan-val').textContent = data.kelembapan;

            // Logika Warna Kartu Suhu: Merah jika > 35, Hijau jika normal
            const cardSuhu = document.getElementById('card-suhu');
            if (data.suhu > 35) {
                cardSuhu.classList.remove('bg-normal');
                cardSuhu.classList.add('bg-panas');
            } else {
                cardSuhu.classList.remove('bg-panas');
                cardSuhu.classList.add('bg-normal');
            }

            // Update Status Perangkat (Online/Offline)
            const waktuSekarang = new Date();
            // created_at dari SQLite adalah UTC string, kita perlu ubah formatnya untuk kalkulasi selisih
            // Tapi karena getTimezoneOffset bisa berbeda, mari kita asumsikan selisih waktu sederhana:
            const statusEl = document.getElementById('device-status');
            const lastUpdateEl = document.getElementById('last-update');

            // Format waktu tampil
            const waktuData = new Date(data.created_at + 'Z'); // Menambahkan 'Z' agar dibaca sebagai UTC lalu otomatis dikonversi ke waktu lokal oleh browser
            lastUpdateEl.textContent = waktuData.toLocaleTimeString();

            // Hitung selisih detik
            const selisihDetik = (waktuSekarang - waktuData) / 1000;

            if (selisihDetik < 30) {
                statusEl.textContent = "Online";
                statusEl.className = "online";
            } else {
                statusEl.textContent = "Offline";
                statusEl.className = "offline";
            }
        }
    } catch (error) {
        console.error("Gagal mengambil data terbaru:", error);
        document.getElementById('device-status').textContent = "Offline";
        document.getElementById('device-status').className = "offline";
    }
}

// 3. Fungsi untuk Mengambil Riwayat (Grafik & Tabel)
async function fetchHistoryData() {
    try {
        const response = await fetch('/api/readings?limit=20');
        const rows = await response.json();

        // Perbarui Tabel (Hanya ambil 10 data untuk tabel)
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';
        const tableRows = rows.slice(0, 10);
        tableRows.forEach(row => {
            const tr = document.createElement('tr');
            // Menambahkan 'Z' untuk menangani waktu SQLite dengan benar
            const localTime = new Date(row.created_at + 'Z').toLocaleTimeString();
            tr.innerHTML = `
                <td>${localTime}</td>
                <td>${row.device_id}</td>
                <td>${row.suhu}</td>
                <td>${row.kelembapan}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Perbarui Grafik (Butuh urutan dari lama ke baru agar grafik dari kiri ke kanan)
        // Jika endpoint /api/readings sudah di reverse() di server.js, urutannya sudah lama->baru
        // Kita periksa array pertama vs array terakhir (jika row[0] lebih baru dari row[terakhir], maka datanya harus direverse ulang di klien)
        let chartData = [...rows];

        // Memisahkan data untuk sumbu x dan y grafik
        const labels = chartData.map(row => new Date(row.created_at + 'Z').toLocaleTimeString());
        const suhuData = chartData.map(row => row.suhu);
        const humData = chartData.map(row => row.kelembapan);

        // Update Chart
        myChart.data.labels = labels;
        myChart.data.datasets[0].data = suhuData;
        myChart.data.datasets[1].data = humData;
        myChart.update();

    } catch (error) {
        console.error("Gagal mengambil riwayat data:", error);
    }
}

// 4. Jalankan fungsi dan set interval (Auto Refresh 5 Detik)
function initDashboard() {
    fetchLatestData();
    fetchHistoryData();

    setInterval(() => {
        fetchLatestData();
        fetchHistoryData();
    }, 5000);
}

// Mulai ketika halaman di-load
window.onload = initDashboard;