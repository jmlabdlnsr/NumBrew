import type { Report } from '../types';

/** Signed integer Rupiah: negative is a loss, zero is break-even. */
export function parseProfitInput(input: string): number | null {
  const text = input.trim();
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(text)) return null;
  const value = Number(text.replaceAll('.', ''));
  return Number.isSafeInteger(value) ? value : null;
}

export function profitFeedback(answer: number | null, expected: number): string | null {
  if (answer === null || !Number.isSafeInteger(answer))
    return 'Isi Rupiah bulat. Gunakan tanda minus jika rugi, misalnya -5000 atau -5.000. Isi 0 jika impas.';
  if (answer === expected) return null;
  if (expected < 0 && answer > 0 && answer === -expected)
    return 'Besar selisihmu sudah tepat. Karena biaya melebihi pendapatan, tulis hasilnya dengan tanda minus.';
  return 'Belum tepat. Mulai dari pendapatan bersih, lalu kurangi HPP bahan terjual, biaya operasional, dan pajak. Jangan kurangi diskon dua kali atau seluruh belanja stok.';
}

export function hasCalculatedProfit(report: Report): boolean {
  return report.calculatedProfit === report.profit;
}

/** Reset a running calculation whenever its underlying business figures change. */
export function profitBasis(report: Report): string {
  return [report.day, report.netRevenue, report.hpp, report.operating, report.tax].join(':');
}
