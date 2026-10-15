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

// ============================================================
// NATURAL WRITING (no robotic AI phrases)
// ============================================================
// Added to every reminder prompt, so reminders sound like a real
// person wrote them. The rest of the writing style stays the same.

export const NATURAL_WRITING_RULES = `
WRITE LIKE A REAL PERSON:
- Never use these stock phrases (or close versions of them):
  "I hope this email finds you well", "I trust this email finds you well",
  "I trust you are doing well", "at your earliest convenience",
  "please do not hesitate to reach out", "please don't hesitate to contact me",
  "this is to inform you", "I wanted to bring to your attention",
  "as per our records", "rest assured", "kindly be informed",
  "thank you for your prompt attention to this matter",
  "I am writing to remind you".
- Use simple, everyday words instead, e.g. "Hope you're doing well",
  "Could you let me know when it's done?", "Just reply here if you need anything".
- Never write placeholders in square brackets, such as [Your Name],
  [Payment Link], [Insert Payment Link], [Invoice Number] or [Date].
`;

// The sign-off rule for the prompt, using the freelancer's real name.
export function signOffRule(senderName?: string): string {
  const name = String(senderName || '').trim();

  return name
    ? `- End the email with a short sign-off and the sender's name on its own line, exactly: "${name}". Never write [Your Name].`
    : `- End the email with a short sign-off like "Thanks" or "Best regards" and NO name line. Never write [Your Name] or any placeholder.`;
}

// Safety net after the AI writes: removes any bracket placeholder that
// still slipped through, so a client never sees "[Payment Link]".
export function cleanReminderText(text: string, senderName?: string): string {
  const name = String(senderName || '').trim();

  return String(text || '')
    // [Your Name] / [Name] / [Sender Name] -> the real name, or nothing.
    .replace(/\[\s*(your|sender'?s?|my)?\s*(full\s*)?name\s*\]/gi, name)
    // Drop only the sentence that holds a link placeholder,
    // e.g. "You can pay here: [Payment Link]." Other sentences stay.
    .split('\n')
    .map((line) =>
      /\[[^\]]*(link|url)[^\]]*\]/i.test(line)
        ? (line.match(/[^.!?]+[.!?]*\s*/g) || [line])
            .filter((sentence) => !/\[[^\]]*(link|url)[^\]]*\]/i.test(sentence))
            .join('')
            .trimEnd()
        : line
    )
    .join('\n')
    // Any other leftover [placeholder].
    .replace(/\[[^\]\n]{1,40}\]/g, '')
    // Tidy spaces and empty lines left behind.
    .replace(/[ \t]+([,.!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
