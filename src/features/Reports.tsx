import { useState } from 'react';
import { useStore } from 'zustand';
import { INGREDIENTS, PRODUCTS } from '../data/catalog';
import { buildReport } from '../domain/reports/report';
import {
  hasCalculatedProfit,
  parseProfitInput,
  profitBasis,
  profitFeedback,
} from '../domain/reports/profitCalculation';
import { gameStore } from '../store/gameStore';
import { Icon } from '../components/Icon';
import { money, percent } from '../utils/format';
import type { Report } from '../domain/types';

function Breakdown({ report, verified }: { report: Report; verified: boolean }) {
  return (
    <div className="report-calculation">
      <span className="eyebrow">DARI KEPUTUSAN KE PERHITUNGAN</span>
      <h3>Ke mana uang kafemu pergi?</h3>
      <div className="formula">
        <span>Pendapatan bersih</span>
        <b>{money(report.netRevenue)}</b>
        <span>− HPP bahan terjual</span>
        <b>{money(report.hpp)}</b>
        <span>− Biaya operasional</span>
        <b>{money(report.operating)}</b>
        <span>− Pajak simulasi</span>
        <b>{money(report.tax)}</b>
        <span className="total">= Laba / rugi bersih</span>
        <b className="total">{verified ? money(report.profit) : 'Hitung hasilmu'}</b>
      </div>
      <p>
        Persentase hasil usaha = laba bersih ÷ (HPP + biaya operasional + pajak) × 100% ={' '}
        <strong>{verified ? percent(report.profitPct) : 'tampil setelah hasilmu diperiksa'}</strong>
        . Dasarnya adalah biaya, bukan pendapatan.
      </p>
      <div className="learning-note">
        <Icon name="book" />
        <p>
          Pembelian bahan belum seluruhnya menjadi biaya. Bahan yang belum terjual masih menjadi
          persediaan bernilai <strong>{money(report.inventoryValue)}</strong>.
        </p>
      </div>
      <h4>Rekonsiliasi kas</h4>
      <p>
        {money(report.cashStart)} − {money(report.purchases)} + {money(report.netRevenue)} −{' '}
        {money(report.operating)} − {money(report.tax)} = <strong>{money(report.cashEnd)}</strong>
      </p>
      <small>
        Kas awal − pembelian + penjualan − operasional − pajak. Laporan berjalan belum membayar
        operasional; angka kas setelah tutup bersifat proyeksi sampai hari diselesaikan.
      </small>
    </div>
  );
}

export function ReportPanel() {
  const session = useStore(gameStore, (s) => s.session)!;
  const [day, setDay] = useState(session.day.number);
  const finalized = session.reports.find((r) => r.day === day);
  const report = finalized ?? buildReport(session);
  return <ReportForDay key={`${profitBasis(report)}:${!!finalized}`} day={day} setDay={setDay} />;
}

