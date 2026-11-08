import { FESTIVAL_DAYS, shiftDate } from './festivalDates';

export type SeasonalEvent = {
  id: string;
  name: string;
  greeting: string;
  subtitle: string;
  // A short, useful line about payments for this festival
  // (used on the landing page pill and the dashboard nudge).
  tip: string;
  icon: string;
  type:
    | 'independence'
    | 'republic'
    | 'eid-fitr'
    | 'eid-adha'
    | 'diwali'
    | 'holi'
    | 'christmas';
  start: string;
  end: string;
};

// ==================================================
// Dates now come from lib/festivalDates.ts (one list for the
// whole site, filled in until 2030). Nothing to update here.
// ==================================================

function isDateInRange(currentDate: string, start: string, end: string): boolean {
  return currentDate >= start && currentDate <= end;
}

// Finds the festival day whose window (daysBefore … daysAfter) includes today.
function findWindow(days: string[], today: string, daysBefore: number, daysAfter: number) {
  for (const day of days) {
    const start = shiftDate(day, -daysBefore);
    const end = shiftDate(day, daysAfter);
    if (isDateInRange(today, start, end)) return { day, start, end };
  }
  return null;
}

// ==================================================
// GET CURRENT SEASONAL EVENT
// ==================================================

export function getSeasonalEvent(date: Date = new Date()): SeasonalEvent | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Use the local date (the visitor's own calendar day).
  const currentDate = [year, String(month).padStart(2, '0'), String(day).padStart(2, '0')].join('-');

  // 🇮🇳 INDEPENDENCE DAY (14–15 Aug)
  if (month === 8 && (day === 14 || day === 15)) {
    return {
      id: `independence-${year}`,
      name: 'Independence Day',
      greeting: 'Happy Independence Day 🇮🇳',
      subtitle: 'Celebrating freedom, ambition & growth.',
      tip: 'Freedom from chasing payments: let DueBlink follow up for you.',
      icon: '🇮🇳',
      type: 'independence',
      start: `${year}-08-14`,
      end: `${year}-08-15`,
    };
  }

  // 🇮🇳 REPUBLIC DAY (25–26 Jan)
  if (month === 1 && (day === 25 || day === 26)) {
    return {
      id: `republic-${year}`,
      name: 'Republic Day',
      greeting: 'Happy Republic Day 🇮🇳',
      subtitle: 'Building, growing, and moving forward together.',
      tip: 'Start the year clean: follow up on every pending payment.',
      icon: '🇮🇳',
      type: 'republic',
      start: `${year}-01-25`,
      end: `${year}-01-26`,
    };
  }

  // 🌙 EID AL-FITR (day before to day after, for the moon sighting)
  const eidFitr = findWindow(FESTIVAL_DAYS.eidFitr, currentDate, 1, 1);
  if (eidFitr) {
    return {
      id: `eid-fitr-${eidFitr.day}`,
      name: 'Eid al-Fitr',
      greeting: 'Eid Mubarak 🌙✨',
      subtitle: 'Wishing you peace, prosperity & success.',
      tip: 'Eid Mubarak to your clients: send warm wishes with a gentle reminder for pending payments.',
      icon: '🌙',
      type: 'eid-fitr',
      start: eidFitr.start,
      end: eidFitr.end,
    };
  }

  // 🌙 EID AL-ADHA (day before to day after)
  const eidAdha = findWindow(FESTIVAL_DAYS.eidAdha, currentDate, 1, 1);
  if (eidAdha) {
    return {
      id: `eid-adha-${eidAdha.day}`,
      name: 'Eid al-Adha',
      greeting: 'Eid Mubarak 🌙✨',
      subtitle: 'May this Eid bring peace, blessings & prosperity.',
      tip: 'Eid Mubarak to your clients: send warm wishes with a gentle reminder for pending payments.',
      icon: '🌙',
      type: 'eid-adha',
      start: eidAdha.start,
      end: eidAdha.end,
    };
  }

  // 🪔 DIWALI (day before to day after)
  const diwali = findWindow(FESTIVAL_DAYS.diwali, currentDate, 1, 1);
  if (diwali) {
    return {
      id: `diwali-${diwali.day}`,
      name: 'Diwali',
      greeting: 'Happy Diwali 🪔✨',
      subtitle: 'Wishing you light, prosperity & new beginnings.',
      tip: 'Clear your dues before Diwali: send a warm festive reminder.',
      icon: '🪔',
      type: 'diwali',
      start: diwali.start,
      end: diwali.end,
    };
  }

  // 🎨 HOLI (Holika Dahan day + colours day)
  const holi = findWindow(FESTIVAL_DAYS.holi, currentDate, 1, 0);
  if (holi) {
    return {
      id: `holi-${holi.day}`,
      name: 'Holi',
      greeting: 'Happy Holi 🎨✨',
      subtitle: 'Wishing you a colorful year filled with growth & joy.',
      tip: 'Collect before the holidays: send a friendly reminder for pending payments.',
      icon: '🎨',
      type: 'holi',
      start: holi.start,
      end: holi.end,
    };
  }

  // 🎄 CHRISTMAS (24–25 Dec)
  if (month === 12 && (day === 24 || day === 25)) {
    return {
      id: `christmas-${year}`,
      name: 'Christmas',
      greeting: 'Merry Christmas 🎄✨',
      subtitle: 'Wishing you joy, success & a wonderful season.',
      tip: 'Close the year clean: follow up on pending invoices before the holidays.',
      icon: '🎄',
      type: 'christmas',
      start: `${year}-12-24`,
      end: `${year}-12-25`,
    };
  }

  // NORMAL DAY
  return null;
}
