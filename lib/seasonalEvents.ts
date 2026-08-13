export type SeasonalEvent = {
  id: string;
  name: string;
  greeting: string;
  subtitle: string;
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
// FESTIVAL DATES
// ==================================================
//
// Update the dates here when necessary.
// Eid, Diwali and Holi follow lunar calendars,
// so their dates should be checked/updated each year.
//
// Format: YYYY-MM-DD
// ==================================================

const FESTIVAL_DATES = {
  // 🌙 Eid al-Fitr
  eidFitr: [
    {
      start: '2027-03-09',
      end: '2027-03-11',
    },
  ],

  // 🕌 Eid al-Adha
  eidAdha: [
    {
      start: '2027-05-16',
      end: '2027-05-18',
    },
  ],

  // 🪔 Diwali
  diwali: [
    {
      start: '2026-11-08',
      end: '2026-11-09',
    },
    {
      start: '2027-10-28',
      end: '2027-10-29',
    },
  ],

  // 🎨 Holi
  holi: [
    {
      start: '2027-03-21',
      end: '2027-03-22',
    },
  ],
};

// ==================================================
// DATE RANGE HELPER
// ==================================================

function isDateInRange(
  currentDate: string,
  start: string,
  end: string
): boolean {
  return (
    currentDate >= start &&
    currentDate <= end
  );
}

// ==================================================
// GET CURRENT SEASONAL EVENT
// ==================================================

export function getSeasonalEvent(
  date: Date = new Date()
): SeasonalEvent | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Use local date instead of UTC date.
  const currentDate = [
    year,
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');

  // ==================================================
  // 🇮🇳 INDEPENDENCE DAY
  // ==================================================

  if (
    month === 8 &&
    (day === 14|| day === 15)
  ) {
    return {
      id: `independence-${year}`,
      name: 'Independence Day',
      greeting: 'Happy Independence Day 🇮🇳',
      subtitle:
        'Celebrating freedom, ambition & growth.',
      icon: '🇮🇳',
      type: 'independence',
      start: `${year}-08-14`,
      end: `${year}-08-15`,
    };
  }

  // ==================================================
  // 🇮🇳 REPUBLIC DAY
  // ==================================================

  if (
    month === 1 &&
    (day === 25 || day === 26)
  ) {
    return {
      id: `republic-${year}`,
      name: 'Republic Day',
      greeting: 'Happy Republic Day 🇮🇳',
      subtitle:
        'Building, growing, and moving forward together.',
      icon: '🇮🇳',
      type: 'republic',
      start: `${year}-01-25`,
      end: `${year}-01-26`,
    };
  }

  // ==================================================
  // 🌙 EID AL-FITR
  // ==================================================

  const eidFitr = FESTIVAL_DATES.eidFitr.find(
    (event) =>
      isDateInRange(
        currentDate,
        event.start,
        event.end
      )
  );

  if (eidFitr) {
    return {
      id: `eid-fitr-${eidFitr.start}`,
      name: 'Eid al-Fitr',
      greeting: 'Eid Mubarak 🌙✨',
      subtitle:
        'Wishing you peace, prosperity & success.',
      icon: '🌙',
      type: 'eid-fitr',
      start: eidFitr.start,
      end: eidFitr.end,
    };
  }

  // ==================================================
  // 🕌 EID AL-ADHA
  // ==================================================

  const eidAdha = FESTIVAL_DATES.eidAdha.find(
    (event) =>
      isDateInRange(
        currentDate,
        event.start,
        event.end
      )
  );

  if (eidAdha) {
    return {
      id: `eid-adha-${eidAdha.start}`,
      name: 'Eid al-Adha',
      greeting: 'Eid Mubarak 🌙✨',
      subtitle:
        'May this Eid bring peace, blessings & prosperity.',
      icon: '🌙',
      type: 'eid-adha',
      start: eidAdha.start,
      end: eidAdha.end,
    };
  }

  // ==================================================
  // 🪔 DIWALI
  // ==================================================

  const diwali = FESTIVAL_DATES.diwali.find(
    (event) =>
      isDateInRange(
        currentDate,
        event.start,
        event.end
      )
  );

  if (diwali) {
    return {
      id: `diwali-${diwali.start}`,
      name: 'Diwali',
      greeting: 'Happy Diwali 🪔✨',
      subtitle:
        'Wishing you light, prosperity & new beginnings.',
      icon: '🪔',
      type: 'diwali',
      start: diwali.start,
      end: diwali.end,
    };
  }

  // ==================================================
  // 🎨 HOLI
  // ==================================================

  const holi = FESTIVAL_DATES.holi.find(
    (event) =>
      isDateInRange(
        currentDate,
        event.start,
        event.end
      )
  );

  if (holi) {
    return {
      id: `holi-${holi.start}`,
      name: 'Holi',
      greeting: 'Happy Holi 🎨✨',
      subtitle:
        'Wishing you a colorful year filled with growth & joy.',
      icon: '🎨',
      type: 'holi',
      start: holi.start,
      end: holi.end,
    };
  }

  // ==================================================
  // 🎄 CHRISTMAS
  // ==================================================

  if (
    month === 12 &&
    (day === 24 || day === 25)
  ) {
    return {
      id: `christmas-${year}`,
      name: 'Christmas',
      greeting: 'Merry Christmas 🎄✨',
      subtitle:
        'Wishing you joy, success & a wonderful season.',
      icon: '🎄',
      type: 'christmas',
      start: `${year}-12-24`,
      end: `${year}-12-25`,
    };
  }

  // ==================================================
  // NORMAL DAY
  // ==================================================

  return null;
}
