import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type GenerateEmailReminderInput = {
  clientName: string;
  currency: string;
  amount: string | number;
  daysOverdue?: number;
  invoiceRef?: string;
  tone?: string;
  paymentLink?: string;
  previousReminders?: Array<{
    email_subject?: string;
    email_body?: string;
  }>;
  variationInstruction?: string;
};

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
Previous Version ${index + 1}:

Email Subject:
${reminder.email_subject || ""}

Email Body:
${reminder.email_body || ""}
`
          )
          .join("\n")
      : "No previous email reminders are available.";

  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0.85,

    schema: z.object({
      email_subject: z.string(),
      email_body: z.string(),
    }),

    prompt: `
You are an expert Payment Recovery Specialist for freelancers.
Your goal is to recover payments quickly while maintaining great client relationships.

You are generating an AUTOMATED PAYMENT REMINDER EMAIL.

Details:
- Client Name: ${input.clientName}
- Amount Due: ${input.currency} ${input.amount}
- Days Overdue: ${input.daysOverdue || "0"} days
- Invoice Reference: ${input.invoiceRef || "Pending"}
- Payment Link: ${input.paymentLink || "No payment link provided"}
- Tone Preference: ${input.tone || "professional"}

Tone Guidelines:
- 'gentle': Use warm, polite, and helpful language. Assume the client simply forgot.
- 'professional': Use formal, direct, and objective language. Focus on the agreement.
- 'firm': Use urgent, clear, and assertive language. Remain respectful and professional.

============================================================
FRESH EMAIL REQUIREMENTS
============================================================

Every email must feel freshly written.

Do NOT simply reuse the same reminder template and replace
the client name or amount.

Reminder stage:
${input.daysOverdue === 0 ? "FIRST REMINDER — due date" : "FOLLOW-UP REMINDER"}

Variation direction:
${variationInstruction}

Previous generated emails:
${previousReminderText}

If previous reminders are available:

- Do NOT copy previous sentences.
- Do NOT reuse the same opening.
- Do NOT reuse the same closing.
- Do NOT reuse the same call-to-action.
- Do NOT closely imitate previous sentence structures.
- Do NOT simply replace a few words from a previous reminder.
- Use genuinely different wording and sentence flow.
- Keep the selected tone.
- Keep all payment information accurate.

============================================================
IMPORTANT
============================================================

Freshness must NEVER override factual accuracy.

Never invent:
- Invoice numbers
- Payment dates
- Penalties
- Discounts
- Legal threats
- Fees
- Services
- Promises
- Payment links

If an invoice reference is not provided, do NOT invent one.

If a payment link is provided:
- Use the exact payment link supplied.
- Do not modify it.
- Do not shorten it.
- Do not replace it.
- You may naturally mention that the client can use the link to make the payment.

If NO payment link is provided:
- Do NOT mention a payment link.
- Do NOT write "[Insert Payment Link]".
- Do NOT create a fake URL.
- Do NOT create a placeholder URL.

============================================================
EMAIL OUTPUT RULES
============================================================

- Email Subject: Professional and clear.
- Include the invoice number ONLY when an actual invoice number is provided.
- Email Body: Keep under 150 words.
- Address the client naturally by name.
- Clearly mention the outstanding amount.
- Clearly explain that the payment is due/overdue based on the supplied information.
- Include a polite call-to-action asking the client to complete the payment.
- If a real payment link is provided, naturally direct the client to use it.
- If no payment link is provided, simply ask the client to complete the payment without mentioning any link.
- Do not claim that an email, reminder, or follow-up was previously sent unless that information was provided.
- Do not mention that AI generated the email.
- Do not add WhatsApp or SMS content.

Return only:
- email_subject
- email_body
`,
  });

  return result.object;
}
