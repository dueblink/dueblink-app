import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import {
  formatAmountWithCurrency,
  NATURAL_WRITING_RULES,
  signOffRule,
  cleanReminderText,
  languageRule,
  humanEmailRules,
  formatDueDateLong,
  cleanWorkDescription,
  stripInvoiceNumbers,
  isTooSimilar,
} from "@/lib/reminderRules";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type GenerateEmailReminderInput = {
  clientName: string;
  currency: string;
  amount: string | number;
  daysOverdue?: number;
  // Old field, still accepted but never written into the email.
  invoiceRef?: string;
  tone?: string;
  paymentLink?: string;
  // Extra details the reminder job sends.
  stage?: string;
  dueDate?: string;
  // What the payment is for, e.g. "Website design".
  workDescription?: string;
  // Dates earlier reminders went out, e.g. ["10 November", "13 November"].
  previousSentDates?: string[];
  senderName?: string; // the freelancer's name, used to sign the email
  paymentLinkShownAsButton?: boolean; // the email already shows a "Pay Now" button
  previousReminders?: Array<{
    email_subject?: string;
    email_body?: string;
  }>;
  variationInstruction?: string;
  language?: string; // the client's reminder language (english, hinglish, hindi, marathi)
};

// Different ways to start, so emails to the same client never feel copied.
const OPENING_STYLES = [
  "Open with a short, friendly check-in before the payment.",
  "Open by getting straight to the point, politely.",
  "Open with a warm thank-you for working together.",
  "Open with a brief, natural line about the work that was done.",
  "Open with a simple, personal greeting and move to the payment in the second sentence.",
];

export async function generateEmailReminder(
  input: GenerateEmailReminderInput
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not defined in environment variables."
    );
  }

  const previousReminders = Array.isArray(input.previousReminders)
    ? input.previousReminders.slice(-5)
    : [];

  const variationInstruction =
    typeof input.variationInstruction === "string" &&
    input.variationInstruction.trim()
      ? input.variationInstruction.trim()
      : "Use fresh wording and a different communication approach from previous versions.";

  const previousReminderText =
    previousReminders.length > 0
      ? previousReminders
          .map(
            (reminder, index) => `
Previous email ${index + 1}:
Subject: ${reminder.email_subject || ""}
${reminder.email_body || ""}
`
          )
          .join("\n")
      : "No earlier emails were sent to this client.";

  const work = cleanWorkDescription(input.workDescription);
  const dueDateText = formatDueDateLong(input.dueDate);
  const amountText = formatAmountWithCurrency(input.amount, input.currency);
  const days = Number(input.daysOverdue || 0);

  const buildPrompt = (attempt: number) => `
You are writing a payment reminder email on behalf of a freelancer or small
business owner, to one of their clients. Write it exactly as that person
would write it themselves.

THE FACTS (use them exactly):
- Client name: ${input.clientName}
- Amount: ${amountText}
- What the payment is for: ${work || "not given (just say \"the payment\")"}
- Due date: ${dueDateText || "not given"}
- Days overdue: ${days <= 0 ? "due today" : `${days} days`}
- Tone: ${input.tone || "professional"}
- Payment link: ${input.paymentLink ? "yes (see below)" : "none"}

STAGE AND DIRECTION:
${variationInstruction}

${humanEmailRules({
  workDescription: work,
  dueDateText,
  daysOverdue: days,
  stage: input.stage,
  previousSentDates: input.previousSentDates,
})}

STYLE FOR THIS EMAIL: ${OPENING_STYLES[(previousReminders.length + attempt) % OPENING_STYLES.length]}

EARLIER EMAILS TO THIS CLIENT (do NOT reuse their sentences, opening,
closing or subject):
${previousReminderText}
${attempt > 0 ? "\nYour last attempt was too close to an earlier email. Write it again with clearly different wording from start to finish.\n" : ""}
${input.paymentLink && input.paymentLinkShownAsButton
  ? `PAYMENT: The email already shows a "Pay Now" button below your text.
- Do NOT paste the link into the email. You may say they can use the "Pay Now" button below.`
  : input.paymentLink
    ? `PAYMENT: Mention they can pay using this exact link: ${input.paymentLink}`
    : `PAYMENT: There is no payment link. Do NOT mention a link, a button or a placeholder.`}

${signOffRule(input.senderName)}

${NATURAL_WRITING_RULES}

${languageRule(input.language)}

Return only email_subject and email_body.
`;

  const previousBodies = previousReminders.map((r) => r.email_body || "");

  let subject = "";
  let body = "";

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      temperature: attempt === 0 ? 0.85 : 0.95,
      schema: z.object({
        email_subject: z.string(),
        email_body: z.string(),
      }),
      prompt: buildPrompt(attempt),
    });

    subject = result.object.email_subject;
    body = result.object.email_body;

    // Fresh enough? Keep it. Otherwise try again with clearer wording.
    if (!isTooSimilar(body, previousBodies)) break;
  }

  // Last safety nets: no invoice numbers, no "[Payment Link]" or
  // "[Your Name]" placeholders ever reach a client.
  return {
    email_subject: cleanReminderText(stripInvoiceNumbers(subject), input.senderName),
    email_body: cleanReminderText(stripInvoiceNumbers(body), input.senderName),
  };
}
