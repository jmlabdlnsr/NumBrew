import { useState } from 'react';
import { useStore } from 'zustand';
import { gameStore } from '../store/gameStore';
import { Icon } from '../components/Icon';
import { money } from '../utils/format';

export function HelpPanel() {
  const items = [
    [
      'basket',
      'Belanja secukupnya',
      'Beli bahan dari supplier. Kas berubah menjadi stok, bukan langsung menjadi kerugian.',
    ],
    [
      'calculator',
      'Kenali biaya setiap cup',
      'Di Menu & harga, lihat biaya setiap bahan per porsi, termasuk kemasan. Jumlahkan sendiri, isi HPP, lalu Periksa HPP sebelum menentukan harga jual.',
    ],
    [
      'coffee',
      'Pilih harga, buka kafe',
      'Harga lebih rendah bisa menarik pelanggan. Harga lebih tinggi memberi untung per cup lebih besar, tetapi belum tentu terjangkau.',
    ],
    [
      'users',
      'Kenali tamu, racik pesanan',
      'Sebagian besar tamu langsung memesan; beberapa meminta rekomendasi. Bantu mereka memilih sesuai selera dan budget. Tekan Siapkan Pesanan, tunggu proses racik 6 detik, lalu serahkan minuman. Bahan berkurang dan pembayaran diterima saat penyerahan.',
    ],
    [
      'report',
      'Baca cerita di balik angka',
      'Saat tutup, pendapatan dikurangi HPP dan biaya operasional. Buka Lihat Perhitungan untuk menelusuri hasilmu.',
    ],
  ] as const;
  return (
    <>
      <div className="help-banner">
        <Icon name="sprout" size={32} />
        <h3>Kafe kecil. Pelajaran besar.</h3>
        <p>Tidak ada jawaban wajib. Coba keputusanmu, lihat hasilnya, lalu racik strategi baru.</p>
      </div>
      <div className="help-steps">
        {items.map(([icon, title, body], i) => (
          <div key={title}>
            <span className="step-number">0{i + 1}</span>
            <span>
              <h3>{title}</h3>
              <p>{body}</p>
            </span>
            <Icon name={icon} />
          </div>
        ))}
      </div>
      <div className="learning-note">
        <Icon name="pause" />
        <p>
          Waktu berhenti selama panel ini terbuka. Kamu juga dapat menjeda kafe kapan saja. Saat
          kembali dari tab lain, tekan Lanjutkan untuk melanjutkan simulasi.
        </p>
      </div>
    </>
  );
}

export function SettingsPanel() {
  const store = useStore(gameStore);
  const [confirm, setConfirm] = useState<'new' | 'retry' | null>(null);
  return (
    <>
      <div className="setting-row">
        <div>
          <strong>Kurangi animasi</strong>
          <p>Transisi lebih tenang, informasi tetap lengkap.</p>
        </div>
        <label className="switch">
          <input
            aria-label="Kurangi animasi"
            type="checkbox"
            checked={store.reducedMotion}
            onChange={(e) => store.setReducedMotion(e.target.checked)}
          />
          <span />
        </label>
      </div>
      <div className="setting-row">
        <div>
          <strong>Penyimpanan lokal</strong>
          <p>
            {store.saveStatus === 'saved'
              ? 'Progres disimpan di browser ini.'
              : store.warning || 'Penyimpanan belum tersedia.'}
          </p>
        </div>
        <button
          className="button secondary"
          disabled={!store.session}
          onClick={() => {
            gameStore.setState({ saveStatus: 'saved' });
            store.save();
          }}
        >
          Simpan lagi
        </button>
      </div>
      {store.saveStatus === 'failed' && (
        <button className="button secondary full" onClick={store.continueInMemory}>
          Lanjut tanpa save untuk sesi ini
        </button>
      )}
      <div className="setting-row">
        <div>
          <strong>Ulangi hari ini</strong>
          <p>Kembali ke awal persiapan. Belanja dan penjualan hari ini dibatalkan.</p>
        </div>
        <button
          className="button secondary"
          disabled={!store.session || store.readOnly}
          onClick={() => setConfirm('retry')}
        >
          <Icon name="reset" size={17} /> Ulangi
        </button>
      </div>
      <div className="setting-row">
        <div>
          <strong>Mulai usaha baru</strong>
          <p>Ganti progres saat ini dengan modal awal {money(500_000)}.</p>
        </div>
        <button
          className="button danger"
          disabled={store.readOnly}
          onClick={() => setConfirm('new')}
        >
          Mulai ulang
        </button>
      </div>
      {confirm && (
        <div className="confirm-box" role="alert">
          <h3>
            {confirm === 'new' ? 'Ganti progres dengan usaha baru?' : 'Kembali ke awal hari ini?'}
          </h3>
          <p>
            {confirm === 'new'
              ? 'Kas, stok, dan seluruh riwayat usaha saat ini akan diganti.'
              : 'Seluruh hasil setelah checkpoint persiapan hari ini akan dibatalkan.'}
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={() => setConfirm(null)}>
              Batal
            </button>
            <button
              className="button danger"
              onClick={() => {
                confirm === 'new' ? store.start(true) : store.retryDay();
                setConfirm(null);
              }}
            >
              {confirm === 'new' ? 'Ya, mulai usaha baru' : 'Ya, ulangi hari'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
