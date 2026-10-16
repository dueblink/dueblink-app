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

// ============================================================
// REMINDER LANGUAGES
// ============================================================
// A client's language is saved on the client ("language" field).
// Old clients without one are treated as English.

export const REMINDER_LANGUAGES = [
  { id: 'english', label: 'English' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'hindi', label: 'हिंदी (Hindi)' },
  { id: 'marathi', label: 'मराठी (Marathi)' },
] as const;

export type ReminderLanguage = (typeof REMINDER_LANGUAGES)[number]['id'];

export function normalizeLanguage(value: unknown): ReminderLanguage {
  const id = String(value || '').trim().toLowerCase();
  return (REMINDER_LANGUAGES.some((l) => l.id === id) ? id : 'english') as ReminderLanguage;
}

// How each language should sound (shared by the rules below).
function languageStyle(language: ReminderLanguage): string {
  if (language === 'hinglish') {
    return `Hinglish: everyday Hindi written in English (Roman) letters, mixed
naturally with common English words, the way people text on WhatsApp in India.
Example style: "Hi Rahul, ₹25,000 ka payment ab 5 din se overdue hai. Kab tak bhej payenge? Please ek date bata dijiye."
Never use Devanagari script. Be polite and respectful (use "aap").`;
  }

  if (language === 'hindi') {
    return `Hindi, in Devanagari script. Use simple, everyday, respectful Hindi
(use "आप"), not heavy formal or Sanskrit words. Common words like "payment",
"invoice", "reminder" may stay in English if that sounds more natural.`;
  }

  if (language === 'marathi') {
    return `Marathi, in Devanagari script. Use simple, everyday, respectful Marathi
(use "तुम्ही"), not heavy formal words. Common words like "payment", "invoice",
"reminder" may stay in English if that sounds more natural.`;
  }

  return 'clear, simple English.';
}

const KEEP_EXACT =
  'Keep the client name, amounts (e.g. "₹25,000"), dates, invoice numbers and links exactly as given.';

// The language instruction added to every AI reminder prompt
// (landing generator, tap-to-send and automatic emails).
export function languageRule(value: unknown): string {
  const language = normalizeLanguage(value);

  if (language === 'english') {
    return `
LANGUAGE: Write everything in clear, simple English.`;
  }

  return `
LANGUAGE: Write the email subject, the email, the WhatsApp message and the SMS in
${languageStyle(language)}
${KEEP_EXACT} Any note meant for the freelancer (not the client), such as the
psychology note, stays in English.`;
}

// For Blink: only the messages to the client change language. Blink's
// own headings, summaries and advice to the freelancer stay in English.
export function clientMessageLanguageRule(value: unknown): string {
  const language = normalizeLanguage(value);

  if (language === 'english') return '';

  return `
CLIENT LANGUAGE: This client reads reminders in ${language[0].toUpperCase()}${language.slice(1)}.
Write ONLY the email subject, the email body and the WhatsApp message in
${languageStyle(language)}
${KEEP_EXACT}
Everything else stays in English: all headings, the "Subject:" label, the copied
information lines, summaries, recommendations and next actions for the owner.`;
}

// ============================================================
// CLIENT CURRENCY
// ============================================================
// Saved on each client as a code ("INR", "USD"...). Old clients have
// no currency (or "₹"), and are treated as rupees.

export const CLIENT_CURRENCIES = [
  { code: 'INR', label: '₹ INR' },
  { code: 'USD', label: '$ USD' },
  { code: 'EUR', label: '€ EUR' },
  { code: 'GBP', label: '£ GBP' },
  { code: 'AUD', label: 'A$ AUD' },
  { code: 'CAD', label: 'C$ CAD' },
  { code: 'SGD', label: 'S$ SGD' },
  { code: 'AED', label: 'AED' },
] as const;

const SYMBOL_TO_CODE: Record<string, string> = {
  '₹': 'INR', '$': 'USD', '€': 'EUR', '£': 'GBP',
  'A$': 'AUD', 'C$': 'CAD', 'S$': 'SGD', 'AED': 'AED',
};

