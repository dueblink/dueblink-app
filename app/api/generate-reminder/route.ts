import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { reminderGenerationRateLimit } from '@/lib/rateLimit';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================
// MONTHLY RESET KEY
// ============================================================
// "15 AI reminders a month" needs something to measure "a month" against.
// Without this, aiRemindersUsed was just a counter that went up forever —
// a free user who generated 15 reminders total was permanently capped,
// not capped per month. Same India-timezone convention the
// automated-reminders route already uses, so "the 1st" means the same
// thing everywhere in the app.
function getIndiaMonthKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).format(date); // e.g. "2026-10"
}

// ============================================================
// GUEST IDENTITY COOKIE
// ============================================================
// Guest usage used to be tracked purely by a guestId the CLIENT generated
// itself and sent in the request body — trivially reset by clearing
// localStorage, or bypassed entirely by sending a fresh random value.
// Now the server is the one who assigns the id, as an HttpOnly cookie
// JavaScript can't read, write, or delete. Clearing localStorage does
// nothing to it; only actually clearing cookies (a much less obvious,
// much less commonly-taken action) resets it — and even that only grants
// a fresh 5, same as before, rather than unlimited resets on demand.
function withGuestCookie(
  response: NextResponse,
  guestId: string,
  isGuest: boolean
): NextResponse {
  if (isGuest) {
    response.cookies.set('db_guest_id', guestId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
  }
  return response;
}

// ============================================================
// UNIQUENESS SAFEGUARD
// ============================================================
// The prompt already instructs the model to avoid repeating itself,
// but that's a request, not a guarantee. This adds a real check:
// after generation, compare the new reminder's wording against the
// client's stored history. If it's too close to something already
// sent, we regenerate with a stronger instruction instead of just
// hoping the model listened.

type GeneratedReminder = {
  email_subject: string;
  email_body: string;
  whatsapp_message: string;
  sms_text: string;
  psychology_note?: string;
};

function normalizeForComparison(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Jaccard similarity over word sets — cheap, no extra API call,
// and a reasonable proxy for "does this read like the same message."
function similarity(a: string, b: string): number {
  const setA = new Set(normalizeForComparison(a));
  const setB = new Set(normalizeForComparison(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const unionSize = setA.size + setB.size - intersection;
  return unionSize === 0 ? 0 : intersection / unionSize;
}

const SIMILARITY_THRESHOLD = 0.6;

function tooSimilarToHistory(
  candidate: GeneratedReminder,
  previousReminders: GeneratedReminder[]
): boolean {
  const candidateText = `${candidate.email_body} ${candidate.whatsapp_message} ${candidate.sms_text}`;

  return previousReminders.some((prev) => {
    const prevText = `${prev.email_body || ''} ${prev.whatsapp_message || ''} ${prev.sms_text || ''}`;
    return similarity(candidateText, prevText) >= SIMILARITY_THRESHOLD;
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    const { success } = await reminderGenerationRateLimit.limit(
      `reminder-generation:${ip}`
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many reminder requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    // ============================================================
    // 0. Verify Firebase authentication / Guest access
    // ============================================================

    const authHeader = req.headers.get('authorization');

    // The client may still send a guestId in the body (older clients do),
    // but it's never trusted for identity — only the server-set cookie is
    // authoritative. If no cookie exists yet, this is a genuinely new
    // guest and the server mints the id itself.
    const existingGuestCookie = req.cookies.get('db_guest_id')?.value?.trim();
    const guestId = existingGuestCookie || crypto.randomUUID();

    let verifiedUserId: string | null = null;

    // ------------------------------------------------------------
    // Logged-in user
    // ------------------------------------------------------------

    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7).trim();

      if (!idToken) {
        return NextResponse.json(
          {
            success: false,
            message: 'Authentication token missing',
          },
          { status: 401 }
        );
      }

      try {
        const decodedToken =
          await getAdminAuth().verifyIdToken(idToken);

        verifiedUserId = decodedToken.uid;

        console.log(
          'Verified Reminder User ID:',
          verifiedUserId
        );
      } catch (error) {
        console.error(
          'GENERATE REMINDER AUTH ERROR:',
          error
        );

        return NextResponse.json(
          {
            success: false,
            message: 'Invalid or expired authentication token',
          },
          { status: 401 }
        );
      }
    }

    // ============================================================
    // 1. Check server-side AI reminder usage
    // ============================================================

    const adminDb = getAdminDb();

    let userData: Record<string, any> = {};

    // ------------------------------------------------------------
    // Logged-in user: 15/month or Pro unlimited
    // ------------------------------------------------------------

    if (verifiedUserId) {
      const userRef = adminDb
        .collection('users')
        .doc(verifiedUserId);

      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        return NextResponse.json(
          {
            success: false,
            message: 'User account not found',
          },
          { status: 404 }
        );
      }

      userData = userSnapshot.data() || {};

      if (!userData.isPro) {
        const currentMonthKey = getIndiaMonthKey(new Date());
        const storedMonthKey = userData.aiRemindersResetMonth || null;

        // A count from a previous month is stale — this user effectively
        // has their full 15 available again, even though the stored
        // number hasn't been reset to 0 yet (that happens lazily, below,
        // only once they actually generate something this month).
        const aiRemindersUsed =
          storedMonthKey === currentMonthKey
            ? Number(userData.aiRemindersUsed || 0)
            : 0;

        if (aiRemindersUsed >= 15) {
          return NextResponse.json(
            {
              success: false,
              message:
                'You have reached your 15 AI reminder limit for this month.',
            },
            { status: 403 }
          );
        }
      }
    }

    // ------------------------------------------------------------
    // Guest user: 5 total free reminders
    // ------------------------------------------------------------

    if (!verifiedUserId) {
      const guestRef = adminDb
        .collection('guestUsage')
        .doc(guestId);

      const guestSnapshot = await guestRef.get();

      const guestData = guestSnapshot.exists
        ? guestSnapshot.data() || {}
        : {};

      const guestRemindersUsed = Number(
        guestData.aiRemindersUsed || 0
      );

      if (guestRemindersUsed >= 5) {
        return withGuestCookie(
          NextResponse.json(
            {
              success: false,
              message:
                'You have used all 5 free AI reminders. Please create an account to continue.',
            },
            { status: 403 }
          ),
          guestId,
          true
        );
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not defined in environment variables."
      );
    }

    // ============================================================
    // Reminder Variation Context
    // ============================================================
    // These are sent by the landing page generator (page.tsx).
    // They are only used to make repeated generations different.

    const previousReminders = Array.isArray(
      body.previousReminders
    )
      ? body.previousReminders.slice(-5)
      : [];

    const variationInstruction =
      typeof body.variationInstruction === 'string' &&
      body.variationInstruction.trim()
        ? body.variationInstruction.trim()
        : 'Use fresh wording and a different communication approach from previous versions.';

    const previousReminderText =
      previousReminders.length > 0
        ? previousReminders
            .map(
              (reminder: any, index: number) => `
Previous Version ${index + 1}:

Email Subject:
${reminder.email_subject || ''}

Email Body:
${reminder.email_body || ''}

WhatsApp:
${reminder.whatsapp_message || ''}

SMS:
${reminder.sms_text || ''}
`
            )
            .join('\n')
        : 'No previous reminders are available.';

    // ============================================================
    // AI GENERATION (with uniqueness-enforcing retry)
    // ============================================================

    const buildPrompt = (extraNote: string) => `
        You are an expert Payment Recovery Specialist for freelancers.
        Your goal is to recover payments quickly while maintaining great client relationships.
       
        Details:
        - Client Name: ${body.clientName}
        - Amount Due: ${body.currency} ${body.amount}
        - Days Overdue: ${body.daysOverdue || '7'} days
        - Invoice Reference: ${body.invoiceRef || 'Pending'}
        - Tone Preference: ${body.tone || 'professional'}
       
        Tone Guidelines:
        - 'gentle': Use warm, polite, and helpful language. Assume the client simply forgot.
        - 'professional': Use formal, direct, and objective language. Focus on the agreement.
        - 'firm': Use urgent, clear, and assertive language. Mention the impact of the delay on operations.

        ============================================================
        FRESH REMINDER REQUIREMENTS
        ============================================================

        Every generation must feel freshly written.

        Do NOT simply reuse the same reminder template and replace
        the client name or amount.

        Variation direction for this generation:
        ${variationInstruction}

        Previous generated reminders:
        ${previousReminderText}

        If previous reminders are available:

        - Do NOT copy previous sentences.
        - Do NOT reuse the same opening.
        - Do NOT reuse the same closing.
        - Do NOT reuse the same call-to-action.
        - Do NOT closely imitate previous sentence structures.
        - Do NOT simply replace a few words from a previous reminder.
        - Use genuinely different wording and sentence flow.
        - Where appropriate, use a different communication approach.
        - Keep the selected tone.
        - Keep all payment information accurate.
        - Make Email, WhatsApp, and SMS naturally suited to their channels.
        ${extraNote}

        IMPORTANT:

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

        that were not provided.

        The Amount Due is given above exactly as it should appear.
        Reproduce it exactly as given, including any comma thousand
        separators (e.g. "25,000", not "25000"). Do not reformat,
        round, or remove the separators.

        ============================================================
        OUTPUT RULES
        ============================================================

        - Email Subject: Professional and clear.
          Include the invoice number only when an actual invoice
          number is provided. Never invent one.

        - Email Body: Keep under 150 words.
          Be helpful, clear, and include a placeholder for a payment link.

        - WhatsApp: Short, conversational, friendly.
          Use appropriate emojis for the selected tone.

        - SMS: Extremely brief (under 160 characters).

        - Psychology Note: Explain in one sentence why this specific
          tone and approach is best for this situation.

        Return only the requested structured fields.
      `;

    const MAX_ATTEMPTS = 3;
    let generated: GeneratedReminder | null = null;
    let extraNote = '';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const attemptResult = await generateObject({
        model: openai('gpt-4o-mini'),

        // Slightly higher creativity for more natural variation.
        // Bump it further on retries so a stubbornly similar model
        // has a real chance to actually diverge.
        temperature: attempt === 1 ? 0.85 : 0.95,

        schema: z.object({
          email_subject: z.string(),
          email_body: z.string(),
          whatsapp_message: z.string(),
          sms_text: z.string(),
          psychology_note: z.string(),
        }),

        prompt: buildPrompt(extraNote),
      });

      const candidate = attemptResult.object;
      const duplicate = tooSimilarToHistory(candidate, previousReminders);

      if (!duplicate || attempt === MAX_ATTEMPTS) {
        generated = candidate;
        if (duplicate) {
          // Ran out of attempts — log it so it's visible in server
          // logs, but still return the closest attempt rather than
          // failing the request outright.
          console.warn(
            `Reminder for ${body.clientName}: still similar to a previous version after ${MAX_ATTEMPTS} attempts.`
          );
        }
        break;
      }

      extraNote = `
        NOTE: Your previous attempt (attempt ${attempt}) was too
        similar in wording to an earlier reminder for this client.
        This is attempt ${attempt + 1}. Use a noticeably different
        opening, sentence structure, and phrasing this time — do not
        reuse patterns from your own prior attempt either.
      `;
    }

    const result = { object: generated as GeneratedReminder };

    // ============================================================
    // Increment AI reminder usage AFTER successful generation
    // ============================================================

    // Logged-in Free users
    if (verifiedUserId && !userData.isPro) {
      const userRef = adminDb
        .collection('users')
        .doc(verifiedUserId);

      const currentMonthKey = getIndiaMonthKey(new Date());
      const storedMonthKey = userData.aiRemindersResetMonth || null;

      const newCount =
        storedMonthKey === currentMonthKey
          ? Number(userData.aiRemindersUsed || 0) + 1
          : 1; // first generation of a new month — start the count over

      await userRef.set(
        {
          aiRemindersUsed: newCount,
          aiRemindersResetMonth: currentMonthKey,
        },
        { merge: true }
      );
    }

    // Guest users
    if (!verifiedUserId) {
      const guestRef = adminDb
        .collection('guestUsage')
        .doc(guestId);

      const guestSnapshot = await guestRef.get();

      const currentGuestUsage = guestSnapshot.exists
        ? Number(
            guestSnapshot.data()?.aiRemindersUsed || 0
          )
        : 0;

      await guestRef.set(
        {
          aiRemindersUsed: currentGuestUsage + 1,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    return withGuestCookie(
      NextResponse.json(result.object),
      guestId,
      !verifiedUserId
    );

  } catch (error: any) {
    console.error(
      "!!! API ROUTE ERROR !!!",
      error
    );

    return NextResponse.json(
  {
    error: "Internal Server Error",
  },
  {
    status: 500,
  }
);

  }
}