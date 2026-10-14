// ============================================================
// SHARED AMOUNT FORMATTING
// ============================================================
// Used by the landing page generator and the automatic reminder
// emails, so every reminder shows money the same way: "₹5,000",
// "$500", "€750" (never "₹ INR 5,000").

// Currency may arrive as a symbol, a code or both ("₹", "INR",
// "₹ INR"). This always returns one clean amount: "₹5,000", "$500".

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  NZD: "NZ$",
  JPY: "¥",
  AED: "AED ",
};

export function getCurrencySymbol(currency: unknown): string {
  const raw = String(currency ?? "").trim();

  if (!raw) return "₹";

  const code = raw.toUpperCase().match(/[A-Z]{3}/)?.[0];

  if (code && CURRENCY_SYMBOLS[code]) return CURRENCY_SYMBOLS[code];

  // A plain symbol like "₹" or "$" (letters and spaces removed).
  const symbol = raw.replace(/[A-Za-z\s]/g, "");

  if (symbol) return symbol;

  // An unknown code like "CHF": keep it, with a space ("CHF 300").
  return `${raw.toUpperCase()} `;
}

export function formatAmountWithCurrency(amount: unknown, currency: unknown): string {
  const symbol = getCurrencySymbol(currency);
  const rawAmount = String(amount ?? "").trim();
  const num = Number(rawAmount.replace(/,/g, ""));

  // Indian commas (1,00,000) for rupees, normal commas for the rest.
  const amountText =
    rawAmount !== "" && Number.isFinite(num)
      ? num.toLocaleString(symbol === "₹" ? "en-IN" : "en-US")
      : rawAmount || "0";

  return `${symbol}${amountText}`;
}
