// ==================================================
// DUEBLINK SEASONAL PRICING
// ==================================================
//
// Normal pricing:
// Monthly: ₹499
// Yearly: ₹4,999
//
// Launch Offer:
// ₹249 first month
// Then ₹499/month
//
// Festival offers:
// Start 3 days before the festival.
// End 1 day after the festival.
//
// Birthday:
// December 6 only.
// ==================================================

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
// 🚀 LIMITED-TIME LAUNCH OFFER
// ==================================================
//
// First month: ₹249
// After first month: ₹499/month
//
// Offer is available for 30 days.
//
// ONLY CHANGE launchOfferStartDate WHEN THE
// LAUNCH OFFER START DATE IS DECIDED.
//
// ==================================================

const launchOfferStartDate = '2026-08-17';

const launchOffer: SeasonalPricing = {
  id: 'launch-offer',
  name: 'Limited-Time Launch Offer',

  monthlyPrice: 249,
  yearlyPrice: 4999,

  festivalDate: launchOfferStartDate,

  start: launchOfferStartDate,
  end: addDays(launchOfferStartDate, 29),
};

// ==================================================
// CHANGING FESTIVAL DATES
// ==================================================
//
// ONLY UPDATE THESE DATES WHEN THE FESTIVAL DATE
// CHANGES FROM YEAR TO YEAR.
//
// The system automatically calculates:
// START = 3 days before
// END = 1 day after
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

export function getSeasonalPricing(
  date: Date = new Date()
): SeasonalPricing | null {

  const currentYear = date.getFullYear();
  const currentDate = formatDate(date);

  // ==================================================
  // 🚀 LIMITED-TIME LAUNCH OFFER
  // ==================================================

  if (
    currentDate >= launchOffer.start &&
    currentDate <= launchOffer.end
  ) {
    return launchOffer;
  }

  // ==================================================
  // 🇮🇳 INDEPENDENCE DAY
  // Automatically every year — August 15
  // ==================================================

  const independenceDate =
    `${currentYear}-08-15`;

  const independenceOffer: SeasonalPricing = {
    id: 'independence-day',
    name: 'Independence Day Offer',

    monthlyPrice: 399,
    yearlyPrice: 3999,

    festivalDate: independenceDate,

    start: addDays(independenceDate, -3),
    end: addDays(independenceDate, 1),
  };

  // ==================================================
  // 🇮🇳 REPUBLIC DAY
  // Automatically every year — January 26
  // ==================================================

  const republicDate =
    `${currentYear}-01-26`;

  const republicOffer: SeasonalPricing = {
    id: 'republic-day',
    name: 'Republic Day Offer',

    monthlyPrice: 399,
    yearlyPrice: 3999,

    festivalDate: republicDate,

    start: addDays(republicDate, -3),
    end: addDays(republicDate, 1),
  };

  // ==================================================
  // 🎄 CHRISTMAS
  // Automatically every year — December 25
  // ==================================================

  const christmasDate =
    `${currentYear}-12-25`;

  const christmasOffer: SeasonalPricing = {
    id: 'christmas',
    name: 'Christmas Offer',

    monthlyPrice: 399,
    yearlyPrice: 3999,

    festivalDate: christmasDate,

    start: addDays(christmasDate, -3),
    end: addDays(christmasDate, 1),
  };

  // ==================================================
  // 🎂 FOUNDER'S BIRTHDAY
  // Automatically every year — December 6
  //
  // IMPORTANT:
  // Birthday is ONLY December 6.
  // No 3-day-before / 1-day-after period.
  // ==================================================

  const birthdayDate =
    `${currentYear}-12-06`;

  const birthdayOffer: SeasonalPricing = {
    id: 'founders-birthday',
    name: "Founder's Birthday Special",

    monthlyPrice: 299,
    yearlyPrice: 2999,

    festivalDate: birthdayDate,

    start: birthdayDate,
    end: birthdayDate,
  };

  // ==================================================
  // BUILD FESTIVAL OFFERS
  // ==================================================

  const changingFestivalOffers: SeasonalPricing[] =
    FESTIVAL_DATES.map((festival) => ({
      id: festival.id,
      name: festival.name,

      monthlyPrice: 399,
      yearlyPrice: 3999,

      festivalDate: festival.festivalDate,

      start: addDays(
        festival.festivalDate,
        -3
      ),

      end: addDays(
        festival.festivalDate,
        1
      ),
    }));

  // ==================================================
  // ALL OFFERS
  // ==================================================

  const allOffers: SeasonalPricing[] = [
    independenceOffer,
    republicOffer,
    ...changingFestivalOffers,
    christmasOffer,
    birthdayOffer,
  ];

  // ==================================================
  // FIND ACTIVE OFFER
  // ==================================================

  return (
    allOffers.find(
      (offer) =>
        currentDate >= offer.start &&
        currentDate <= offer.end
    ) ?? null
  );
}
