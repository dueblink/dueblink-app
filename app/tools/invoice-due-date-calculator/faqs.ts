// Questions and answers for the invoice due date calculator page.
// Used on the page itself and in the Google FAQ data (page.tsx).

export const FAQS = [
  {
    q: 'What does "Net 30" mean on an invoice?',
    a: 'Net 30 means the full invoice amount is due 30 days after the invoice date. The same logic applies to Net 7, Net 15, Net 45, Net 60, and Net 90 — the number is simply how many days the client has to pay, counted from the date the invoice was issued, not from when they received or opened it.',
  },
  {
    q: 'Is the due date counted from the invoice date or the delivery date?',
    a: 'Almost always the invoice date, unless your contract or payment terms explicitly say otherwise. Some businesses count from the delivery or completion date instead — if that applies to you, use that date as the starting point in the calculator above.',
  },
  {
    q: 'What happens if the due date falls on a weekend or holiday?',
    a: 'Most invoices don\u2019t automatically extend to the next business day — the due date stays as calculated unless your payment terms specifically state otherwise. It\u2019s worth checking your contract, since this varies by industry and region.',
  },
  {
    q: 'Should I offer longer payment terms to win more clients?',
    a: 'Longer terms (Net 60, Net 90) can make you more attractive to larger clients, but every extra day is cash sitting in someone else\u2019s account instead of yours. Shorter terms (Net 7, Net 15) improve your cash flow but may not fit every client relationship. There\u2019s no universally "right" answer — it depends on your leverage and how badly you need predictable cash flow.',
  },
];
