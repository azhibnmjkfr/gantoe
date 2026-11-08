# Vendor Libraries

Folder ini berisi library pihak ketiga yang di-bundle secara lokal untuk 
memastikan GANTOE dapat berjalan 100% offline tanpa bergantung pada CDN.

## Daftar Library

| File | Library | Version | License | Source |
|---|---|---|---|---|
| `jszip.min.js` | JSZip | 3.10.1 | MIT / GPLv3 | [GitHub](https://github.com/Stuk/jszip) |
| `pdf-lib.min.js` | pdf-lib | 1.17.1 | MIT | [GitHub](https://github.com/Hopding/pdf-lib) |

## Catatan untuk Developer & Kontributor

1. **Jangan mengedit file `.min.js` secara langsung.** Jika butuh update versi, unduh ulang dari sumber resmi.
2. **Jangan hapus file ini.** Sesuai dengan komitmen privasi GANTOE, semua proses konversi (termasuk pemuatan library) harus terjadi secara lokal di browser pengguna, tanpa ada request ke pihak ketiga (CDN).
3. Jika file ini tidak sengaja terhapus, build produksi akan menampilkan error (fail loud and clear), bukan diam-diam mencoba mengunduh dari internet.

_Terakhir diperbarui: November 2026_