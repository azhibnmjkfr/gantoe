# GANTOE — Tinggal Gantoe Tipe Berkasnya

> Konverter berkas lokal. 100% offline, tanpa unggah ke server.

[Coba Live Demo di Sini](https://azhibnmjkfr.github.io/gantoe/)

Pilih file yang kamu punya, pilih mau diubah jadi apa, taruh file-nya. Selesai.

Dibuat oleh AZHCO — studio produk digital dari Aceh, Indonesia.

## Kenapa Gantoe?

Kebanyakan konverter file online mewajibkan kamu mengunggah file ke server mereka. Itu lambat, dan yang lebih parah: privasi kamu dipertaruhkan.

Gantoe mengambil pendekatan berbeda:
- Privasi Total: File kamu tidak pernah keluar dari perangkatmu.
- Super Cepat: Tanpa antrean server, tanpa batas ukuran file.
- Bisa Offline: Install sebagai PWA, dan tetap bisa konversi file meski tanpa internet.

## Matriks Konversi

Hanya yang tercantum di bawah ini yang didukung. Jika sebuah konversi tidak ada di daftar, berarti belum didukung.

| Dari | Ke | Keterangan |
| :--- | :--- | :--- |
| Gambar (JPG, PNG, WEBP, GIF, BMP) | JPG, PNG, WEBP | Konversi via Canvas |
| Gambar | ICO (1 file) | ICO writer |
| Gambar | PDF | 1 gambar menjadi 1 halaman PDF |
| Gambar (logo) | Web Pack | 11 ikon favicon & PWA dalam 1 ZIP |
| PDF (2–20 file) | Gabung PDF | Gabung halaman asli via pdf-lib |
| PDF (1 file) | Pisah PDF | Potong per halaman, hasil ZIP via pdf-lib |
| Word (DOCX) | TXT | Ambil teks asli dari `word/document.xml` |
| Excel (XLSX) | CSV | Ambil data asli dari sheet |

### Yang tidak dibuat (Karena kami menjunjung akurasi)

- Word ke PDF, Excel ke PDF: Membutuhkan render layout yang akurat. Hasil yang tidak akurat tidak kami rilis.
- OCR: Membutuhkan mesin yang berat, tidak sesuai dengan tujuan tool ini yang ringan dan offline.
- PDF ke JPG / TXT dengan render palsu: Tidak pernah dilakukan.

## Privasi

Tidak ada server. Seluruh proses berjalan di perangkat pengguna. Berkas tidak pernah diunggah.

## Cara Pakai

1. Pilih FROM: berkas apa yang kamu punya.
2. Pilih TO: mau diubah jadi apa.
3. Taruh berkas di dropzone. Jika berkas yang ditaruh berbeda dari pilihan FROM, pilihan akan disesuaikan secara otomatis.
4. Berkas hasil akan langsung terunduh.

## Menjalankan Secara Lokal

Menggunakan Python:
    git clone https://github.com/azhibnmjkfr/gantoe.git
    cd gantoe
    python3 -m http.server 8000

Buka `http://localhost:8000` di browser.

Menggunakan Node.js / NPM:
    npx serve .

## Lisensi

Didistribusikan di bawah lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.