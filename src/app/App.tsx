import { useEffect } from 'react';
import { useStore } from 'zustand';
import { createSession } from '../application/commands';
import { PRODUCTS, productIds } from '../data/catalog';
import { capacity, inventoryValue, recipeCost } from '../domain/inventory/inventory';
import { buildReport } from '../domain/reports/report';
import { hasCalculatedHpp } from '../domain/pricing/hpp';
import { gameStore, type Panel } from '../store/gameStore';
import { Icon, type IconName } from '../components/Icon';
import { Modal } from '../components/Modal';
import { PhaserHost } from '../game/PhaserHost';
import { InventoryPanel, PricingPanel, ProductArt, SupplierPanel } from '../features/Management';
import { ReceiptCalculation, ReportPanel } from '../features/Reports';
import { HelpPanel, SettingsPanel } from '../features/HelpSettings';
import { CounterMenu, CustomerBubbles, ServiceCounter } from '../features/CustomerService';
import { gameTime, money } from '../utils/format';

const preview = createSession(20261016, 'preview');
const panels: Record<NonNullable<Panel>, { title: string; eyebrow: string }> = {
  supplier: { title: 'Belanja bahan, racik peluang.', eyebrow: 'SUPPLIER KAFE' },
  inventory: { title: 'Semua yang ada di rakmu.', eyebrow: 'PERSEDIAAN' },
  pricing: { title: 'Menu yang punya cerita.', eyebrow: 'MENU & HARGA' },
  report: { title: 'Cerita di balik angka.', eyebrow: 'LAPORAN USAHA' },
  help: { title: 'Mari kenali kafemu.', eyebrow: 'BUKU PANDUAN' },
  settings: { title: 'Buat dirimu nyaman.', eyebrow: 'PENGATURAN' },
  calculation: { title: 'Dari bahan menjadi hasil.', eyebrow: 'LIHAT PERHITUNGAN' },
};
const nav: { label: string; icon: IconName; panel: Panel }[] = [
  { label: 'Kafe saya', icon: 'store', panel: null },
  { label: 'Beli bahan', icon: 'basket', panel: 'supplier' },
  { label: 'Persediaan', icon: 'package', panel: 'inventory' },
  { label: 'Menu & harga', icon: 'coffee', panel: 'pricing' },
  { label: 'Laporan usaha', icon: 'report', panel: 'report' },
];

