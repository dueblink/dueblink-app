// Late payment interest maths (no React here, so it's easy to test).
//
// MSMED Act, 2006 (sections 15 and 16), for micro and small enterprises:
// - The buyer must pay by the agreed date, and that date can't be more
//   than 45 days after the goods/services were accepted.
// - With no written agreement, payment is due within 15 days.
// - If paid late, the buyer owes compound interest with monthly rests
//   at 3 times the bank rate notified by the RBI.

// Update this when the RBI changes the Bank Rate.
// Bank Rate 5.75% after the RBI policy of 7 October 2026.
export const RBI_BANK_RATE = 5.75;
export const RBI_BANK_RATE_AS_OF = '7 October 2026';

export const MSME_MAX_DAYS = 45;
export const MSME_NO_AGREEMENT_DAYS = 15;

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export type InterestResult = {
  dueDate: Date;
  daysLate: number;
  annualRate: number;   // % per year used
  interest: number;
  total: number;
};

// mode 'msme': compound interest, monthly rests, 3x bank rate.
// mode 'custom': simple interest at the rate agreed in your contract.
export function calculateInterest(opts: {
  amount: number;
  startDate: Date;          // date goods/services were accepted (or invoice date)
  creditDays: number;       // agreed credit period
  paymentDate: Date;        // date paid, or today if still unpaid
  mode: 'msme' | 'custom';
  bankRate: number;         // % per year
  customRate: number;       // % per year
}): InterestResult {
  const allowedDays = opts.mode === 'msme'
    ? Math.min(Math.max(opts.creditDays, 0), MSME_MAX_DAYS)
    : Math.max(opts.creditDays, 0);

  const dueDate = addDays(opts.startDate, allowedDays);
  const daysLate = Math.max(0, daysBetween(dueDate, opts.paymentDate));

  const annualRate = opts.mode === 'msme' ? opts.bankRate * 3 : opts.customRate;

  let interest = 0;
  if (daysLate > 0 && opts.amount > 0 && annualRate > 0) {
    if (opts.mode === 'msme') {
      // Compounded every month: (1 + yearly rate / 12) ^ number of months.
      const months = (daysLate * 12) / 365;
      interest = opts.amount * (Math.pow(1 + annualRate / 100 / 12, months) - 1);
    } else {
      interest = opts.amount * (annualRate / 100) * (daysLate / 365);
    }
  }

  interest = Math.round(interest);

  return {
    dueDate,
    daysLate,
    annualRate,
    interest,
    total: Math.round(opts.amount) + interest,
  };
}

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
