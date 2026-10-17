import { CONFIG, PEOPLE, PRODUCTS, type Archetype, type ProductId } from '../../data/catalog';
import type { BrewStyle, Customer, CustomerService, Session } from '../types';
import { capacity, consume } from '../inventory/inventory';

export const BREW_SECONDS: Record<BrewStyle, number> = {
  standard: CONFIG.preparationSeconds,
  careful: 6,
  quick: 2,
};

export function createArrivalService(
  customer: Pick<Customer, 'id' | 'archetype' | 'product'>,
  draw: number,
): CustomerService {
  const service = createService(
    customer,
    draw < CONFIG.recommendationChance ? 'greeting' : 'ordered',
  );
  if (service.stage === 'ordered') {
    const menu = PRODUCTS[customer.product].name;
    const orders: Record<Archetype, string[]> = {
      student: [
        `Satu ${menu}, ya. Buat teman belajar nanti.`,
        `Aku pesan ${menu} satu cup, kak!`,
        `Habis sekolah mampir dulu. ${menu} satu, ya.`,
      ],
      university: [
        `Aku pesan ${menu}. Masih ada tugas yang harus diselesaikan.`,
        `Satu ${menu}, ya. Mau duduk sambil belajar.`,
        `Baru selesai kelas. ${menu} satu cup, tolong.`,
      ],
      worker: [
        `Saya pesan satu ${menu} sebelum kembali kerja.`,
        `${menu} satu, ya. Sedang istirahat sebentar.`,
        `Selamat siang. Satu ${menu}, tolong.`,
      ],
      blogger: [
        `Hari ini aku mau mencoba ${menu}. Satu, ya!`,
        `Aku sudah lihat menunya. Pesan satu ${menu}.`,
        `${menu} terlihat menarik. Aku pesan satu cup.`,
      ],
      loyal: [
        `Mampir lagi! Hari ini pesan ${menu} satu, ya.`,
        `Halo! Satu ${menu} untuk menemani soreku.`,
        `Senang kembali ke sini. Pesan ${menu}, ya.`,
      ],
    };
    service.line = orders[customer.archetype][service.variant];
  }
  return service;
}

const greetings: Record<Archetype, string[]> = {
  student: [
    'Habis sekolah ingin yang manis. Ada yang cocok buat uang sakuku?',
    'Aku mampir sebelum belajar kelompok. Boleh lihat racikanmu?',
    'Hari ini ingin jajan enak, tapi uang sakuku terbatas.',
  ],
  university: [
    'Tugas kuliah masih panjang. Aku butuh teman begadang yang pas.',
    'Baru selesai kelas. Lagi ingin minuman dengan rasa kopi yang terasa.',
    'Mau duduk mengerjakan tugas. Ada rekomendasi minuman?',
  ],
  worker: [
    'Istirahatku sebentar. Aku mencari minuman enak sebelum kembali kerja.',
    'Hari kerja cukup padat. Ingin secangkir yang diracik dengan baik.',
    'Mampir di sela pekerjaan. Bisa bantu pilihkan minuman?',
  ],
  blogger: [
    'Kafemu menarik! Aku ingin mencoba racikan yang pantas diceritakan.',
    'Sedang berburu rasa untuk ulasan hari ini. Apa yang spesial?',
    'Halo! Aku suka menemukan kafe kecil dengan pelayanan yang berkesan.',
  ],
  loyal: [
    'Senang mampir lagi. Masih ingat rasa kesukaanku?',
    'Sudut ini memang nyaman. Pilihkan sesuatu untuk menemani soreku, ya.',
    'Halo, aku datang lagi! Hari ini ingin racikan yang akrab di lidah.',
  ],
};
const thanks: Record<Archetype, string[]> = {
  student: [
    'Pas di kantong, enak buat teman belajar. Terima kasih!',
    'Uang sakuku cukup dan dapat minuman enak. Asyik!',
    'Besok mau ajak teman sekolah mampir juga.',
  ],
  university: [
    'Ini baru teman mengerjakan tugas. Makasih!',
    'Aroma dan rasanya pas. Siap lanjut belajar!',
    'Satu cup dulu, lalu kembali mengejar tugas. Terima kasih!',
  ],
  worker: [
    'Terima kasih. Istirahat singkatku jadi lebih menyenangkan.',
    'Pas untuk menyegarkan pikiran sebelum lanjut kerja.',
    'Pelayanan yang baik membuatku ingin mampir lagi.',
  ],
  blogger: [
    'Rasanya menarik! Pelayanannya akan masuk ceritaku hari ini.',
    'Ada cerita hangat di balik secangkir ini. Terima kasih!',
    'Kafe kecil dengan perhatian besar. Layak direkomendasikan.',
  ],
  loyal: [
    'Rasanya bikin ingin kembali. Sampai ketemu lagi!',
    'Selalu senang disambut di sini. Terima kasih, ya.',
    'Kamu membuat sudut favoritku terasa semakin akrab.',
  ],
};

