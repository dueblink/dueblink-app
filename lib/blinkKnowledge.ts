// ============================================================
// BLINK'S KNOWLEDGE (landing page chat)
// ============================================================
// Everything Blink is allowed to say about DueBlink. Blink answers
// ONLY from this sheet, so keep it true and up to date:
// when you add a feature or change a rule, add a line here.
//
// Prices come live from lib/seasonalPricing.ts, so offers stay right.
// ============================================================

import { NORMAL_PRICES, EARLY_OFFER, getSeasonalPricing } from '@/lib/seasonalPricing';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function buildBlinkKnowledge(): string {
  const festival = getSeasonalPricing();
  const today = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());

  const festivalLine = festival
    ? `RIGHT NOW (India only): ${festival.name}: ${inr(festival.monthlyPrice)}/month or ${inr(festival.yearlyPrice)}/year, until ${festival.end}.`
    : 'No festival offer is running today.';

  return `
TODAY: ${today}

=== WHAT DUEBLINK IS ===
- DueBlink helps freelancers and small businesses (agencies, consultants, designers, developers, video editors, photographers, coaches, tutors, small studios and other service businesses) get paid on time.
- You add the invoices clients haven't paid. DueBlink remembers every follow-up, tells you who to chase today, how firmly, and on which channel, and writes the reminder for you.
- Works with invoices you already send, made anywhere (Zoho, Refrens, Word, Excel, handwritten). It is NOT an invoicing tool.
- It is NOT a debt collection agency, legal service, accounting software or bank. It cannot guarantee a client will pay; it makes sure follow-ups go out on time in the right tone.
- Made in India, works for clients worldwide.

=== FREE AI REMINDER GENERATOR (on the home page, no sign-up) ===
- Enter client name, amount, currency, days overdue, invoice number (optional), pick a tone (Gentle / Professional / Firm) and a language (English, Hinglish, Hindi, Marathi).
- It writes an email (with subject), a WhatsApp message and an SMS. Copy and send.
- You can try it without an account. With a free account you get 15 free AI reminders every month.

=== FREE PLAN ===
- 15 free AI reminders per month (refills automatically every month).
- Dashboard with a "Today" list: who to chase today, the stage, and ready messages.
- Tap to send: one tap opens WhatsApp, SMS or your email app with a ready-made reminder (templates in English, Hinglish, Hindi, Marathi).
- Email and WhatsApp reminders, tone selection, basic payment tracking.

=== PRO PLAN ===
- Unlimited AI reminders and unlimited clients.
- Blink AI Recovery Assistant in the dashboard: Today's Priorities, Generate Follow-up (WhatsApp + email for the right stage), Rewrite Reminder, Find Overdue Clients, Outstanding Summary, quick edits (Shorter / Softer / Firmer / other language).
- Automatic email reminders: DueBlink emails the client by itself on the due date (first reminder), 3 days later (follow-up) and 7 days later (final reminder). Example: due 20 August -> reminders on 20, 23 and 27 August. You don't need to keep DueBlink open. If you add a payment link, the email shows a "Pay Now" button. Client replies go to your own email.
- Tap-to-send messages written fresh by AI for each client and stage.
- One-click payment updates from the summary email, payment tracking and history, priority support.

=== PRICES ===
India (paid in ₹ via Razorpay: UPI, cards and more):
- Pro monthly: ${inr(NORMAL_PRICES.monthly)}/month. Pro yearly: ${inr(NORMAL_PRICES.yearly)}/year (saves money vs monthly).
- Early offer for the first ${EARLY_OFFER.totalSpots} paying users (once per person, only while spots last; the pricing page shows if it's still available): ${inr(EARLY_OFFER.monthly)} for the first month (then ${inr(NORMAL_PRICES.monthly)}/month), or ${inr(EARLY_OFFER.yearly)} for the first year (then ${inr(NORMAL_PRICES.yearly)}/year).
- Festival offers run for a few days around big Indian festivals. ${festivalLine}
International (outside India, paid by card via Dodo Payments): $9/month or $89/year.
- Free plan: free forever, no card needed.
- Renewing: "Renew early" appears in the last 3 days before Pro ends.

=== REMINDERS: CHANNELS ===
- Email: automatic (Pro), or tap to send from your own email app.
- WhatsApp and SMS: DueBlink does NOT send WhatsApp/SMS automatically. You tap "Send on WhatsApp" (or SMS) and it opens WhatsApp on YOUR phone with the message ready, sent from your own number. One tap, no copy-paste. (Fully automatic WhatsApp would need the client's permission and comes from a business number, so we don't do it.)
- After sending, DueBlink records it so the next reminder moves to the next stage.

=== CLIENTS ===
- Required: client name, amount, due date. Optional: company, email, WhatsApp number, invoice number, payment link.
- Currency per client: ₹ INR, $ USD, € EUR, £ GBP, A$ AUD, C$ CAD, S$ SGD, AED. Totals are never mixed between currencies.
- Reminder language per client: English, Hinglish, Hindi or Marathi.
- Mark a client "Paid" and all reminders stop immediately.

=== WHEN A CLIENT IGNORES YOU ===
- Stages: first reminder -> follow-up -> firm final reminder -> "stalled".
- Final reminder: amount, invoice number, days overdue, a clear 3-day deadline and the next step (formal recovery, which may include a legal notice). Optional: a late fee line (only if the client agreed to it) and, for Indian clients, an MSME/Udyam line about interest under the MSMED Act, 2006.
- Stalled clients get a "What to do next" card: call them, ask for their accounts team, pause work, send a formal final notice, formal options (legal notice; MSME Samadhaan if Udyam-registered), or mark as written off. Not legal advice; check with a lawyer or CA.
- MSME rule (India): buyers must pay registered MSMEs within 45 days, or owe compound interest at 3x the RBI bank rate. Udyam registration is free and online (udyamregistration.gov.in) and usually only protects work done after registering.

=== FREE TOOLS (no sign-up) ===
- WhatsApp Payment Reminder Messages: /tools/whatsapp-payment-reminder
- Payment Reminder Email Templates: /tools/payment-reminder-email-templates
- Late Payment Interest Calculator (MSME 45-day rule): /tools/late-payment-interest-calculator
- Invoice Due Date Calculator: /tools/invoice-due-date-calculator

=== ACCOUNT & LOGIN ===
- Sign up free with Google or email. Login at /login, create account at /create-account.
- Cancel Pro any time from account settings: Pro stays active until the end of the paid period, then it does not renew. No cancellation fees.
- You can delete your account any time from account settings.

=== REFUND POLICY (page: /refund-policy) ===
- DueBlink generally does NOT refund monthly or yearly payments, partial periods, unused time, or change of mind. Please check features and prices before subscribing.
- Billing errors or duplicate charges: contact support within 7 days of the payment; after checking, eligible billing errors are refunded.
- Failed payment: the account may go back to the Free plan; your data stays safe; renew any time to get Pro back.
- If Pro ends, your account and saved data stay; Pro features pause until you renew.

=== PRIVACY & SECURITY (page: /privacy) ===
- DueBlink never sells your personal information.
- It never accesses your bank account or payment processor; it only stores the invoice and client details you enter.
- Card details are handled by the payment provider; DueBlink does not store full card details.
- Reminder details are sent to an AI provider only to write the reminder you asked for.
- HTTPS encryption, secure login and cloud infrastructure. You can ask for a copy of your data, update it or delete your account.

=== TERMS (page: /terms) ===
- For people 18+. AI-written reminders should be reviewed before sending; you are responsible for messages you send.
- No spam, harassment or fraud. Governed by the laws of India.

=== CONTACT & SUPPORT ===
- Email: support@dueblink.com. Contact form: /contact.
- Hours: Monday to Friday, 9:00 AM to 6:00 PM IST. Replies usually within 1 to 2 business days.
- How automatic reminders work in detail: /help/automated-reminders
`.trim();
}