function ReportForDay({ day, setDay }: { day: number; setDay: (day: number) => void }) {
  const session = useStore(gameStore, (s) => s.session)!;
  const store = useStore(gameStore);
  const [detail, setDetail] = useState(false);
  const finalized = session.reports.find((r) => r.day === day);
  const report = finalized ?? buildReport(session);
  const [answer, setAnswer] = useState(() =>
    hasCalculatedProfit(report) ? String(report.calculatedProfit) : '',
  );
  const [checked, setChecked] = useState(false);
  const [feedback, setFeedback] = useState('');
  const parsed = parseProfitInput(answer);
  const verified = (hasCalculatedProfit(report) || checked) && parsed === report.profit;
  const blocked = store.readOnly || store.saveStatus === 'failed';
  const checkProfit = () => {
    const problem = profitFeedback(parsed, report.profit);
    if (problem) {
      setFeedback(problem);
      return;
    }
    if (finalized && !store.dispatch({ type: 'calculate_profit', day, answer: parsed! })) {
      setFeedback('Hasil belum tersimpan. Periksa status penyimpanan lalu coba lagi.');
      return;
    }
    setFeedback('');
    setChecked(true);
  };
  // Before settlement the displayed forecast includes the still-reserved operating payment.
  const adjusted = finalized
    ? report
    : { ...report, cashEnd: report.cashEnd - report.operating - report.tax };
  const rows = [
    ['Penjualan kotor', report.revenue],
    ['Diskon · belum aktif', -report.discount],
    ['Pendapatan bersih', report.netRevenue],
    ['HPP bahan terjual', -report.hpp],
    ['Biaya operasional', -report.operating],
    ['Pajak · belum aktif', -report.tax],
  ] as const;
  return (
    <>
      <div className="report-selector">
        <span className="tag green">{finalized ? 'Hari selesai' : 'Laporan berjalan'}</span>
        <label>
          Hari{' '}
          <select
            aria-label="Pilih laporan hari"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          >
            {[...new Set([...session.reports.map((r) => r.day), session.day.number])]
              .reverse()
              .map((n) => (
                <option value={n} key={n}>
                  {n}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className={`profit-hero ${verified && report.profit < 0 ? 'loss' : ''}`}>
        <span>
          {!verified
            ? 'Dari keputusanmu, temukan hasil usahamu'
            : report.profit < 0
              ? 'Ada pelajaran untuk esok hari'
              : report.profit > 0
                ? 'Secangkir usaha, hasil yang terasa'
                : 'Setiap cerita dimulai dari nol'}
        </span>
        <h2>{verified ? money(report.profit) : 'Berapa hasil usahamu?'}</h2>
        <p>
          {verified
            ? `${report.profit < 0 ? 'Rugi bersih' : report.profit === 0 ? 'Impas' : 'Laba bersih'} · ${percent(report.profitPct)} atas biaya`
            : 'Gunakan rincian di bawah untuk menghitung laba atau rugi bersih.'}
        </p>
      </div>
      <div className="report-metrics">
        <div>
          <Icon name="users" />
          <strong>{report.customers}</strong>
          <span>Pelanggan membeli</span>
        </div>
        <div>
          <Icon name="star" />
          <strong>
            {report.reputationChange > 0 ? '+' : ''}
            {report.reputationChange}
          </strong>
          <span>Perubahan reputasi</span>
        </div>
        <div>
          <Icon name="store" />
          <strong>{report.visitors}</strong>
          <span>Total pengunjung</span>
        </div>
      </div>
      <div className="report-lines">
        {rows.map(([label, value]) => (
          <div className="simple-row" key={label}>
            <span>{label}</span>
            <strong>{money(value)}</strong>
          </div>
        ))}
        <div className="simple-row total">
          <span>Laba / rugi bersih</span>
          <strong>{verified ? money(report.profit) : 'Isi hasil hitunganmu'}</strong>
        </div>
      </div>
      <section className="profit-worksheet" aria-label="Panduan menghitung laba atau rugi">
        <h3>
          <Icon name="calculator" size={18} /> Cara menghitung
        </h3>
        <ol>
          <li>Pendapatan bersih = penjualan kotor − diskon.</li>
          <li>Total biaya = HPP bahan terjual + biaya operasional + pajak.</li>
          <li>Laba / rugi bersih = pendapatan bersih − total biaya.</li>
        </ol>
        <p className="profit-equation">
          {money(report.netRevenue)} − ({money(report.hpp)} + {money(report.operating)} +{' '}
          {money(report.tax)}) = <strong>{verified ? money(report.profit) : '?'}</strong>
        </p>
        <p>
          Hasil positif berarti laba, negatif berarti rugi, dan 0 berarti impas. Gunakan HPP bahan
          yang terjual, bukan seluruh pembelian stok.
        </p>
      </section>
      <form
        className={`hpp-calculation ${verified ? 'verified' : ''}`}
        onSubmit={(event) => {
          event.preventDefault();
          if (!blocked) checkProfit();
        }}
      >
        <label htmlFor="profit-answer" className="field-label">
          Hitung laba / rugi bersih · Hari {day}
        </label>
        <div className="hpp-answer-row">
          <div className="money-input">
            <span>Rp</span>
            <input
              id="profit-answer"
              aria-label="Hasil laba atau rugi bersih"
              aria-describedby="profit-feedback profit-input-hint"
              aria-invalid={!!feedback}
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="Isi hasil, pakai minus jika rugi"
              value={answer}
              disabled={blocked}
              onChange={(e) => {
                setAnswer(e.target.value);
                setFeedback('');
                setChecked(false);
              }}
            />
          </div>
          <button
            type="submit"
            className="button secondary"
            disabled={blocked || !answer.trim() || verified}
          >
            <Icon name={verified ? 'check' : 'calculator'} size={16} />{' '}
            {verified ? 'Hasil terverifikasi' : 'Periksa hasil'}
          </button>
        </div>
        <p id="profit-input-hint" className="hpp-feedback">
          Gunakan angka bulat, misalnya 5000 untuk laba, -5000 untuk rugi, atau 0 untuk impas. Salah
          hitung tidak mengurangi uang atau reputasi.
        </p>
        <p id="profit-feedback" role="status" className={feedback ? 'error-text' : 'hpp-feedback'}>
          {feedback ||
            (verified
              ? finalized
                ? 'Tepat! Hasil perhitunganmu tersimpan untuk hari ini.'
                : 'Tepat untuk laporan berjalan ini. Hitung kembali setelah hari selesai karena hasil masih dapat berubah.'
              : 'Jumlahkan biaya, lalu kurangi dari pendapatan bersih. Hasil akhirnya diisi olehmu.')}
        </p>
        {!finalized && (
          <p className="hpp-feedback">
            Laporan ini masih berupa proyeksi. Hasil akhir disimpan setelah kafe tutup.
          </p>
        )}
      </form>
      <button
        className="button secondary full profit-detail-toggle"
        onClick={() => setDetail(!detail)}
        aria-expanded={detail}
      >
        <Icon name="calculator" /> {detail ? 'Tutup perhitungan' : 'Lihat Perhitungan'}
      </button>
      {detail && <Breakdown report={adjusted} verified={verified} />}
      <div className="report-advice">
        <Icon name="sprout" />
        <div>
          <strong>Catatan untuk hari berikutnya</strong>
          <p>
            {!verified
              ? 'Hitung hasil bersihmu, lalu bandingkan pendapatan dan biaya untuk merencanakan hari berikutnya.'
              : report.profit < 0
                ? 'Untung per cup belum tentu menutup biaya harian. Tinjau harga, volume penjualan, dan bahan yang paling cepat habis.'
                : report.customers === 0
                  ? 'Mulai dari bahan secukupnya, pilih harga, lalu amati pelangganmu.'
                  : 'Pertahankan menu favorit dan cek stok susu serta cup sebelum membuka kafe lagi.'}
          </p>
        </div>
      </div>
      <details className="receipt-list">
        <summary>Riwayat transaksi · {report.customers} penjualan</summary>
        {report.receipts.length ? (
          report.receipts.map((r) => (
            <div className="simple-row" key={r.id}>
              <span>
                {r.customer}
                <small>
                  {PRODUCTS[r.product].name} · HPP {money(r.hpp)}
                </small>
              </span>
              <strong>{money(r.price)}</strong>
            </div>
          ))
        ) : (
          <p className="muted">
            {report.customers
              ? 'Rincian hari ini telah diarsipkan. Ringkasan tetap tersedia.'
              : 'Belum ada transaksi pada hari ini.'}
          </p>
        )}
      </details>
      {session.day.phase === 'report' && day === session.day.number && (
        <button
          className="button primary full next-day"
          onClick={() => gameStore.getState().dispatch({ type: 'next' })}
        >
          Siapkan hari {session.day.number + 1}
          <Icon name="arrowRight" size={18} />
        </button>
      )}
    </>
  );
}

export function ReceiptCalculation() {
  const receipt = useStore(gameStore, (s) => s.lastReceipt);
  if (!receipt) return <p>Layani pelanggan pertama untuk melihat perhitungan transaksi.</p>;
  return (
    <>
      <div className="receipt-heading">
        <span className="round-icon">
          <Icon name="coffee" />
        </span>
        <h3>{PRODUCTS[receipt.product].name}</h3>
        <p>
          Disajikan untuk {receipt.customer} · Hari {receipt.day}
        </p>
      </div>
      {receipt.lines.map((l) => (
        <div className="simple-row" key={l.ingredient}>
          <span>
            {INGREDIENTS[l.ingredient].name}
            <small>
              {l.quantity} {INGREDIENTS[l.ingredient].unit}
            </small>
          </span>
          <strong>{money(l.cost)}</strong>
        </div>
      ))}
      <div className="simple-row total">
        <span>HPP aktual</span>
        <strong>{money(receipt.hpp)}</strong>
      </div>
      <div className="formula-banner">
        <span>
          {money(receipt.price)} − {money(receipt.hpp)}
        </span>
        <strong>= {money(receipt.price - receipt.hpp)}</strong>
        <small>Harga jual − HPP = untung / rugi kotor</small>
      </div>
      <div className="learning-note">
        <Icon name="book" />
        <p>
          HPP dihitung dari bahan yang benar-benar dipakai, mulai dari batch pembelian terdahulu.
          Keuntungan ini belum dikurangi biaya operasional harian.
        </p>
      </div>
    </>
  );
}
