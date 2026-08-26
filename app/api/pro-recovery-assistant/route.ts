import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getAdminAuth } from "@/lib/firebaseAdminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { proRecoveryAssistantRateLimit } from "@/lib/rateLimit";

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

    const userSnapshot = await userRef.get();

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

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const { success } =
      await proRecoveryAssistantRateLimit.limit(
        `pro-recovery-assistant:${ip}`
      );

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

    const rawBody = await req.json();
    
    // Parse the payload safely whether passed raw or inside a prompt wrapper
    const body = typeof rawBody.prompt === 'string' 
      ? JSON.parse(rawBody.prompt) 
      : rawBody;

    console.log("DEBUG - Parsed body:", body); 

    let { clientId, history, action, total } = body;

    // ============================================================
    // Load clients SERVER-SIDE for the authenticated user.
    // Never trust client/client list supplied by the browser.
    // ============================================================
    const clientSnapshot = await adminDb
      .collection("clients")
      .where("userId", "==", userId)
      .get();

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDaysOverdue = (dueDate: string | undefined): number => {
      if (!dueDate) return 0;

      const [year, month, day] = dueDate.split("-").map(Number);

      if (!year || !month || !day) return 0;

      const due = new Date(year, month - 1, day);
      due.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - due.getTime();

      return Math.max(
        0,
        Math.floor(diffTime / (1000 * 60 * 60 * 24))
      );
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

    // Comprehensive System Role definition ensuring strict role-adherence and live synchronization
    let systemPrompt = `You are Blink, DueBlink's AI Recovery Assistant.
You help freelancers, agencies, consultants and businesses recover payments faster.
Never act like a general chatbot. Only answer using the latest live dashboard data provided. Never use cached or outdated data.
CRITICAL RULE: Automatically exclude paid clients from all recovery recommendations, priority lists, outstanding calculation breakdowns, and follow-up generation unless specifically queried about payment history.

RECOVERY MEMORY RULE:
Always use the live automated-reminder fields when deciding what to recommend:
- automatedReminders
- automationStatus
- lastAutomatedReminderStage
- lastAutomatedReminderSentAt
- reminderHistory

Never recommend an action as if no reminder has been sent when reminderHistory shows that an automated reminder was already sent.

When a payment is still unpaid after an automated reminder, explain the current recovery stage and recommend the most appropriate next manual or automated action.

Every action response MUST end with:
✨ Blink Recommendation
What should be done next based on the live recovery state.

🎯 Next Best Action
Give ONE clear next action the user can take.

The Next Best Action must match the actual situation. Do not recommend sending another reminder immediately if the appropriate automated reminder stage was already sent.

DESIGN PRINCIPLE:
- Every response must be visual, structured, scannable, and understood in under 10 seconds.
- Return ONLY plain text. No JSON, no Markdown asterisks (**), no code blocks, no streaming metadata.
- Every label and field must be strictly separated. Never combine labels and values into a single sentence or paragraph.
- Keep recommendations under 3 lines. Avoid long paragraphs or walls of text.
- Include appropriate icons and clean emojis for headers and info fields.

OUTPUT FORMAT IS STRICT AND MUST NOT BE CHANGED.
Return ONLY the exact headings and labels specified in the layout below.
Do not rename headings.
Do not add alternative headings.
Do not use Markdown headings (no #, no ##, no **bold**).
Do not use explanations, greetings, or commentary before the first heading.
Do not add commentary, disclaimers, or notes after the final section.
Do not change the capitalization of labels.
Do not omit any required section, even if a field's value is empty or unknown — use "N/A" instead of removing the label.
Do not invent additional sections that are not in the layout.
Every label below (e.g. "Client:", "Company:", "Days Overdue:") must appear on its own line, followed immediately by its value, with the exact spelling, punctuation, and colon shown.`;

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

        const recoveryState = `Escalation stage: ${escalation.stage} (reminder #${escalation.sentCount + 1}).\n${escalation.reason}`;

        systemPrompt += `
ESCALATION LADDER (follow exactly — this was computed from real reminder history, do not override it):
Current stage: ${escalation.stage}
Required tone: ${escalation.tone}
Suggested channel to lead with: ${escalation.suggestedChannel}
Reason: ${escalation.reason}

Stage meanings:
- "first": friendly, informative, no pressure. Just a helpful nudge.
- "second": more direct. Restate amount and due date plainly, ask for an expected payment date. Recommend the suggested channel if the previous channel got no response.
- "final": firm tone. State a real deadline (e.g. "within 3 business days") and a real consequence (late fee, pause on service/delivery). No apologizing, no soft language like "just a friendly reminder."
- "stalled": do NOT write another reminder demanding payment. Instead acknowledge they may be facing a genuine blocker, offer a payment plan or partial payment, ask directly what's preventing payment, and suggest a phone call as the real next step.

Never write a "first"-stage friendly tone if the stage is "second", "final", or "stalled".
Never repeat the tone or wording of a stage that has already passed.`;

        systemPrompt += `
Follow this exact layout for Generate Follow-up.BLINK
GENERATE FOLLOW-UP

━━━━━━━━━━━━━━━━━━━━
RECOVERY SNAPSHOT

Client: ${targetClient.name}
Company: ${targetClient.company || 'N/A'}
Amount Due: ₹${targetClient.amount}
Due Date: ${targetClient.dueDate || 'N/A'}
Status: ${targetStatus}
Days Overdue: ${targetClient.daysOverdue || 0}
Automation: ${reminderAlreadySent ? 'Active history recorded' : 'No automated reminder recorded'}
Last Automated Stage: ${targetClient.lastAutomatedReminderStage || 'None'}
Reminders Sent: ${escalation.sentCount}
Escalation Stage: ${escalation.stage}

━━━━━━━━━━━━━━━━━━━━
RECOVERY STATUS

${recoveryState}

Clearly explain what has already happened with this client and what recovery stage they are currently in.

━━━━━━━━━━━━━━━━━━━━
BLINK RECOMMENDATION

Explain the single most appropriate recovery action for this client right now.

Do not recommend repeating an automated reminder that has already been sent.
The recommendation must reflect the current recovery stage, payment status, and overdue duration.

━━━━━━━━━━━━━━━━━━━━
EMAIL FOLLOW-UP

Create a professional, personalized email matching the ESCALATION LADDER stage above exactly.

Rules:
- Do not call an overdue invoice "pending".
- Match the required tone for the current stage — do not soften a "final" or "stalled" stage, and do not escalate a "first" stage.
- If stage is "stalled", do not ask for full payment again — offer a payment plan/partial payment and ask what's blocking payment.
- If the client is Paid, do not create a recovery email.

Show:
Subject:
Email Body:

━━━━━━━━━━━━━━━━━━━━
WHATSAPP FOLLOW-UP

Create a concise WhatsApp message for the SAME escalation stage as the email.

Rules:
- Match the required tone for the current stage exactly.
- Keep it natural and suitable for WhatsApp.
- Do not call an overdue invoice "pending".
- If the client is Paid, do not create a recovery WhatsApp message.

Show:
WhatsApp Message:

━━━━━━━━━━━━━━━━━━━━
NEXT BEST ACTION

Give ONE clear next action based on the client's current recovery state.

REQUIRED HEADINGS (do not rename, do not skip, do not reorder):
RECOVERY SNAPSHOT
RECOVERY STATUS
BLINK RECOMMENDATION
EMAIL FOLLOW-UP
WHATSAPP FOLLOW-UP
NEXT BEST ACTION

REQUIRED FIELD LABELS inside RECOVERY SNAPSHOT (exact spelling, exact colon, one per line):
Client:
Company:
Amount Due:
Due Date:
Status:
Days Overdue:
Automation:
Last Automated Stage:
Reminders Sent:
Escalation Stage:

REQUIRED LABELS inside EMAIL FOLLOW-UP:
Subject:
Email Body:

REQUIRED LABEL inside WHATSAPP FOLLOW-UP:
WhatsApp Message:

Do not use "Customer:", "Balance:", "Late By:", "Action:" or any other alternative wording for these labels.

Do not give a generic instruction such as "Send the reminder today."

The action must tell the owner exactly what to do next.

Keep the response concise, specific to this client, and focused on recovering the outstanding payment.
Do not use generic AI explanations.
`;

        userPrompt = `Analyze active live client data for follow-up: ${JSON.stringify(targetClient)}.

Use the exact Blink Generate Follow-up layout above.

The escalation stage has already been computed: "${escalation.stage}" (tone: ${escalation.tone}, suggested channel: ${escalation.suggestedChannel}).
Write the email and WhatsApp message to match this exact stage — do not infer a different stage from the raw data.
`;

      } else if (action === "priorities") {
        systemPrompt += `
Follow this exact Blink layout for Today's Priorities.

🤖 Blink
📌 Today's Priorities

TODAY'S RECOVERY QUEUE

Analyze the supplied live client records and rank the clients who need the owner's attention most urgently.

For each priority, show:

PRIORITY 1
Client:
Company:
Amount Due:
Due Date:
Status:
Days Overdue:
Recovery Stage:
Why It Matters:
Recommended Action:

PRIORITY 2
Client:
Company:
Amount Due:
Due Date:
Status:
Days Overdue:
Recovery Stage:
Why It Matters:
Recommended Action:

PRIORITY 3
Client:
Company:
Amount Due:
Due Date:
Status:
Days Overdue:
Recovery Stage:
Why It Matters:
Recommended Action:

Rules:
- Only include unpaid clients.
- Paid clients must never appear.
- Overdue clients come before non-overdue clients.
- Higher days overdue means higher urgency.
- If an automated reminder has already been sent, do not recommend sending the same reminder again.
- Consider the client's current automated recovery stage.
- A client who is overdue with no automated reminder should be considered highly actionable.
- A client who has already received a final automated reminder should not simply be given another generic reminder.
- Do not call an overdue invoice "pending."
- Do not invent client information.
- Use the actual live records supplied.
- Keep every priority concise and specific.
- If fewer than 3 unpaid clients exist, show only the clients that actually exist.
- Do not generate email or WhatsApp content in this action.

REQUIRED LABELS for every PRIORITY block (exact spelling, exact colon, one per line, do not rename):
Client:
Company:
Amount Due:
Due Date:
Status:
Days Overdue:
Recovery Stage:
Why It Matters:
Recommended Action:

Do not use "Customer:", "Balance:", "Late By:", "Action:" or any other alternative wording.

━━━━━━━━━━━━━━━━━━━━

🎯 TODAY'S FOCUS

Give ONE concise sentence identifying the client that should be handled first and exactly why.

Do not say "send reminders to clients."
Name the actual priority and the reason.

Keep the entire response compact and decision-focused.
`;

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

        userPrompt = `Identify today's priorities using these live recovery cases: ${JSON.stringify(priorityClients)}.

Prioritize:
1. Overdue clients first.
2. Clients with the highest days overdue.
3. Clients where automated reminders have already been sent but payment is still pending.
4. Then other pending clients.

For every priority, explain the reason and the recommended next action.

Do not recommend repeating an automated reminder that has already been sent.

End with exactly one clear Next Best Action.
Use the exact Blink layout.`;

      } else if (action === "summarize" || action === "summarize_outstanding") {
        const pendingCount = activeClients.filter((c: any) => c.status !== 'Paid')?.length || 0;
        const overdueCount = activeClients.filter((c: any) => c.isOverdue === true).length;
        const computedTotal = activeClients.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

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

        systemPrompt += `
Follow this exact layout for Outstanding Summary:
🤖 Blink
📌 Outstanding Summary

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Complete breakdown of the current outstanding portfolio based on active unpaid records.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Outstanding Amount: ₹${computedTotal}
• Pending Clients: ${pendingCount}
• Overdue Clients: ${overdueCount}
• Paid Clients: ${paidClients.length}

━━━━━━━━━━━━━━━━━━━━━━
📈 Blink Insight
Cash flow requires active monitoring on overdue active accounts this week.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Review overdue clients to protect cash flow.

REQUIRED HEADINGS (do not rename, do not skip, do not reorder):
💡 Quick Summary
📌 Important Information
📈 Blink Insight
🎯 Next Best Action

Do not merge these headings or present them as a single paragraph.`;

        userPrompt = `Summarize the live outstanding payment portfolio.

Live data:
${JSON.stringify(activeClients)}

Include:
- Total outstanding amount
- Pending client count
- Overdue client count
- Paid client count
- Which clients have already received automated reminders
- Which overdue clients still need manual attention

Do not count paid clients as outstanding.

Do not recommend repeating an automated reminder that has already been sent.

End with one clear:
  Next Best Action

Choose the next action based on the live recovery state.`;

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

        systemPrompt += `
ESCALATION LADDER (follow exactly — computed from real reminder history):
Current stage: ${rewriteEscalation.stage}
Required tone: ${rewriteEscalation.tone}
Suggested channel to lead with: ${rewriteEscalation.suggestedChannel}
Reason: ${rewriteEscalation.reason}

Stage meanings:
- "first": friendly, informative, no pressure.
- "second": more direct, restate amount/due date, ask for expected payment date, suggest switching channel.
- "final": firm tone with a real deadline and a real consequence. No apologizing.
- "stalled": do not demand payment again — offer a payment plan/partial payment and ask what's blocking payment.

Follow this exact layout for Rewrite Reminder.

🤖 Blink
📌 Rewrite Reminder

━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Explain briefly what this rewritten reminder is designed to accomplish for the current recovery situation.

━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Client: ${targetClient.name}
• Amount Due: ₹${targetClient.amount}
• Due Date: ${targetClient.dueDate || 'N/A'}
• Status: ${targetClient.status || 'Pending'}
• Days Overdue: ${targetClient.daysOverdue || 0}
• Previous Automated Stage: ${targetClient.lastAutomatedReminderStage || 'None'}
• Selected Tone: Professional & Firm

━━━━━━━━━━━━━━━━━━━━
📝 REWRITTEN REMINDER

Write ONE complete rewritten payment reminder matching the ESCALATION LADDER stage above exactly.

Rules:
- Reflect the actual payment status and overdue duration.
- Match the required tone for the current stage — do not soften "final"/"stalled", do not escalate "first".
- If stage is "stalled", offer a payment plan/partial payment and ask what's blocking payment instead of repeating a demand.
- Keep it professional, concise and payment-focused.
- Do not call an overdue invoice "pending".
- Do not create a recovery reminder if the client is Paid.

Show:
Subject:
Email Body:

━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Explain briefly why this version is appropriate for the current recovery stage.

━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Give ONE clear next action for the owner.

REQUIRED HEADINGS (do not rename, do not skip, do not reorder):
💡 Quick Summary
📌 Important Information
📝 REWRITTEN REMINDER
✨ Blink Recommendation
🎯 Next Best Action

REQUIRED LABELS inside REWRITTEN REMINDER (exact spelling, exact colon):
Subject:
Email Body:
`;

        userPrompt = `Rewrite the payment reminder for this live recovery case:

${JSON.stringify({
  ...targetClient,
  reminderHistory: previousAutomatedReminders,
})}

Use the exact Rewrite Reminder layout.

The escalation stage has already been computed: "${rewriteEscalation.stage}" (tone: ${rewriteEscalation.tone}, suggested channel: ${rewriteEscalation.suggestedChannel}).
Write the rewritten reminder to match this exact stage — do not infer a different stage from the raw data.

Keep it professional, concise and payment-focused.

The response MUST contain these sections:
Quick Summary
Important Information
REWRITTEN REMINDER
Blink Recommendation
Next Best Action

Inside REWRITTEN REMINDER, provide:
Subject:
Email Body:
`;

      } else if (action === "overdue") {
        const overdueList = activeClients
          .filter((c: any) => c.isOverdue === true)
          .map((c: any) => ({ ...c, escalation: getEscalationStage(c) }));

        systemPrompt += `
Follow this exact layout for Find Overdue Clients.

 Blink
 Find Overdue Clients

━━━━━━━━━━━━━━━━━━━━━━
 Quick Summary
${overdueList.length} active client${overdueList.length === 1 ? "" : "s"} currently have overdue payments.

━━━━━━━━━━━━━━━━━━━━━━
 Important Information

CRITICAL RULE:
You MUST include EVERY overdue client supplied in the live data below.

Do NOT:
- omit any overdue client
- show only the highest-priority client
- summarize multiple clients into one
- combine clients
- invent clients

The number of PRIORITY blocks MUST exactly match the number of overdue clients supplied.

For EVERY overdue client, use this exact structure:

PRIORITY 1
Client:
Company:
Amount Due:
Due Date:
Status:
Days Overdue:
Recovery Stage:
Why It Matters:
Recommended Action:

PRIORITY 2
Client:
Company:
Amount Due:
Due Date:
Status:
Days Overdue:
Recovery Stage:
Why It Matters:
Recommended Action:

Continue PRIORITY 3, PRIORITY 4, PRIORITY 5, etc. until EVERY overdue client has been included.

Use the actual client data supplied. Never invent missing information.

━━━━━━━━━━━━━━━━━━━━━━
 Blink Recommendation
Identify the most important recovery opportunity after considering ALL overdue clients.

━━━━━━━━━━━━━━━━━━━━━━
 Next Best Action
Give ONE clear action the user should take next.

IMPORTANT:
The overdue client list is authoritative live dashboard data.
Every overdue client must appear in the response.

==================================================
OUTPUT FORMAT IS STRICT AND MUST NOT BE CHANGED
==================================================
Return ONLY the exact headings below, in this exact order:
Quick Summary
Important Information
PRIORITY 1 (and PRIORITY 2, PRIORITY 3, ... as needed)
Blink Recommendation
Next Best Action

Do not rename "Important Information" to anything else (no "Key Details", no "Overview", no "Summary of Clients").
Do not rename "PRIORITY" to anything else (no "Client 1", no "Case 1", no "Overdue Client").
The PRIORITY blocks MUST be located directly inside the Important Information section — never as a separate section, never after Blink Recommendation.
Do not switch to bullet-point-only formatting instead of the required PRIORITY blocks.
Do not use Markdown headings, bold text, or numbered lists in place of the required plain-text labels.

REQUIRED FIELD LABELS inside every PRIORITY block (exact spelling, exact colon, one per line, in this order):
Client:
Company:
Amount Due:
Due Date:
Status:
Days Overdue:
Recovery Stage:
Why It Matters:
Recommended Action:

Do not use "Customer:", "Balance:", "Late By:", "Action:" or any other alternative wording for these labels.
Do not add commentary before "Quick Summary" or after "Next Best Action".
`;

        userPrompt = `Find and prioritize all overdue clients from this live data:

${JSON.stringify(overdueList)}

Each client object includes a pre-computed "escalation" field (stage, tone, suggestedChannel, reason) — use it directly for that client's "Recovery Stage:" and "Recommended Action:" fields instead of guessing from raw history.

For clients at stage "stalled", the Recommended Action must NOT be another reminder — recommend a phone call, payment plan, or asking directly what's blocking payment.
For clients at stage "final", the Recommended Action must mention a real deadline/consequence.
Never recommend sending the same reminder tone twice in a row.

After the overdue list, provide:

Blink Recommendation
Explain the most important recovery opportunity.

Next Best Action
Give ONE clear action the user should take next.

Use the exact Blink layout.`;
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

      systemPrompt += `
Follow this exact layout for Individual Client Reminders:
🤖 Blink
📌 Generate Follow-up

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Tailored multi-channel reminder generated for active client ${client.name}.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Client: ${client.name}
• Company: ${client.company || 'N/A'}
• Amount Due: ₹${client.amount}
• Due Date: ${client.dueDate || 'N/A'}
• Status: ${client.status || 'Pending'}

━━━━━━━━━━━━━━━━━━━━━━
✉️ AI Email
Subject: Friendly Payment Reminder - Invoice Follow-up
Use the client's live payment status, overdue days, recovery state, and automated reminder history to write the appropriate recovery message.

Recovery-stage rules:
- If the client is Paid: do not write a payment recovery reminder.
- If no automated reminder has been sent and the payment is overdue: write the first recovery follow-up.
- If automated stage "first" was already sent: do not repeat the first reminder; write the next-stage follow-up if payment is still unpaid.
- If automated stage "follow-up" was already sent: do not repeat the same follow-up; write a stronger manual recovery message.
- If automated stage "final" was already sent: do not write another generic reminder; use an escalation-oriented message only when appropriate.

Never pretend that no reminder was sent when reminder history shows one was already sent.
Never call an overdue invoice "pending."
The message must reflect the client's current recovery stage and should not restart the recovery sequence.

━━━━━━━━━━━━━━━━━━━━━━
💬 AI WhatsApp
Hi ${client.name}! Just following up on the pending invoice of ₹${client.amount}. Let's get this settled this week. Thanks!

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Send this reminder via email and WhatsApp to ensure visibility.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Send the reminder today.`;

      userPrompt = `Write a professional follow-up message using live active client data: ${JSON.stringify(client)}. Use the exact Blink layout.`;
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