export default function App() {
  const store = useStore(gameStore);
  const { started, panel, toast } = store;
  const session = store.session ?? preview;
  const day = session.day;
  const report = buildReport(session);
  const profitVerified = session.reports.some(
    (r) => r.day === day.number && r.calculatedProfit === r.profit,
  );
  const active = day.phase === 'open' || day.phase === 'closing';
  const ready = productIds.some(
    (id) => session.menu[id].active && capacity(session.inventory, id) > 0,
  );
  const canOpen = ready && session.cash >= day.operatingCost;
  const activeMenu = productIds.filter((id) => session.menu[id].active).length;
  const status = !started
    ? 'Kisah baru menantimu'
    : {
        preparation: 'Waktunya persiapan',
        open: store.paused ? 'Kafe dijeda' : 'Kafe sedang buka',
        closing: 'Pesanan terakhir',
        report: 'Hari yang penuh cerita',
      }[day.phase];
  const openPanel = (target: Panel) => {
    if (!store.started && target && target !== 'help' && target !== 'settings') store.start();
    if (target && target !== 'help' && target !== 'settings' && !gameStore.getState().session)
      return;
    store.openPanel(target);
  };
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => gameStore.setState({ toast: null }), 4800);
    return () => clearTimeout(timeout);
  }, [toast]);
  return (
    <div className={`app-shell ${store.reducedMotion ? 'reduced-motion' : ''}`}>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            store.openPanel(null);
          }}
          aria-label="NumBrew, beranda"
        >
          <span className="brand-icon">
            <img src="/icon.png" alt="" />
          </span>
          <span>
            Num<span className="brand-accent">Brew</span>
            <small>BREW IDEAS, BLEND NUMBERS!</small>
          </span>
        </a>
        <div className="sidebar-section">RUANG KERJAMU</div>
        <nav aria-label="Navigasi utama">
          {nav.map((item) => (
            <button
              className={`nav-item ${panel === item.panel ? 'selected' : ''}`}
              key={item.label}
              onClick={() => openPanel(item.panel)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.panel === null && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-section second">TEMAN BELAJAR</div>
        <button className="nav-item" onClick={() => openPanel('help')}>
          <Icon name="book" />
          <span>Panduan bermain</span>
          <Icon name="chevron" size={15} />
        </button>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => openPanel('settings')}>
            <Icon name="settings" />
            <span>Pengaturan</span>
          </button>
          <div className="owner-profile">
            <div className="owner-avatar">K</div>
            <div>
              <strong>Pemilik kafe</strong>
              <span>Perjalanan hari {day.number}</span>
            </div>
            <Icon name="leaf" size={18} />
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <div>
            <div className="greeting">
              <Icon name="sun" size={16} />{' '}
              {active ? 'SELAMAT MELAYANI' : 'SELAMAT DATANG DI KAFEMU'}
            </div>
            <h1>
              {!started
                ? 'Cerita baik dimulai di sini.'
                : day.phase === 'report'
                  ? 'Satu hari, banyak pelajaran.'
                  : active
                    ? 'Secangkir hangat, senyum baru.'
                    : 'Hari baru, racikan baru.'}
            </h1>
            <p>
              {!started
                ? 'Bangun kafe impianmu. Temukan matematika dalam setiap keputusan.'
                : status + '. Pelan-pelan, kita tumbuh bersama.'}
            </p>
          </div>
          <div className="header-actions">
            <span className="day-pill">
              <Icon name="sun" size={18} /> Hari {day.number}
            </span>
            <button
              className="icon-button help-button"
              aria-label="Buka panduan"
              onClick={() => openPanel('help')}
            >
              <Icon name="help" size={22} />
            </button>
          </div>
        </header>
        {(store.warning || store.readOnly) && (
          <div className="notice status-warning" role="status">
            <span>
              {store.readOnly
                ? 'Kafe sedang dibuka di tab lain. Tutup tab tersebut lalu muat ulang untuk bermain di sini.'
                : store.warning}
            </span>
            <button className="text-button" onClick={() => openPanel('settings')}>
              Pengaturan
            </button>
          </div>
        )}
        <section className="stats-grid" aria-label="Ringkasan kafe">
          <Stat
            icon="wallet"
            label="Kas kafe"
            value={money(session.cash)}
            note={
              started && active
                ? `${money(day.operatingCost)} dicadangkan untuk operasional`
                : 'Modal untuk cerita berikutnya'
            }
            color="green"
          />
          <Stat
            icon="package"
            label="Nilai persediaan"
            value={money(inventoryValue(session.inventory))}
            note="Bahan tersisa, peluang tersimpan"
            color="gold"
          />
          <Stat
            icon="users"
            label="Pelanggan hari ini"
            value={`${day.receipts.length}`}
            note="Senyum yang sudah dilayani"
            color="rose"
          />
          <Stat
            icon="star"
            label="Reputasi kafe"
            value={`${session.reputation} / 100`}
            note={
              session.reputation >= 75
                ? 'Mulai jadi favorit'
                : session.reputation >= 60
                  ? 'Semakin dikenal'
                  : 'Pendatang baru yang hangat'
            }
            color="sage"
          />
        </section>
        <div className={`workspace-grid ${started && active ? 'serving-workspace' : ''}`}>
          <div className="cafe-column">
            <section className="cafe-card" aria-label="Kafe interaktif">
              <div className="cafe-topline">
                <div>
                  <span className={`status-dot ${active && !store.paused ? 'live' : ''}`} />
                  <strong>
                    {active
                      ? 'Pintu terbuka, cerita mengalir'
                      : day.phase === 'report'
                        ? 'Sampai jumpa esok hari'
                        : 'Sudut hangat milikmu'}
                  </strong>
                </div>
                <span>
                  <Icon name="clock" size={14} /> {gameTime(day.elapsed, day.duration)}
                </span>
              </div>
              <div className="scene-wrap">
                <PhaserHost />
                <div className={`scene-badge ${active ? 'open' : ''}`}>
                  <Icon name={active ? 'coffee' : 'leaf'} size={14} />
                  {active
                    ? day.phase === 'closing'
                      ? 'PESANAN TERAKHIR'
                      : 'KAFE BUKA'
                    : day.phase === 'report'
                      ? 'SAMPAI BESOK'
                      : 'SEBELUM CERITA DIMULAI'}
                </div>
                {started && active && <CustomerBubbles />}
                {started && active && store.paused && (
                  <div className="paused-overlay">
                    <span>
                      <Icon name="pause" /> Waktu sedang dijeda
                    </span>
                    <button
                      className="button primary"
                      disabled={store.saveStatus === 'failed' || store.readOnly}
                      onClick={store.togglePause}
                    >
                      <Icon name="play" size={17} /> Lanjutkan
                    </button>
                  </div>
                )}
              </div>
              <div className="cafe-control">
                <div className="cafe-status-icon">
                  <Icon
                    name={active ? 'coffee' : day.phase === 'report' ? 'check' : 'sun'}
                    size={24}
                  />
                </div>
                <div className="cafe-control-copy">
                  <strong>{status}</strong>
                  <span>
                    {active
                      ? `${day.customers.length} pesanan menunggu · ${Math.max(0, (day.phase === 'closing' ? day.closeAt : day.duration) - day.elapsed)} detik tersisa`
                      : day.phase === 'report'
                        ? profitVerified
                          ? `Hasil usaha hari ini: ${money(report.profit)}`
                          : 'Hitung laba / rugi bersihmu di laporan hari ini.'
                        : 'Siapkan bahan dan harga, lalu sambut pelanggan pertamamu.'}
                  </span>
                </div>
                {started && day.phase === 'preparation' && (
                  <button
                    className="button primary"
                    disabled={!canOpen || store.readOnly || store.saveStatus === 'failed'}
                    onClick={() => store.dispatch({ type: 'open' })}
                  >
                    <Icon name="play" size={17} /> Buka kafe
                  </button>
                )}
                {started && active && (
                  <div className="button-row">
                    <button
                      className="icon-button pause-control"
                      aria-label={store.paused ? 'Lanjutkan kafe' : 'Jeda kafe'}
                      disabled={store.readOnly || store.saveStatus === 'failed'}
                      onClick={store.togglePause}
                    >
                      <Icon name={store.paused ? 'play' : 'pause'} size={18} />
                    </button>
                    <button
                      className="button secondary"
                      disabled={store.readOnly}
                      onClick={() =>
                        store.dispatch({ type: day.phase === 'open' ? 'close' : 'finish' })
                      }
                    >
                      {day.phase === 'open' ? 'Tutup kafe' : 'Selesaikan hari'}
                    </button>
                  </div>
                )}
                {started && day.phase === 'report' && (
                  <button className="button primary" onClick={() => openPanel('report')}>
                    Lihat laporan
                    <Icon name="arrowRight" size={17} />
                  </button>
                )}
                {!started && (
                  <span className="small-decor">
                    <Icon name="sparkles" size={22} />
                  </span>
                )}
              </div>
              <div className="day-progress">
                <span style={{ width: `${Math.min(100, (day.elapsed / day.duration) * 100)}%` }} />
              </div>
            </section>
            {started && active && <CounterMenu />}
          </div>
          <aside className={`day-panel ${started && active ? 'serving-panel' : ''}`}>
            {!started ? (
              <>
                <span className="eyebrow">
                  {store.session ? 'CERITAMU BERLANJUT' : 'BAB PERTAMA'}
                </span>
                <h2>
                  Kafe kecil, <br />
                  mimpi besar.
                </h2>
                <p>
                  {store.session
                    ? `Usahamu tersimpan di hari ${day.number}. Kembali meracik cerita berikutnya.`
                    : 'Modal sudah siap. Sekarang giliranmu meracik usaha yang punya cerita.'}
                </p>
                <div className="starting-capital">
                  <span>{store.session ? 'Kas tersimpan' : 'Modal awalmu'}</span>
                  <strong>{money(session.cash)}</strong>
                  <Icon name="coins" size={32} />
                </div>
                <ul className="welcome-list">
                  <li>
                    <Icon name="check" size={16} /> Belanja dan kelola bahan
                  </li>
                  <li>
                    <Icon name="check" size={16} /> Tentukan harga terbaikmu
                  </li>
                  <li>
                    <Icon name="check" size={16} /> Belajar dari hasil usahamu
                  </li>
                </ul>
                <button
                  className="button primary full"
                  disabled={store.readOnly}
                  onClick={() => store.start()}
                >
                  {store.session ? 'Lanjutkan usahamu' : 'Mulai usaha'}
                  <Icon name="arrowRight" size={18} />
                </button>
                <small className="welcome-footnote">
                  Santai. Tidak ada kuis, hanya keputusanmu.
                </small>
              </>
            ) : active ? (
              <ServiceCounter />
            ) : day.phase === 'report' ? (
              <>
                <span className="eyebrow">CATATAN PENUTUP</span>
                <h2>
                  Hari ini, <br />
                  kamu bertumbuh.
                </h2>
                <p>Setiap hasil menyimpan pelajaran untuk racikan berikutnya.</p>
                <div
                  className={`day-result ${profitVerified && report.profit < 0 ? 'negative' : ''}`}
                >
                  <span>
                    {profitVerified
                      ? report.profit < 0
                        ? 'Rugi bersih'
                        : 'Laba bersih'
                      : 'Laba / rugi bersih'}
                  </span>
                  <strong>{profitVerified ? money(report.profit) : 'Hitung hasilmu'}</strong>
                  <small>{report.customers} pelanggan telah dilayani</small>
                </div>
                <button className="button primary full" onClick={() => openPanel('report')}>
                  Buka laporan
                  <Icon name="arrowRight" size={18} />
                </button>
              </>
            ) : (
              <>
                <span className="eyebrow">SEBELUM BUKA</span>
                <h2>
                  Racik rencana <br />
                  hari ini.
                </h2>
                <p>Tiga hal kecil untuk awal yang baik.</p>
                <div className="checklist">
                  <Checklist
                    done={ready}
                    title="Isi rak bahan"
                    description={
                      ready ? 'Bahan untuk meracik sudah tersedia' : 'Belanja bahan dari supplier'
                    }
                    onClick={() => openPanel('supplier')}
                  />
                  <Checklist
                    done={activeMenu > 0}
                    title="Siapkan menu & harga"
                    description={`${activeMenu} menu aktif · tinjau HPP-nya`}
                    onClick={() => openPanel('pricing')}
                  />
                  <Checklist
                    done={session.cash >= day.operatingCost}
                    title="Sisihkan operasional"
                    description={`${money(day.operatingCost)} per hari buka`}
                    onClick={() => openPanel('help')}
                  />
                </div>
                <button
                  className="button primary full"
                  onClick={() => openPanel(ready ? 'pricing' : 'supplier')}
                >
                  <Icon name={ready ? 'coffee' : 'basket'} size={17} />
                  {ready ? 'Tinjau menu & harga' : 'Yuk, belanja bahan'}
                </button>
                <small className="welcome-footnote">
                  Persiapan bebas waktu. Pikirkan baik-baik.
                </small>
              </>
            )}
          </aside>
        </div>
        <section className={`menu-section ${started && active ? 'menu-after-service' : ''}`}>
          <div className="section-heading">
            <div>
              <h2>
                Menu hari ini<span className="count-badge">3 racikan</span>
              </h2>
              <p>Dari bahan sederhana, jadi sesuatu yang istimewa.</p>
            </div>
            <button className="text-button" onClick={() => openPanel('pricing')}>
              Atur menu & harga <Icon name="arrowRight" size={17} />
            </button>
          </div>
          <div className="product-grid">
            {productIds.map((id) => {
              const item = PRODUCTS[id];
              const cost = recipeCost(session.inventory, id);
              const portions = capacity(session.inventory, id);
              return (
                <article className="product-card" key={id}>
                  <div className="product-visual" style={{ background: `${item.color}17` }}>
                    <ProductArt id={id} />
                    <span className={`product-stock ${portions ? 'available' : ''}`}>
                      {!session.menu[id].active
                        ? 'Menu nonaktif'
                        : portions
                          ? `${portions} porsi tersedia`
                          : 'Perlu bahan'}
                    </span>
                  </div>
                  <div className="product-info">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="product-price">
                      <strong>{money(session.menu[id].price)}</strong>
                      <span>
                        HPP{' '}
                        <b>
                          {session.day.phase === 'preparation' && !hasCalculatedHpp(session, id)
                            ? 'Hitung di Menu & harga'
                            : money(cost.hpp)}
                        </b>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <div className="bottom-note">
          <span className="round-icon">
            <Icon name="book" size={19} />
          </span>
          <div>
            <strong>
              {store.lastReceipt ? 'Satu transaksi, satu pelajaran baru.' : 'Tahukah kamu?'}
            </strong>
            <p>
              {store.lastReceipt
                ? `Penjualan terakhirmu menghasilkan ${money(store.lastReceipt.price - store.lastReceipt.hpp)} sebelum biaya operasional.`
                : 'Uang yang dibelanjakan untuk bahan belum tentu menjadi biaya hari ini. Stok yang tersisa masih punya nilai.'}
            </p>
          </div>
          <button
            className="text-button"
            onClick={() => openPanel(store.lastReceipt ? 'calculation' : 'help')}
          >
            {store.lastReceipt ? 'Lihat Perhitungan' : 'Pelajari lebih lanjut'}
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
        <footer className="page-footer">
          <div className="mobile-tools">
            <button
              className="icon-button"
              aria-label="Buka pengaturan"
              onClick={() => openPanel('settings')}
            >
              <Icon name="settings" size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Bantuan bermain"
              onClick={() => openPanel('help')}
            >
              <Icon name="book" size={19} />
            </button>
          </div>
        </footer>
      </main>
      {toast && (
        <div
          className={`toast ${toast.error ? 'error' : ''}`}
          role={toast.error ? 'alert' : 'status'}
        >
          <Icon name={toast.error ? 'help' : 'check'} size={20} />
          <span>{toast.text}</span>
          <button
            aria-label="Tutup pemberitahuan"
            onClick={() => gameStore.setState({ toast: null })}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
      {panel && (
        <Modal
          title={panels[panel].title}
          eyebrow={panels[panel].eyebrow}
          onClose={() => store.openPanel(null)}
          wide={panel === 'pricing' || panel === 'supplier'}
        >
          {panel === 'supplier' && store.session && <SupplierPanel />}
          {panel === 'inventory' && store.session && <InventoryPanel />}
          {panel === 'pricing' && store.session && <PricingPanel />}
          {panel === 'report' && store.session && <ReportPanel />}
          {panel === 'calculation' && <ReceiptCalculation />}
          {panel === 'help' && <HelpPanel />}
          {panel === 'settings' && <SettingsPanel />}
        </Modal>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
  color,
}: {
  icon: IconName;
  label: string;
  value: string;
  note: string;
  color: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${color}`}>
          <Icon name={icon} size={19} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
function Checklist({
  done,
  title,
  description,
  onClick,
}: {
  done: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button className="checklist-item" onClick={onClick}>
      <span className={`check-circle ${done ? 'done' : ''}`}>
        {done ? <Icon name="check" size={15} /> : <span />}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <Icon name="chevron" size={14} />
    </button>
  );
}