// "₹", "INR", "₹ INR" or nothing -> "INR"; "$" -> "USD".
export function normalizeCurrencyCode(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return 'INR';
  const code = raw.toUpperCase().match(/[A-Z]{3}/)?.[0];
  if (code) return code;
  return SYMBOL_TO_CODE[raw] || 'INR';
}

// Indian client (rupees): MSME rules and MSME Samadhaan apply.
export function isIndianCurrency(value: unknown): boolean {
  return normalizeCurrencyCode(value) === 'INR';
}

// A sensible default for a new client: rupees in India, dollars elsewhere.
// Runs in the browser only.
export function guessDefaultCurrency(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (zone === 'Asia/Kolkata' || zone === 'Asia/Calcutta') return 'INR';
    if (zone.startsWith('Europe/London')) return 'GBP';
    if (zone === 'Asia/Dubai') return 'AED';
    if (zone === 'Asia/Singapore') return 'SGD';
    if (zone.startsWith('Australia/')) return 'AUD';
    if (zone.startsWith('Europe/')) return 'EUR';
    return 'USD';
  } catch {
    return 'INR';
  }
}

// Adds up amounts per currency, so rupees and dollars are never mixed:
// "₹25,000" or "₹25,000 + $500".
export function formatTotalsByCurrency(clients: Array<{ amount?: unknown; currency?: unknown }>): string {
  const totals: Record<string, number> = {};
  for (const c of clients) {
    const code = normalizeCurrencyCode(c.currency);
    totals[code] = (totals[code] || 0) + (Number(String(c.amount ?? '').replace(/,/g, '')) || 0);
  }
  const codes = Object.keys(totals);
  if (codes.length === 0) return formatAmountWithCurrency(0, 'INR');
  // Rupees first, then the other currencies.
  codes.sort((a, b) => (a === 'INR' ? -1 : b === 'INR' ? 1 : a.localeCompare(b)));
  return codes.map((code) => formatAmountWithCurrency(totals[code], code)).join(' + ');
}

// ============================================================
// FIRM FINAL REMINDER
// ============================================================
// The last reminder before formal steps. Same for every client, plus:
// - a late fee line, only if the freelancer says one was agreed;
// - the MSMED Act interest line, only for Indian (rupee) clients when
//   the freelancer is Udyam (MSME) registered.

// The deadline: 3 days from today (India time), e.g. "19 October".
export function finalDeadlineText(locale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long',
  }).format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
}

export function msmeApplies(client: { currency?: unknown; msmeRegistered?: unknown }): boolean {
  return client.msmeRegistered === true && isIndianCurrency(client.currency);
}

// Extra instructions for the AI when it writes the FINAL reminder.
export function finalReminderNote(client: {
  invoiceNumber?: unknown;
  invoiceRef?: unknown;
  lateFee?: unknown;
  currency?: unknown;
  msmeRegistered?: unknown;
}): string {
  const invoice = String(client.invoiceNumber || client.invoiceRef || '').trim();
  const lateFee = String(client.lateFee || '').trim();

  return `
FIRM FINAL REMINDER (this is the last reminder before formal steps):
- State the amount, ${invoice ? `the invoice number (${invoice}), ` : ''}and how many days overdue it is.
- Give a clear deadline: ${finalDeadlineText()}.
- Say the next step plainly: if it is not paid by then, the matter moves to formal recovery, which may include a legal notice.
- Invite them to reply if there is a problem with the invoice.
${lateFee ? `- Mention the late fee that was agreed: ${lateFee}. Do not invent any other fee.` : '- Do NOT mention any late fee or extra charge.'}
${msmeApplies(client) ? '- Add one calm line: as a Udyam (MSME) registered supplier, under the MSMED Act, 2006, delayed payments carry compound interest at three times the RBI bank rate.' : '- Do NOT mention the MSMED Act or MSME interest.'}
- Firm and calm. No insults, no shaming, no threats other than the formal step above, no apologizing.`;
}
