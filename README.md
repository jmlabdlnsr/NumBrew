# NumBrew

Simulasi manajemen kafe edukatif untuk materi Aritmatika Sosial SMP. Pemain membeli bahan, menentukan harga, melayani pelanggan, lalu memahami hasil usahanya melalui perhitungan yang berasal dari transaksi nyata dalam game.

Implementasi saat ini adalah MVP: modal, HPP, harga jual, untung/rugi, stok, pelanggan, siklus hari, laporan, dan penjelasan matematika. Diskon, bruto/neto/tara, pajak aktif, kualitas produk, dan upgrade kafe masih berada di roadmap.

## Menjalankan

Gunakan Node.js 22.12+ atau 24 LTS dan npm. Dependensi sudah terpasang di workspace ini; untuk checkout baru jalankan `npm ci`.

```sh
npm run dev
```

Buka alamat Local yang dicetak Vite, biasanya http://127.0.0.1:5173/. Save mengikuti origin browser: gunakan alamat dan port yang sama untuk melanjutkan permainan.

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

Build statis berada di `dist/`. Tidak memerlukan server API, akun, database, atau API key.

## Mulai bermain

1. Pilih **Mulai usaha** untuk mendapat modal Rp500.000.
2. Buka **Beli bahan**, pilih paket awal, lalu beli. Paket Rp240.000 menyisakan kas Rp260.000 dan cukup untuk 20 minuman secara gabungan.
3. Buka **Menu & harga**. Rincian biaya bahan tetap terlihat. Jumlahkan biaya per porsi, isi total HPP, lalu klik **Periksa HPP**. Setelah tepat, tentukan dan simpan harga jual. Hasil HPP tersimpan per menu; hitung ulang jika biaya resep berubah.
4. Tentukan harga. Harga di bawah HPP diperbolehkan agar konsekuensi kerugian bisa dipelajari.
5. **Buka kafe**, klik karakter atau nama pelanggan. Sebagian besar langsung memesan; pelanggan dengan status Minta rekomendasi dapat ditanya selera dan budgetnya sebelum kamu menawarkan menu.
6. Tekan **Siapkan Pesanan**, lalu tunggu proses racik selama 6 detik. Kamu bisa mengobrol dengan tamu lain sambil menunggu. Klik **Serahkan** saat minuman siap. Setelah itu **Tutup kafe**, selesaikan antrean, dan baca laporan beserta **Lihat Perhitungan**.
7. Siapkan hari berikutnya. Pengaturan menyediakan ulang hari dari checkpoint persiapan dan permainan baru, dengan konfirmasi di dalam game.

Persiapan tidak dibatasi waktu. Satu hari buka berlangsung 180 detik dengan waktu pelayanan terakhir maksimal 30 detik. Membuka panel atau berpindah tab menjeda waktu; reload selalu kembali dalam keadaan dijeda.

## Arsitektur

- **React**: HUD, supplier, inventory, pricing, laporan, panduan, modal, dan seluruh teks/interaksi aksesibel.
- **Phaser 3**: interior kafe, karakter, tween, klik visual, dan efek transaksi. Phaser tidak menghitung atau menyimpan uang.
- **Zustand**: menghubungkan UI, command aplikasi, scene, dan penyimpanan.
- **Domain TypeScript murni**: perhitungan, inventory FIFO, resep, keputusan pelanggan, dan laporan. Dapat diuji tanpa React atau Phaser.
- **localStorage**: envelope versi 1, validasi runtime, backup terakhir, checkpoint harian, dan RNG tersimpan. Web Locks mencegah dua tab Chromium menulis save bersamaan.
- **Vitest**: skenario ekonomi, transaksi atomik, siklus hari, determinisme pelanggan, serta pemulihan save.

```text
src/
  app/                         Halaman utama
  application/commands.ts      Command bisnis atomik dan siklus hari
  components/                  Modal dan icon
  data/catalog.ts              Bahan, resep, profil pelanggan, konfigurasi
  domain/
    economy/ inventory/ customer/ reports/
    types.ts
  features/                    Supplier, menu, laporan, bantuan
  game/                        Phaser host dan CafeScene
  infrastructure/persistence/  Validasi, backup, baca/tulis save
  store/                       Zustand dan runtime timer
  styles/                      Tema dan responsive layout
  tests/integration/           Pengujian ekonomi dan save
  utils/                       Format Rupiah dan waktu
public/assets/                 Aset ilustrasi modular
docs/                         Rencana, style bible, manifest aset, hasil QA
```

## Aturan ekonomi