export function createService(
  customer: Pick<Customer, 'id' | 'archetype'>,
  stage: CustomerService['stage'] = 'greeting',
): CustomerService {
  // The ID provides stable variety without advancing the economic RNG.
  const variant = Array.from(customer.id).reduce((n, char) => n + char.charCodeAt(0), 0) % 3;
  return {
    stage,
    variant,
    askedTaste: false,
    askedBudget: false,
    refusals: 0,
    line:
      stage === 'ordered'
        ? 'Pesananku sudah dicatat. Silakan diracik, ya.'
        : greetings[customer.archetype][variant],
    style: null,
    startedAt: null,
    readyAt: null,
  };
}

export function remainingPatience(customer: Customer, elapsed: number): number {
  return Math.max(0, customer.patience - (elapsed - customer.arrivedAt));
}
export function customerSpeech(customer: Customer, elapsed: number): string {
  const remaining = remainingPatience(customer, elapsed);
  if (remaining <= 10 && customer.service.stage !== 'ready') {
    return customer.archetype === 'worker'
      ? 'Maaf, sebentar lagi harus kembali kerja. Pesananku sudah sampai mana?'
      : [
          'Aku sudah agak lama menunggu. Bisa dibantu, ya?',
          'Sebentar lagi aku harus pergi. Bagaimana pesananku?',
          'Semoga masih sempat menikmati minumannya sebelum pergi.',
        ][customer.service.variant];
  }
  return customer.service.line;
}
export function tasteReply(customer: Customer): string {
  const favorite = PRODUCTS[PEOPLE[customer.archetype].favorite].name;
  return {
    student: `Aku suka yang lembut dan manis seperti ${favorite}. Harga tetap penting buatku.`,
    university: `${favorite} favoritku. Rasa kopi cocok untuk menemani tugas, tapi aku juga terbuka mencoba yang lain.`,
    worker: `Biasanya ${favorite}. Kalau sempat, aku menghargai racikan yang teliti.`,
    blogger: `Aku penasaran dengan ${favorite}. Rasa dan perhatian saat melayani akan kuceritakan.`,
    loyal: `Kesukaanku ${favorite}. Senang sekali kalau kamu mengingatnya.`,
  }[customer.archetype];
}
export function thankYou(customer: Customer): string {
  const line = thanks[customer.archetype][customer.service.variant];
  return customer.service.style === 'careful' ? `${line} Terasa diracik dengan perhatian.` : line;
}

/** Reserve recipe quantities for drinks already on the bar without charging cash or HPP. */
export function brewingCapacity(
  session: Session,
  product: ProductId,
  excludingId?: string,
): number {
  const inventory = structuredClone(session.inventory);
  for (const other of session.day.customers) {
    if (other.id === excludingId || !['preparing', 'ready'].includes(other.service.stage)) continue;
    if (capacity(inventory, other.product) < 1) return 0;
    for (const [id, quantity] of Object.entries(PRODUCTS[other.product].recipe)) {
      consume(inventory, id as keyof typeof inventory, quantity);
    }
  }
  return capacity(inventory, product);
}
