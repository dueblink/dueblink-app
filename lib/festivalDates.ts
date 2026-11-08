// ==================================================
// FESTIVAL DATES — one list for the whole site
// ==================================================
//
// Used by:
//   lib/seasonalEvents.ts   (greetings, festive decorations, dashboard nudge)
//   lib/seasonalPricing.ts  (festival offers)
//
// Fixed-date days (Independence Day, Republic Day, Christmas) are worked
// out automatically every year, so they are not listed here.
//
// Diwali, Holi and Eid follow lunar calendars, so their dates change every
// year. They are filled in below up to 2030 (Diwali to 2031), from Indian
// festival calendars. Eid depends on the moon sighting and can move by a
// day, so the site shows Eid from the day before to the day after.
//
// Format: YYYY-MM-DD (the main festival day in India)
// Next update needed: before the end of 2030.
// ==================================================

export const FESTIVAL_DAYS = {
  // 🪔 Diwali (Lakshmi Puja)
  diwali: ['2026-11-08', '2027-10-29', '2028-10-17', '2029-11-05', '2030-10-26', '2031-11-14'],

  // 🎨 Holi (Rangwali Holi / Dhulandi, the colours day)
  holi: ['2027-03-22', '2028-03-11', '2029-03-01', '2030-03-20'],

  // 🌙 Eid al-Fitr (expected date in India)
  eidFitr: ['2027-03-10', '2028-02-27', '2029-02-15', '2030-02-05'],

  // 🌙 Eid al-Adha / Bakrid (expected date in India)
  eidAdha: ['2027-05-17', '2028-05-06', '2029-04-25', '2030-04-14'],
};

// Adds days to a YYYY-MM-DD date and returns YYYY-MM-DD.
export function shiftDate(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