- Semua uang disimpan sebagai integer Rupiah; harga input harus integer positif.
- Pembelian mengurangi kas dan menambah nilai persediaan. Pembelian **tidak** langsung dibebankan sebagai HPP hari tersebut.
- Bahan dikonsumsi FIFO. Alokasi biaya menggunakan pembulatan kumulatif per batch supaya total biaya yang dikonsumsi selalu sama dengan harga pembelian, termasuk harga satuan pecahan.
- Satu transaksi mengonsumsi seluruh bahan dan mengubah kas sekaligus. Klik ganda tidak menggandakan penjualan.
- Laba bersih = pendapatan − HPP produk terjual − operasional − pajak.
- Operasional Rp20.000 dibebankan tepat satu kali ketika hari ditutup, termasuk hari tanpa penjualan. Persiapan tidak dikenai biaya.
- Persentase laba/rugi = hasil bersih ÷ (HPP + operasional + pajak) × 100%. Basis persentase selalu ditampilkan; pembagi nol ditampilkan sebagai tanda pisah.
- Stok susu dan cup dipakai bersama tiga resep. Kapasitas per menu tidak dapat dijumlahkan.
- Bahan untuk minuman yang sedang diracik/siap diserahkan dicadangkan agar tidak dipakai dua pesanan. Kas dan stok aktual berubah secara atomik saat minuman diserahkan; memulai racikan belum menghasilkan pendapatan.
- Pelanggan memiliki 15 variasi sapaan berdasarkan profil, respons pertanyaan, respons tawaran, kondisi menunggu, proses racik, dan ucapan setelah dilayani. Klik karakter memilih teman bicara, lalu pemain menjalankan aksi melalui tombol HTML.
- Tawaran di atas budget ditolak dan mengurangi kesabaran 4 detik. Penolakan ketiga membuat pelanggan pergi dengan reputasi −1. Tawaran yang diterima mengunci menu dan harganya.
- Setiap pelanggan baru memiliki peluang 30% meminta rekomendasi, sedangkan 70% langsung memesan menu yang tersedia dan terjangkau. Angka ini peluang per kedatangan, bukan kuota antrean. Menanyakan selera dan melayani menu favorit memberi bonus reputasi +1; reputasi tetap mengikuti batas harian. Persiapan memakai satu tombol dengan durasi 6 detik. Pesanan save lama yang sedang diracik mempertahankan durasi sebelumnya.
- Total HPP di panel harga dihitung pemain. Jawaban belum tepat mendapat petunjuk tanpa mengurangi kas atau reputasi. Harga dan selisih untung/rugi baru dapat ditinjau setelah HPP terverifikasi. Mesin transaksi tetap menghitung biaya aktual dari resep dan batch bahan.
- Diskon dan pajak bernilai 0 pada MVP. `taxRateBps` disiapkan di konfigurasi tetapi modul pajak aktif belum diimplementasikan; jangan mengubahnya sebelum milestone pajak. Ini simulasi pembelajaran, bukan aturan perpajakan dunia nyata.

Contoh penerimaan otomatis: beli paket Rp240.000, jual 20 Matcha Latte seharga Rp10.000. Pendapatan Rp200.000, HPP Rp126.000, operasional Rp20.000, laba Rp54.000. Kas akhir Rp440.000 dan persediaan Rp114.000. Kas + nilai stok = modal awal + laba.

## Save dan batas MVP

Kunci penyimpanan: `numbrew.save.v1` dan `numbrew.backup.v1`. Save dari nama lama Kafe Hitung tetap dapat dibaca dan dilanjutkan. Save lama tanpa tahap pelayanan dimigrasikan: pesanan lama masuk tahap sudah disepakati dan dapat langsung diracik. Proses racik baru tersimpan menggunakan waktu simulasi, sehingga reload tidak mempercepat racikan. Versi tidak dikenal atau data rusak ditolak; backup valid dipulihkan dengan pemberitahuan. Save rusak tidak diam-diam dihapus. Kegagalan menyimpan menjeda game dan menawarkan mencoba kembali atau bermain dalam memori.

Save hanya ada di browser ini, belum sinkronisasi perangkat atau ekspor. Ringkasan 100 hari terakhir dipertahankan; detail transaksi historis dibatasi 7 hari agar penyimpanan terkendali. Autentikasi dan keamanan server bukan bagian dari MVP lokal.

Pelanggan mempertimbangkan budget, harga, preferensi menu, reputasi, dan stok. Kualitas, promo, serta identitas pelanggan yang benar-benar kembali lintas hari belum dimodelkan; profil loyal saat ini direpresentasikan lewat toleransi harga/preferensi. RNG disimpan agar reload tidak mengacak ulang pelanggan.

Ilustrasi AI dibuat terpisah untuk interior dan enam karakter. Produk/bahan berupa SVG lokal; icon UI memakai Lucide. Font Google Fonts bersifat opsional karena tersedia fallback sistem. Aset PNG saat ini sekitar 12,7 MB; optimasi format dan pengujian perangkat berdaya rendah masih diperlukan sebelum produksi. Tidak ada musik, audio, atau service worker/offline install.

## Dokumentasi

- [Planning 14 bagian dan roadmap](docs/GAME_PLAN.md)
- [Style Bible](docs/art/STYLE_BIBLE.md)
- [Manifest dan provenance aset](docs/art/ASSET_MANIFEST.md)
- [Catatan pengujian](docs/QA.md)

Skrip `npm run format` merapikan source dengan Prettier. `npm run format:check` memeriksa format tanpa mengubah file.

### Laba / rugi dihitung pemain

Laporan tetap menampilkan pendapatan bersih, HPP terjual, operasional, dan pajak. Pemain menghitung pendapatan bersih dikurangi jumlah biaya tersebut, lalu mengisi hasil bertanda minus untuk rugi atau 0 untuk impas. Periksa hasil memberi petunjuk tanpa penalti. Total, persentase, dan saran berdasarkan hasil baru ditampilkan setelah benar. Jawaban laporan selesai tersimpan per hari; jawaban proyeksi berjalan perlu dihitung kembali setelah angka berubah atau kafe tutup. Kas dan biaya aktual tetap dikelola mesin ekonomi.
