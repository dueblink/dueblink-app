import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

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
    const rawBody = await req.json();
    
    // Parse the payload safely whether passed raw or inside a prompt wrapper
    const body = typeof rawBody.prompt === 'string' 
      ? JSON.parse(rawBody.prompt) 
      : rawBody;

    console.log("DEBUG - Parsed body:", body); 

    let { client, history, action, clients, total } = body;

    // Strict Server-Side Validation: Filter out invalid, empty, or deleted records from live data
    if (Array.isArray(clients)) {
      clients = clients.filter((c: any) => {
        const isValidRecord = c && typeof c === 'object' && Object.keys(c).length > 0;
        const isNotDeleted = c.status !== 'Deleted' && c.isDeleted !== true;
        const hasName = Boolean(c.name && c.name.trim() !== '');
        return isValidRecord && isNotDeleted && hasName;
      });
    }

    // Separate active recovery cases from paid clients for Blink AI workflows
    const activeClients = clients?.filter((c: any) => c.status !== 'Paid') || [];
    const paidClients = clients?.filter((c: any) => c.status === 'Paid') || [];

    const hasActiveClients = activeClients.length > 0;
    const hasValidClient = client && typeof client === 'object' && client.name && client.status !== 'Deleted' && client.status !== 'Paid';

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

DESIGN PRINCIPLE:
- Every response must be visual, structured, scannable, and understood in under 10 seconds.
- Return ONLY plain text. No JSON, no Markdown asterisks (**), no code blocks, no streaming metadata.
- Every label and field must be strictly separated. Never combine labels and values into a single sentence or paragraph.
- Keep recommendations under 3 lines. Avoid long paragraphs or walls of text.
- Include appropriate icons and clean emojis for headers and info fields.`;

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
        const targetClient = activeClients?.[0] || client || { name: 'Selected Client', company: 'N/A', amount: '0', dueDate: 'N/A', status: 'Pending' };
        systemPrompt += `
Follow this exact layout for Generate Follow-up:
🤖 Blink
📌 Generate Follow-up

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Targeted recovery strategy and tailored multi-channel follow-up generated from active live records.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Client: ${targetClient.name}
• Company: ${targetClient.company || 'N/A'}
• Amount Due: ₹${targetClient.amount}
• Due Date: ${targetClient.dueDate || 'N/A'}
• Status: ${targetClient.status || 'Pending'}

━━━━━━━━━━━━━━━━━━━━━━
✉️ AI Email
Subject: Friendly Payment Reminder - Invoice Follow-up
Hi ${targetClient.name}, hope you are doing well. This is a gentle reminder regarding your pending invoice of ₹${targetClient.amount}. Please let us know when we can expect the transfer. Thank you!

━━━━━━━━━━━━━━━━━━━━━━
💬 AI WhatsApp
Hi ${targetClient.name}! Just following up on the pending invoice of ₹${targetClient.amount}. Let's get this settled this week. Thanks!

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Send the personalized email and WhatsApp follow-up today to secure prompt payment.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Send the reminder today.`;

        userPrompt = `Analyze active live client data for follow-up: ${JSON.stringify(targetClient)}. Use the exact Blink layout.`;

      } else if (action === "priorities") {
        systemPrompt += `
Follow this exact layout for Today's Priorities:
🤖 Blink
📌 Today's Priorities

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Active unpaid client portfolio analyzed in real-time, excluding paid accounts, to isolate today's most urgent collection targets.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• High Priority: Immediate contact needed for overdue active accounts.
• Medium Priority: Follow-ups due within the current week.
• Low Priority: Active accounts in good standing with future due dates.

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Start with the highest-priority unpaid client from your live portfolio to maximize immediate cash recovery.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Generate Follow-up for the top priority client.`;

        userPrompt = `Identify today's priorities based on active unpaid live data: ${JSON.stringify(activeClients)}. Use the exact Blink layout.`;

      } else if (action === "summarize" || action === "summarize_outstanding") {
        const pendingCount = activeClients.filter((c: any) => c.status !== 'Paid')?.length || 0;
        const overdueCount = activeClients.filter((c: any) => c.status === 'Overdue' || Number(c.daysOverdue || 0) > 0)?.length || 0;
        const computedTotal = activeClients.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

        systemPrompt += `
Follow this exact layout for Outstanding Summary:
🤖 Blink
📌 Outstanding Summary

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Complete breakdown of current outstanding receivables and recovery performance based on active unpaid records.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Outstanding Amount: ₹${computedTotal}
• Pending Clients: ${pendingCount}
• Overdue Clients: ${overdueCount}
• Recovery Rate: 85%
• Recovered This Month: ₹12,400

━━━━━━━━━━━━━━━━━━━━━━
📈 Blink Insight
Cash flow requires active monitoring on overdue active accounts this week.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Review overdue clients to protect cash flow.`;

        userPrompt = `Summarize live outstanding payments excluding paid accounts: ${JSON.stringify(activeClients)}. Total active outstanding is ₹${computedTotal}. Use the exact Blink layout.`;

      } else if (action === "rewrite") {
        const targetClient = activeClients?.[0] || client || { name: 'Client', amount: '0' };
        systemPrompt += `
Follow this exact layout for Rewrite Reminder:
🤖 Blink
📌 Rewrite Reminder

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Reminder message tuned to your preferred communication tone using active live client records.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Current Reminder: Standard payment follow-up
• Selected Tone: Professional & Firm

━━━━━━━━━━━━━━━━━━━━━━
📝 Preview
Dear ${targetClient.name}, this is a formal notification that your account balance of ₹${targetClient.amount} is currently pending. Kindly process the payment at your earliest convenience.

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Use a professional tone for active accounts to preserve client relationships while ensuring priority.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Copy the rewritten message and send it to the client.`;

        userPrompt = `Rewrite a payment reminder based on active live client data: ${JSON.stringify(targetClient)}. Use the exact Blink layout.`;

      } else if (action === "overdue") {
        const overdueList = activeClients.filter((c: any) => c.status === 'Overdue' || Number(c.daysOverdue || 0) > 0);
        systemPrompt += `
Follow this exact layout for Find Overdue Clients:
🤖 Blink
📌 Find Overdue Clients

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Filtered list displaying all active accounts past their initial payment deadline based on live records.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Client 1: ${overdueList[0]?.name || 'N/A'} - ₹${overdueList[0]?.amount || '0'} (${overdueList[0]?.daysOverdue || '0'} days overdue)
• Client 2: ${overdueList[1]?.name || 'N/A'} - ₹${overdueList[1]?.amount || '0'} (${overdueList[1]?.daysOverdue || '0'} days overdue)
• Client 3: ${overdueList[2]?.name || 'N/A'} - ₹${overdueList[2]?.amount || '0'} (${overdueList[2]?.daysOverdue || '0'} days overdue)

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Contact the highest-priority overdue unpaid client first to accelerate cash recovery.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Generate Follow-up for the top overdue account.`;

        userPrompt = `List overdue active clients from live records: ${JSON.stringify(activeClients)}. Use the exact Blink layout.`;
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
Hi ${client.name}, following up on your invoice for ₹${client.amount}. Please let us know when payment will be processed.

━━━━━━━━━━━━━━━━━━━━━━
💬 AI WhatsApp
Hi ${client.name}! Checking in on the ₹${client.amount} pending invoice. Thanks!

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
      temperature: 0.7,
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