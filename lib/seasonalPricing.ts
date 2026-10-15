// ==================================================
// DUEBLINK PRICING (INDIA)
// ==================================================
//
// Normal pricing:
//   Monthly: ₹299
//   Yearly:  ₹2,499
//
// Early offer (first 20 paying users, once per person):
//   ₹99 for the first month (then ₹299/month), or
//   ₹999 for the first year (then ₹2,499/year).
//   Who qualifies is decided on the SERVER (lib/earlyOffer.ts),
//   because it needs the database counter.
//
// Festival offers:
//   Start 3 days before the festival, end 1 day after.
//   A festival offer is ONLY used when it is CHEAPER than the
//   normal price. To run one, set its prices below ₹299 / ₹2,499.
//
// International pricing ($9 / $89) is handled separately and
// is not changed here.
// ==================================================

export const NORMAL_PRICES = {
  monthly: 299,
  yearly: 2499,
};

export const EARLY_OFFER = {
  monthly: 99,
  yearly: 999,
  totalSpots: 20,
};

export type SeasonalPricing = {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  festivalDate: string;
  start: string;
  end: string;
};

// ==================================================
// DATE HELPERS
// ==================================================

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);

  return formatDate(date);
}

// ==================================================
// FESTIVAL OFFER PRICES
// ==================================================
//
// Festivals:  ₹249/month, ₹1,999/year  (about 20% off normal)
// Birthday:   ₹199/month, ₹1,499/year
// They must stay BELOW ₹299 / ₹2,499, or they are ignored.
//
// ==================================================

const FESTIVAL_MONTHLY_PRICE = 249;
const FESTIVAL_YEARLY_PRICE = 1999;

const BIRTHDAY_MONTHLY_PRICE = 199;
const BIRTHDAY_YEARLY_PRICE = 1499;

// ==================================================
// CHANGING FESTIVAL DATES
// ==================================================
//
// ONLY UPDATE THESE DATES WHEN THE FESTIVAL DATE
// CHANGES FROM YEAR TO YEAR.
//
// ==================================================

const FESTIVAL_DATES = [
  // 🌙 Eid al-Fitr
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr Offer',
    festivalDate: '2027-03-10',
  },

  // 🌙 Eid al-Adha
  {
    id: 'eid-al-adha',
    name: 'Eid al-Adha Offer',
    festivalDate: '2027-05-17',
  },

  // 🪔 Diwali
  {
    id: 'diwali',
    name: 'Diwali Offer',
    festivalDate: '2026-11-09',
  },

  // 🎨 Holi
  {
    id: 'holi',
    name: 'Holi Offer',
    festivalDate: '2027-03-22',
  },
];

// ==================================================
// GET ACTIVE SEASONAL OFFER
// ==================================================
//
// Returns an offer only when one is running today AND it is
// cheaper than the normal price (monthly and yearly).
//
// ==================================================

export function getSeasonalPricing(
  date: Date = new Date()
): SeasonalPricing | null {

  const currentYear = date.getFullYear();
  const currentDate = formatDate(date);

  const fixedOffer = (
    id: string,
    name: string,
    festivalDate: string,
    monthlyPrice: number,
    yearlyPrice: number,
    daysBefore = 3,
    daysAfter = 1
  ): SeasonalPricing => ({
    id,
    name,
    monthlyPrice,
    yearlyPrice,
    festivalDate,
    start: addDays(festivalDate, -daysBefore),
    end: addDays(festivalDate, daysAfter),
  });

  const allOffers: SeasonalPricing[] = [
    // 🇮🇳 Independence Day — August 15 every year
    fixedOffer('independence-day', 'Independence Day Offer', `${currentYear}-08-15`, FESTIVAL_MONTHLY_PRICE, FESTIVAL_YEARLY_PRICE),

    // 🇮🇳 Republic Day — January 26 every year
    fixedOffer('republic-day', 'Republic Day Offer', `${currentYear}-01-26`, FESTIVAL_MONTHLY_PRICE, FESTIVAL_YEARLY_PRICE),

    // 🌙🪔🎨 Festivals whose dates change each year
    ...FESTIVAL_DATES.map((festival) =>
      fixedOffer(festival.id, festival.name, festival.festivalDate, FESTIVAL_MONTHLY_PRICE, FESTIVAL_YEARLY_PRICE)
    ),

    // 🎄 Christmas — December 25 every year
    fixedOffer('christmas', 'Christmas Offer', `${currentYear}-12-25`, FESTIVAL_MONTHLY_PRICE, FESTIVAL_YEARLY_PRICE),

    // 🎂 Founder's birthday — December 6 only
    fixedOffer('founders-birthday', "Founder's Birthday Special", `${currentYear}-12-06`, BIRTHDAY_MONTHLY_PRICE, BIRTHDAY_YEARLY_PRICE, 0, 0),
  ];

  return (
    allOffers.find(
      (offer) =>
        currentDate >= offer.start &&
        currentDate <= offer.end &&
        // Never charge more than the normal price
        offer.monthlyPrice < NORMAL_PRICES.monthly &&
        offer.yearlyPrice < NORMAL_PRICES.yearly
    ) ?? null
  );
}
