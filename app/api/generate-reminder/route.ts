import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';
import { getAdminDb } from '@/lib/firebaseAdmin';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ============================================================
    // 0. Verify Firebase authentication / Guest access
    // ============================================================

    const authHeader = req.headers.get('authorization');

    const guestId =
      typeof body.guestId === 'string'
        ? body.guestId.trim()
        : '';

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

    // ------------------------------------------------------------
    // Guest user
    // ------------------------------------------------------------

    if (!verifiedUserId && !guestId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Guest identifier missing',
        },
        { status: 400 }
      );
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
        const aiRemindersUsed = Number(
          userData.aiRemindersUsed || 0
        );

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
        return NextResponse.json(
          {
            success: false,
            message:
              'You have used all 5 free AI reminders. Please create an account to continue.',
          },
          { status: 403 }
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
    // These are sent by ReminderForm.tsx.
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
    // AI GENERATION
    // ============================================================

    const result = await generateObject({
      model: openai('gpt-4o-mini'),

      // Slightly higher creativity for more natural variation.
      temperature: 0.85,

      schema: z.object({
        email_subject: z.string(),
        email_body: z.string(),
        whatsapp_message: z.string(),
        sms_text: z.string(),
        psychology_note: z.string(),
      }),

      prompt: `
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
      `,
    });

    // ============================================================
    // Increment AI reminder usage AFTER successful generation
    // ============================================================

    // Logged-in Free users
    if (verifiedUserId && !userData.isPro) {
      const userRef = adminDb
        .collection('users')
        .doc(verifiedUserId);

      await userRef.set(
        {
          aiRemindersUsed:
            Number(userData.aiRemindersUsed || 0) + 1,
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

    return NextResponse.json(result.object);

  } catch (error: any) {
    console.error(
      "!!! API ROUTE ERROR !!!",
      error
    );

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details:
          error.message ||
          "An unexpected error occurred",
      },
      {
        status: 500,
      }
    );
  }
}