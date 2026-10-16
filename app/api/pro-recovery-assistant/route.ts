import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getAdminAuth } from "@/lib/firebaseAdminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { proRecoveryAssistantRateLimit } from "@/lib/rateLimit";
import { NATURAL_WRITING_RULES, signOffRule, clientMessageLanguageRule } from "@/lib/reminderRules";

// Ensure this Next.js route is always dynamic and never cached on the server side
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Initialize the OpenAI provider with robust configuration
const openai = createOpenAI({
  apiKey: process.env.DASHBOARD_PRO_API_KEY,
});

export async function POST(req: Request) {
  console.log("--- Pro Recovery Assistant Route Triggered (Streaming / Live Sync) ---");

  try {
    // ============================================================
    // 0. Verify Firebase authentication
    // ============================================================

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7).trim();

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication token missing",
        },
        { status: 401 }
      );
    }

    let userId: string;

    try {
      const decodedToken = await getAdminAuth().verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (error) {
      console.error("PRO RECOVERY ASSISTANT AUTH ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired authentication token",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // Verify Pro subscription server-side
    // ============================================================

    const adminDb = getAdminDb();

    const userRef = adminDb
      .collection("users")
      .doc(userId);

    // SPEED: these 4 jobs don't depend on each other, so run them at the
    // same time instead of one after another (saves about 0.5–1 second).
    const [userSnapshot, rateLimitResult, rawBody, clientSnapshot, authUser] = await Promise.all([
      userRef.get(),
      proRecoveryAssistantRateLimit.limit(`pro-recovery-assistant:user:${userId}`),
      req.json(),
      adminDb.collection("clients").where("userId", "==", userId).get(),
      getAdminAuth().getUser(userId).catch(() => null),
    ]);

    if (!userSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "User account not found",
        },
        { status: 404 }
      );
    }

    const userData = userSnapshot.data() || {};

    if (!userData.isPro) {
      return NextResponse.json(
        {
          success: false,
          error: "Pro subscription required",
        },
        { status: 403 }
      );
    }

    // Check Pro expiration server-side
    if (userData.proExpiresAt) {
      const expirationDate =
        typeof userData.proExpiresAt.toDate === "function"
          ? userData.proExpiresAt.toDate()
          : new Date(userData.proExpiresAt);

      if (new Date() >= expirationDate) {
        return NextResponse.json(
          {
            success: false,
            error: "Pro subscription has expired",
          },
          { status: 403 }
        );
      }
    }

    // ============================================================
    // Rate limit Pro Recovery Assistant
    // ============================================================

    // Limit per signed-in user, not per Wi-Fi address, so people on the
    // same office or café Wi-Fi don't share one limit. (Checked above,
    // together with the other lookups.)
    const { success } = rateLimitResult;

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many assistant requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Parse the payload safely whether passed raw or inside a prompt wrapper
    const body = typeof rawBody.prompt === 'string' 
      ? JSON.parse(rawBody.prompt) 
      : rawBody;


    let { clientId, history, action, total } = body;

    // ============================================================
    // Load clients SERVER-SIDE for the authenticated user.
    // Never trust client/client list supplied by the browser.
    // ============================================================
    let clients: any[] = clientSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>),
      }))
      .filter((c: any) => {
        const isValidRecord =
          c &&
          typeof c === "object" &&
          Object.keys(c).length > 0;

        const isNotDeleted =
          c.status !== "Deleted" &&
          c.isDeleted !== true;

        const hasName =
          Boolean(c.name && String(c.name).trim() !== "");

        return isValidRecord && isNotDeleted && hasName;
      });

    // ============================================================
    // Calculate live payment status from dueDate.
    // The database stores unpaid clients as "Pending"; overdue
    // status is derived from the due date, just like the dashboard.
    // ============================================================

    // Today's date in India time, as a plain calendar day. The server runs
    // on UTC, so "new Date()" alone is a day behind between midnight and
    // 5:30 am India time.
    const indiaToday = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const [todayYear, todayMonth, todayDay] = indiaToday.split("-").map(Number);
    const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);

    // ============================================================
    // CURRENCY — every amount uses the client's own currency.
    // The client's "currency" field may be a symbol ("₹", "$"),
    // a code ("INR", "USD") or both ("₹ INR"). Old clients with no
    // currency saved fall back to ₹, same as the reminder job.
    // ============================================================
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

    const getCurrencySymbol = (currency: unknown): string => {
      const raw = String(currency ?? "").trim();

      if (!raw) return "₹";

      const code = raw.toUpperCase().match(/[A-Z]{3}/)?.[0];

      if (code && CURRENCY_SYMBOLS[code]) return CURRENCY_SYMBOLS[code];

      // A plain symbol like "₹" or "$" (letters and spaces removed).
      const symbol = raw.replace(/[A-Za-z\s]/g, "");

      if (symbol) return symbol;

      // An unknown code like "CHF": show it with a space, e.g. "CHF 500".
      return `${raw.toUpperCase()} `;
    };

    // Indian comma grouping (1,00,000) for rupees; normal grouping
    // (100,000) for every other currency.
    const formatNumber = (amount: unknown, symbol: string): string => {
      const num = Number(amount);
      if (!Number.isFinite(num)) return String(amount ?? "0");
      return num.toLocaleString(symbol === "₹" ? "en-IN" : "en-US");
    };

    // Amount with the client's currency, e.g. "₹1,00,000" or "$500".
    // Every place that puts an amount into the AI prompt must use this,
    // so the model (which is told to copy amountDue exactly) always
    // shows the right currency.
    const formatMoney = (amount: unknown, currency: unknown): string => {
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${formatNumber(amount, symbol)}`;
    };

    // Total of many clients, kept separate per currency so rupees and
    // dollars are never added together, e.g. "₹45,000 + $1,200".
    const formatTotalsByCurrency = (list: any[]): string => {
      const totals = new Map<string, number>();

      for (const c of list) {
        const symbol = getCurrencySymbol(c.currency);
        totals.set(symbol, (totals.get(symbol) || 0) + Number(c.amount || 0));
      }

      if (totals.size === 0) return "₹0";

      return Array.from(totals.entries())
        .map(([symbol, total]) => `${symbol}${formatNumber(total, symbol)}`)
        .join(" + ");
    };

    const getDaysOverdue = (dueDate: string | undefined): number => {
      if (!dueDate) return 0;

      const [year, month, day] = String(dueDate).substring(0, 10).split("-").map(Number);

      if (!year || !month || !day) return 0;

      const diffDays = Math.round(
        (todayUtc - Date.UTC(year, month - 1, day)) / (1000 * 60 * 60 * 24)
      );

      return Math.max(0, diffDays);
    };

    // ============================================================
    // ESCALATION LADDER — computed in code, not guessed by the AI.
    // Looks at how many reminders (automated + manual) this client
    // has actually received and decides:
    //   - what stage they're at
    //   - what tone is appropriate
    //   - which channel to suggest next (switch if last one was ignored)
    //   - whether they've gone quiet on every stage ("stalled")
    // ============================================================
    const getEscalationStage = (c: any) => {
      const history = Array.isArray(c.reminderHistory) ? c.reminderHistory : [];
      const sentCount = history.length;
      const last = history[history.length - 1] || null;
      const lastChannel = last?.channel || null;
      const daysOverdue = c.daysOverdue || 0;

      if (sentCount === 0) {
        return {
          stage: 'first',
          sentCount,
          suggestedChannel: 'email',
          tone: 'friendly',
          reason: 'No reminder has been sent yet.',
        };
      }

      if (sentCount === 1) {
        return {
          stage: 'second',
          sentCount,
          suggestedChannel: lastChannel === 'email' ? 'whatsapp' : 'email',
          tone: 'direct',
          reason: `One reminder already sent via ${lastChannel || 'email'}, no payment yet. Switch channel and be more direct.`,
        };
      }

      if (sentCount === 2 && daysOverdue < 21) {
        return {
          stage: 'final',
          sentCount,
          suggestedChannel: lastChannel === 'whatsapp' ? 'email' : 'whatsapp',
          tone: 'firm-with-deadline',
          reason: `${sentCount} reminders sent, still unpaid. State a clear deadline and a real consequence (late fee, service pause).`,
        };
      }

      // 3+ reminders ignored, or very overdue with no response at all —
      // more of the same reminder will not help. Shift approach entirely.
      return {
        stage: 'stalled',
        sentCount,
        suggestedChannel: 'call-or-email',
        tone: 'problem-solving',
        reason: `${sentCount} reminder(s) sent across channels and ${daysOverdue} days overdue with no payment — this client is not responding to reminders. Do not send another generic reminder. Acknowledge they may be stuck, offer a payment plan or partial payment, and ask directly what is blocking payment. Recommend a phone call as the next step.`,
      };
    };

    const liveClients = clients.map((c: any) => {
      const daysOverdue = getDaysOverdue(c.dueDate);

      const isOverdue =
        c.status === "Pending" &&
        daysOverdue > 0;

      return {
        ...c,

        // Amount already formatted with this client's own currency,
        // so the AI never has to guess the currency.
        amountDue: formatMoney(c.amount, c.currency),

        // Live payment state
        daysOverdue,
        isOverdue,
        liveStatus:
          c.status === "Paid"
            ? "Paid"
            : isOverdue
            ? "Overdue"
            : "Pending",

        // Live recovery automation state
        automatedReminders: Boolean(c.automatedReminders),
        automationStatus: c.automationStatus || "off",
        lastAutomatedReminderStage:
          c.lastAutomatedReminderStage || null,
        lastAutomatedReminderSentAt:
          c.lastAutomatedReminderSentAt || null,
        reminderHistory: Array.isArray(c.reminderHistory)
          ? c.reminderHistory
          : [],
      };
    });

    // Separate active recovery cases from paid clients.
    const activeClients = liveClients.filter(
      (c: any) => c.status !== "Paid"
    );

    const paidClients = liveClients.filter(
      (c: any) => c.status === "Paid"
    );

    const hasActiveClients = activeClients.length > 0;

    // ============================================================
    // Resolve selected client from the authenticated user's
    // live server-side client list.
    // ============================================================

    let client: any = null;

    if (clientId) {
      client =
        liveClients.find(
          (c: any) => String(c.id) === String(clientId)
        ) || null;

      if (!client) {
        return NextResponse.json(
          {
            success: false,
            error: "Client not found",
          },
          { status: 404 }
        );
      }
    }

    const hasValidClient =
      client &&
      typeof client === "object" &&
      client.name &&
      client.status !== "Deleted" &&
      client.status !== "Paid";

    // Section 3: If No Active Pending/Overdue Clients Exist (All Paid or Empty), Return Celebration or Empty State
    if (!hasActiveClients && action !== "welcome_pro") {
      console.log("DEBUG - All clients are paid or zero active clients found. Returning celebration/fallback response.");
      
      const isAllPaid = Array.isArray(clients) && clients.length > 0 && paidClients.length === clients.length;
      
      if (isAllPaid) {
        return new NextResponse(
          "🤖 Blink\n📌 Status Update\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Quick Summary\nGreat work!\n\n━━━━━━━━━━━━━━━━━━━━━━\n📌 Important Information\n• Status: All Payments Recovered\n• Pending Clients: 0\n• Overdue Clients: 0\n\n━━━━━━━━━━━━━━━━━━━━━━\n✨ Blink Recommendation\nAll payments have been successfully recovered. You currently have no pending or overdue clients.\n\n━━━━━━━━━━━━━━━━━━━━━━\n🎯 Next Best Action\nAdd new clients to continue tracking payments with DueBlink.",
          { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
        );
      } else {
        return new NextResponse(
          "🤖 Blink\n📌 Status Update\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Quick Summary\nNo active clients yet.\n\n━━━━━━━━━━━━━━━━━━━━━━\n📌 Important Information\n• Client List: Empty\n• Portfolio Status: Inactive\n\n━━━━━━━━━━━━━━━━━━━━━━\n✨ Blink Recommendation\nAdd your first client to unlock Blink AI Recovery Assistant and accelerate your payment recovery.\n\n━━━━━━━━━━━━━━━━━━━━━━\n🎯 Next Best Action\nAdd Your First Client",
          { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
        );
      }
    }

    // Base rules for every Blink answer. Each action below adds its own
    // short layout. The screen (FloatingRobot.tsx) turns these headings
    // into cards, so headings must stay exactly as written.
    let systemPrompt = `You are Blink, DueBlink's payment recovery assistant for freelancers and small agencies.
Only use the live client data given to you. Never invent clients, amounts, dates, invoice numbers or reminder history.
Paid clients never appear in recovery advice.

HOW EVERY ANSWER MUST LOOK:
- Short. The owner must understand it in 5 seconds.
- Plain text only. No Markdown (no **, no #), no code blocks, no emojis.
- Use ONLY the headings and labels in the layout for this request, spelled exactly as shown, each on its own line. Never add, rename, skip or repeat a heading.
- Never say the same fact twice. If a value is already shown (amount, days overdue, stage), do not repeat it in the advice.
- Advice is ONE short sentence: who to chase, how, and why.
- Replace every line in brackets with real text. Never output the brackets themselves.
- Never write placeholders like [Your Name], [Payment Link] or [Invoice Number].
- Stop right after the last section of the layout. Nothing before the first heading, nothing after the last.
- CURRENCY: every amount already includes the client's own currency symbol (₹, $, € and so on). Copy it exactly. Never assume rupees, never convert currencies, never add different currencies together.
- REMINDER HISTORY: never suggest a reminder that was already sent, and never restart the sequence with a "first" style message.`;

    // The freelancer's own name, so emails Blink writes are signed by them.
    const ownerName = String(
      userData.name || userData.displayName || authUser?.displayName || ""
    ).trim();

    systemPrompt += `

WHEN YOU WRITE AN EMAIL OR WHATSAPP MESSAGE FOR A CLIENT:
${signOffRule(ownerName)}
- WhatsApp messages may end with just the sender's first name${ownerName ? ` ("${ownerName.split(" ")[0]}")` : ""}, or no name at all.
- If the client has a paymentLink in the data, you may include that exact link once. If not, do not mention any link.
${NATURAL_WRITING_RULES}`;

    let userPrompt = "";

    // 1. Handle Dashboard Actions with rigorous live data injection and zero-cache guarantee
    if (action) {
      if (action === "welcome_pro") {
        systemPrompt += `
Follow this exact layout for Welcome:
🤖 Blink
📌 Welcome Pro

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Your Pro recovery workspace is fully active with zero limits.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Status: Pro Active
• Features: Unlimited AI Reminders & Assistant
• Command Center: Ready

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Start by analyzing your active live client portfolio or generating your first priority follow-up.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Choose a quick action below to begin recovering payments.`;

        userPrompt = "Provide a short, welcoming overview for the Pro user using the exact Blink layout.";

      } else if (action === "recommend") {
        const targetClient =
          client
            ? liveClients.find((c: any) => String(c.id) === String(client.id)) || client
            : activeClients?.[0] || {
                name: 'Selected Client',
                company: 'N/A',
                amount: '0',
                dueDate: 'N/A',
                status: 'Pending',
                liveStatus: 'Pending',
                isOverdue: false,
                daysOverdue: 0,
              };

        const targetStatus =
          targetClient.liveStatus ||
          (targetClient.isOverdue ? 'Overdue' : targetClient.status || 'Pending');

        const reminderAlreadySent =
          Array.isArray(targetClient.reminderHistory) &&
          targetClient.reminderHistory.some(
            (r: any) => r?.type === 'automated' && r?.channel === 'email'
          );

        const lastAutomatedStage =
          targetClient.lastAutomatedReminderStage || "None";

        // Code decides the stage/tone/channel — the AI just writes to spec.
        const escalation = getEscalationStage(targetClient);

        const recommendAmount = formatMoney(targetClient.amount, targetClient.currency);
        const recommendStageText = `${escalation.stage} (reminder #${escalation.sentCount + 1})`;

        systemPrompt += `
Follow this exact layout for Generate Follow-up:

RECOVERY SNAPSHOT
Client: ${targetClient.name}
Amount Due: ${recommendAmount}
Due Date: ${targetClient.dueDate || 'N/A'}
Days Overdue: ${targetClient.daysOverdue || 0}
Stage: ${recommendStageText}

BLINK RECOMMENDATION
[One short sentence: lead with ${escalation.suggestedChannel} and why.]

EMAIL FOLLOW-UP
Subject: [short subject that fits the "${escalation.stage}" stage]
[the email body, written for the "${escalation.stage}" stage]

WHATSAPP FOLLOW-UP
[the WhatsApp message, written for the "${escalation.stage}" stage]

RULES:
- Copy the RECOVERY SNAPSHOT lines exactly as shown.
- Tone for this stage: ${escalation.tone}.
  - "first": friendly, no pressure.
  - "second": direct, ask for a payment date.
  - "final": firm, give a clear deadline date and the real next step. No apologizing.
  - "stalled": do not ask for the full amount again. Offer a payment plan or part payment, ask what is blocking payment, suggest a short call.
- Status is ${targetStatus}. Never call an overdue invoice "pending".
- The email and WhatsApp messages must not repeat each other word for word.
- WHATSAPP FOLLOW-UP is the last section. Stop after it.
${clientMessageLanguageRule(targetClient.language)}`;

        userPrompt = `Write the Generate Follow-up for this client: ${JSON.stringify({
  client: targetClient.name,
  amountDue: recommendAmount,
  dueDate: targetClient.dueDate || 'N/A',
  status: targetStatus,
  daysOverdue: targetClient.daysOverdue || 0,
  remindersSent: escalation.sentCount,
  lastAutomatedStage: lastAutomatedStage,
  automatedReminderAlreadySent: reminderAlreadySent,
  escalationStage: escalation.stage,
  paymentLink: targetClient.paymentLink || '',
})}`;

      } else if (action === "priorities") {
        systemPrompt += `
Follow this exact layout for Today's Priorities. Show at most 3 clients, most urgent first. Only show clients that exist in the data.

PRIORITY 1
Client: [name]
Amount Due: [amountDue, copied exactly]
Days Overdue: [daysOverdue]
Recommended Action: [one short sentence that fits this client's stage]

PRIORITY 2
(same 4 lines)

PRIORITY 3
(same 4 lines)

TODAY'S FOCUS
[One sentence: the client to handle first, and why.]

RULES:
- If an automated reminder was already sent at a stage, do not recommend that same reminder again.
- A "stalled" client gets a call or payment plan, not another reminder.
- TODAY'S FOCUS is the last section. Stop after it.`;

        const priorityClients = [...activeClients]
          .filter((c: any) => c.status !== 'Paid')
          .sort((a: any, b: any) => {
            // 1. Overdue clients first
            if (a.isOverdue !== b.isOverdue) {
              return a.isOverdue ? -1 : 1;
            }

            // 2. Clients further into recovery need attention sooner
            const recoveryStage = (client: any) => {
              const stage = String(client.lastAutomatedReminderStage || '').toLowerCase();

              if (stage.includes('final')) return 4;
              if (stage.includes('follow')) return 3;
              if (stage.includes('first')) return 2;
              if (stage) return 1;

              return 0;
            };

            const stageDifference =
              recoveryStage(b) - recoveryStage(a);

            if (stageDifference !== 0) {
              return stageDifference;
            }

            // 3. Highest overdue duration
            return (
              Number(b.daysOverdue || 0) -
              Number(a.daysOverdue || 0)
            );
          })
          .slice(0, 5);

        // Only the fields Blink needs, not the full client records.
        const priorityData = priorityClients.slice(0, 3).map((c: any) => {
          const esc = getEscalationStage(c);
          return {
            client: c.name,
            amountDue: c.amountDue,
            daysOverdue: c.daysOverdue || 0,
            status: c.liveStatus,
            stage: esc.stage,
            remindersSent: esc.sentCount,
            lastAutomatedStage: c.lastAutomatedReminderStage || 'None',
          };
        });

        userPrompt = `Today's most urgent unpaid clients, already sorted (most urgent first): ${JSON.stringify(priorityData)}`;

      } else if (action === "summarize" || action === "summarize_outstanding") {
        const pendingCount = activeClients.filter((c: any) => c.status !== 'Paid')?.length || 0;
        const overdueCount = activeClients.filter((c: any) => c.isOverdue === true).length;
        // Totals kept per currency, never mixed (e.g. "₹45,000 + $1,200").
        const outstandingTotalText = formatTotalsByCurrency(activeClients);

        const automatedReminderClients = activeClients.filter(
          (c: any) =>
            c.automatedReminders === true &&
            c.lastAutomatedReminderStage
        );

        const manuallyActionableClients = activeClients.filter(
          (c: any) =>
            c.isOverdue === true &&
            !c.lastAutomatedReminderStage
        );

        const summaryClients = activeClients.map((c: any) => ({
          client: c.name,
          amountDue: c.amountDue,
          daysOverdue: c.daysOverdue || 0,
          status: c.liveStatus,
          stage: getEscalationStage(c).stage,
        }));

        systemPrompt += `
Follow this exact layout for Outstanding Summary:

Important Information
• Outstanding Amount: ${outstandingTotalText}
• Pending Clients: ${pendingCount}
• Overdue Clients: ${overdueCount}
• Paid Clients: ${paidClients.length}

Blink Insight
[One sentence: the ONE client to chase first and why, using the data.]

RULES:
- Copy the four Important Information lines exactly as shown.
- Blink Insight is the last section. Stop after it.`;

        userPrompt = `Unpaid clients: ${JSON.stringify(summaryClients)}
Clients already getting automated reminders: ${automatedReminderClients.length}. Overdue clients with no automated reminder yet: ${manuallyActionableClients.length}.`;

      } else if (action === "rewrite") {
        const targetClient =
          client
            ? liveClients.find((c: any) => String(c.id) === String(client.id)) || client
            : activeClients?.[0] || {
                name: 'Client',
                amount: '0',
                status: 'Pending',
                liveStatus: 'Pending',
                isOverdue: false,
                daysOverdue: 0,
                reminderHistory: [],
              };

        const previousAutomatedReminders = Array.isArray(
          targetClient.reminderHistory
        )
          ? targetClient.reminderHistory.filter(
              (r: any) =>
                r?.type === "automated" &&
                r?.channel === "email"
            )
          : [];

        // Code decides the stage — same escalation ladder used by "recommend".
        const rewriteEscalation = getEscalationStage(targetClient);

        // The tone shown on the Rewrite screen, in plain words, taken
        // from the real stage (it used to always say "Professional & Firm").
        const TONE_LABELS: Record<string, string> = {
          friendly: "Friendly",
          direct: "Direct",
          "firm-with-deadline": "Firm, with a deadline",
          "problem-solving": "Helpful, offers a payment plan",
        };
        const rewriteToneLabel =
          TONE_LABELS[rewriteEscalation.tone] || rewriteEscalation.tone;

        const rewriteAmount = formatMoney(targetClient.amount, targetClient.currency);

        systemPrompt += `
Follow this exact layout for Rewrite Reminder:

Important Information
• Client: ${targetClient.name}
• Amount Due: ${rewriteAmount}
• Days Overdue: ${targetClient.daysOverdue || 0}
• Tone: ${rewriteToneLabel}

REWRITTEN REMINDER
Subject: [short subject that fits the "${rewriteEscalation.stage}" stage]
[the email body, written for the "${rewriteEscalation.stage}" stage]

Blink Recommendation
[One short sentence: why this tone fits right now.]

RULES:
- Copy the four Important Information lines exactly as shown.
- Stage: ${rewriteEscalation.stage}. ${rewriteEscalation.reason}
  - "first": friendly, no pressure.
  - "second": direct, ask for a payment date.
  - "final": firm, give a clear deadline date and the real next step. No apologizing.
  - "stalled": offer a payment plan or part payment and ask what is blocking payment. Do not demand the full amount again.
- Write it in fresh words, not a copy of an earlier reminder.
- Never call an overdue invoice "pending".
- Blink Recommendation is the last section. Stop after it.
${clientMessageLanguageRule(targetClient.language)}`;

        userPrompt = `Rewrite the reminder for this client: ${JSON.stringify({
  client: targetClient.name,
  amountDue: rewriteAmount,
  dueDate: targetClient.dueDate || 'N/A',
  status: targetClient.liveStatus || targetClient.status || 'Pending',
  daysOverdue: targetClient.daysOverdue || 0,
  remindersSent: rewriteEscalation.sentCount,
  escalationStage: rewriteEscalation.stage,
  paymentLink: targetClient.paymentLink || '',
  previousAutomatedSubjects: previousAutomatedReminders
    .map((r: any) => r?.email_subject)
    .filter(Boolean),
})}`;

      } else if (action === "overdue") {
        const overdueList = activeClients
          .filter((c: any) => c.isOverdue === true)
          .map((c: any) => {
            const esc = getEscalationStage(c);
            return {
              name: c.name,
              amountDue: formatMoney(c.amount, c.currency),
              dueDate: c.dueDate || 'N/A',
              status: c.liveStatus || 'Overdue',
              daysOverdue: c.daysOverdue || 0,
              // Pre-written in code — the AI copies this verbatim, it does
              // not compute or interpret a stage itself.
              recoveryStageText: `${esc.stage} (reminder #${esc.sentCount + 1})`,
              recommendedActionHint: esc.reason,
              stage: esc.stage,
            };
          })
          // Most days overdue first, so PRIORITY 1 is the most urgent.
          .sort((a: any, b: any) => Number(b.daysOverdue) - Number(a.daysOverdue));

        systemPrompt += `
Follow this exact layout for Find Overdue Clients:

Quick Summary
${overdueList.length} client${overdueList.length === 1 ? " has an overdue payment" : "s have overdue payments"}.

Important Information
PRIORITY 1
Client: [name]
Amount Due: [amountDue, copied exactly]
Days Overdue: [daysOverdue]
Recovery Stage: [recoveryStageText, copied exactly]
Recommended Action: [one short sentence based on recommendedActionHint]

PRIORITY 2
(same 5 lines, and so on)

Next Best Action
[One sentence: the client to handle first, and why.]

RULES:
- Include EVERY overdue client in the data, one PRIORITY block each, in the order given. Never merge or skip clients.
- Copy "Quick Summary" exactly as shown.
- A "stalled" client gets a call or payment plan, not another reminder. A "final" client gets a clear deadline.
- Next Best Action is the last section. Stop after it.`;

        userPrompt = `Overdue clients, most urgent first: ${JSON.stringify(overdueList)}`;
      }
    } 
    // 2. Handle Individual Client Reminders using live object data
    else if (client) {
      if (client.status === 'Paid') {
        return new NextResponse(
          "🤖 Blink\n📌 Status Update\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Quick Summary\nClient is Paid.\n\n━━━━━━━━━━━━━━━━━━━━━━\n📌 Important Information\n• Status: Paid\n• Action Required: None\n\n━━━━━━━━━━━━━━━━━━━━━━\n✨ Blink Recommendation\nThis client has already paid. No follow-up needed.\n\n━━━━━━━━━━━━━━━━━━━━━━\n🎯 Next Best Action\nSelect an active pending or overdue client.",
          { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
        );
      }

      // Same escalation ladder as Generate Follow-up: code decides the
      // stage, tone and channel from real reminder history; the AI only
      // writes the words.
      const singleEscalation = getEscalationStage(client);
      const singleStatus = client.liveStatus || client.status || 'Pending';
      const singleAmount = formatMoney(client.amount, client.currency);

      systemPrompt += `
ESCALATION LADDER (follow exactly — computed from real reminder history):
Current stage: ${singleEscalation.stage}
Required tone: ${singleEscalation.tone}
Suggested channel to lead with: ${singleEscalation.suggestedChannel}
Reason: ${singleEscalation.reason}

Stage meanings (the email subject, the email and the WhatsApp message must ALL match the current stage):
- "first": friendly, informative, no pressure.
- "second": more direct, restate amount and due date, ask when they will pay.
- "final": firm, state a clear deadline date and the real next step. No apologizing.
- "stalled": do NOT demand full payment again — offer a payment plan or part payment, ask what is blocking payment, and suggest a short call.

Follow this exact layout for Individual Client Reminders:
🤖 Blink
📌 Generate Follow-up

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
One sentence: which reminder this is for ${client.name} (stage "${singleEscalation.stage}", reminder #${singleEscalation.sentCount + 1}) and why.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Client: ${client.name}
• Company: ${client.company || 'N/A'}
• Amount Due: ${singleAmount}
• Due Date: ${client.dueDate || 'N/A'}
• Status: ${singleStatus}
• Days Overdue: ${client.daysOverdue || 0}
• Reminders Sent: ${singleEscalation.sentCount}
• Escalation Stage: ${singleEscalation.stage}

━━━━━━━━━━━━━━━━━━━━━━
✉️ AI Email
Subject: (write a short subject that matches the "${singleEscalation.stage}" stage — friendly for "first", direct for "second", firm with the deadline for "final", "Can we sort out a plan?" style for "stalled")
(then the email body, written for the "${singleEscalation.stage}" stage)

━━━━━━━━━━━━━━━━━━━━━━
💬 AI WhatsApp
(a short WhatsApp message for the "${singleEscalation.stage}" stage, with the amount ${singleAmount} and the days overdue)

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
One sentence: lead with ${singleEscalation.suggestedChannel} and why, based on the reason above.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
ONE specific action for the owner that matches the "${singleEscalation.stage}" stage.

STRICT RULES:
- Replace every line in brackets above with real text. Never output the bracketed instructions themselves.
- Keep the headings and the "Subject:" label exactly as shown.
- Never pretend no reminder was sent when Reminders Sent is more than 0. Never restart the sequence with a "first" style message.
- Never call an overdue invoice "pending."
- Copy the Important Information values exactly as given.
${clientMessageLanguageRule(
  (liveClients.find((c: any) => String(c.id) === String(client.id)) || client).language
)}`;

      userPrompt = `Write the follow-up for this live client: ${JSON.stringify({
  client: client.name,
  company: client.company || 'N/A',
  amountDue: singleAmount,
  dueDate: client.dueDate || 'N/A',
  status: singleStatus,
  daysOverdue: client.daysOverdue || 0,
  remindersSent: singleEscalation.sentCount,
  lastAutomatedStage: client.lastAutomatedReminderStage || 'None',
  escalationStage: singleEscalation.stage,
  paymentLink: client.paymentLink || '',
})}

The escalation stage has already been computed: "${singleEscalation.stage}". Write the email subject, email and WhatsApp message for exactly this stage. Use the exact Blink layout.`;
    } 
    // 3. Fallback error handling if payload lacks necessary context
    else {
      console.log("DEBUG - No valid action or client found in body");
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 4. Execute streamText call using Vercel AI SDK with OpenAI model
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
    });

    // Return plain text stream response directly with explicit no-cache headers for live synchronization
    return result.toTextStreamResponse({
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    console.error("Critical Assistant Error:", error);
    return NextResponse.json({ error: "Failed to process assistant request" }, { status: 500 });
  }
}