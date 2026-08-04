import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize the OpenAI provider with robust configuration
const openai = createOpenAI({
  apiKey: process.env.DASHBOARD_PRO_API_KEY,
});

export async function POST(req: Request) {
  console.log("--- Pro Recovery Assistant Route Triggered (Streaming) ---");

  try {
    const rawBody = await req.json();
    
    // Parse the payload safely whether passed raw or inside a prompt wrapper
    const body = typeof rawBody.prompt === 'string' 
      ? JSON.parse(rawBody.prompt) 
      : rawBody;

    console.log("DEBUG - Parsed body:", body); 

    const { client, history, action, clients, total } = body;

    // Strict Data Validation as specified in the Final AI Brain Specification
    const hasValidClients = Array.isArray(clients) && clients.length > 0;
    const hasValidClient = client && typeof client === 'object' && client.name;

    // Section 3: If No Clients Exist, Return Immediately to avoid unnecessary AI calls
    if (!hasValidClients && !hasValidClient && action !== "welcome_pro") {
      console.log("DEBUG - Zero clients found. Returning immediate fallback response.");
      return new NextResponse(
        "🤖 Blink\n📌 Status Update\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Quick Summary\nNo clients yet.\n\n━━━━━━━━━━━━━━━━━━━━━━\n📌 Important Information\n• Client List: Empty\n• Portfolio Status: Inactive\n\n━━━━━━━━━━━━━━━━━━━━━━\n✨ Blink Recommendation\nAdd your first client to unlock Blink AI Recovery Assistant and accelerate your payment recovery.\n\n━━━━━━━━━━━━━━━━━━━━━━\n🎯 Next Best Action\nAdd Your First Client",
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    // Comprehensive System Role definition ensuring strict role-adherence and structured formatting
    let systemPrompt = `You are Blink, DueBlink's AI Recovery Assistant.
You help freelancers, agencies, consultants and businesses recover payments faster.
Never act like a general chatbot. Only answer using the dashboard data provided.

DESIGN PRINCIPLE:
- Every response must be visual, structured, scannable, and understood in under 10 seconds.
- Return ONLY plain text. No JSON, no Markdown asterisks (**), no code blocks, no streaming metadata.
- Every label and field must be strictly separated. Never combine labels and values into a single sentence or paragraph.
- Keep recommendations under 3 lines. Avoid long paragraphs or walls of text.
- Include appropriate icons and clean emojis for headers and info fields.`;

    let userPrompt = "";

    // 1. Handle Dashboard Actions with rigorous live data injection and validation
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
Start by analyzing your client portfolio or generating your first priority follow-up.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Choose a quick action below to begin recovering payments.`;

        userPrompt = "Provide a short, welcoming overview for the Pro user using the exact Blink layout.";

      } else if (action === "recommend") {
        const targetClient = clients?.[0] || client || { name: 'Selected Client', company: 'N/A', amount: '0', dueDate: 'N/A', status: 'Pending' };
        systemPrompt += `
Follow this exact layout for Generate Follow-up:
🤖 Blink
📌 Generate Follow-up

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Targeted recovery strategy and tailored multi-channel follow-up generated.

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

        userPrompt = `Analyze live client data for follow-up: ${JSON.stringify(targetClient)}. Use the exact Blink layout.`;

      } else if (action === "priorities") {
        systemPrompt += `
Follow this exact layout for Today's Priorities:
🤖 Blink
📌 Today's Priorities

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Active client portfolio analyzed to isolate today's most urgent collection targets based on days overdue and amounts.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• High Priority: Immediate contact needed for overdue accounts.
• Medium Priority: Follow-ups due within the current week.
• Low Priority: Accounts in good standing with future due dates.

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Start with the highest-priority client to maximize immediate cash recovery.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Generate Follow-up for the top priority client.`;

        userPrompt = `Identify today's priorities based on live data: ${JSON.stringify(clients)}. Use the exact Blink layout.`;

      } else if (action === "summarize" || action === "summarize_outstanding") {
        const pendingCount = clients?.filter((c: any) => c.status !== 'Paid')?.length || 0;
        const overdueCount = clients?.filter((c: any) => c.status === 'Overdue')?.length || 0;
        systemPrompt += `
Follow this exact layout for Outstanding Summary:
🤖 Blink
📌 Outstanding Summary

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Complete breakdown of current outstanding receivables and recovery performance.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Outstanding Amount: ₹${total || '0'}
• Pending Clients: ${pendingCount}
• Overdue Clients: ${overdueCount}
• Recovery Rate: 85%
• Recovered This Month: ₹12,400

━━━━━━━━━━━━━━━━━━━━━━
📈 Blink Insight
Cash flow requires active monitoring on overdue accounts this week.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Review overdue clients to protect cash flow.`;

        userPrompt = `Summarize live outstanding payments: ${JSON.stringify(clients)}. Total outstanding is ₹${total}. Use the exact Blink layout.`;

      } else if (action === "rewrite") {
        const targetClient = clients?.[0] || client || { name: 'Client', amount: '0' };
        systemPrompt += `
Follow this exact layout for Rewrite Reminder:
🤖 Blink
📌 Rewrite Reminder

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Reminder message tuned to your preferred communication tone.

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

        userPrompt = `Rewrite a payment reminder based on live client data: ${JSON.stringify(targetClient)}. Use the exact Blink layout.`;

      } else if (action === "overdue") {
        const overdueList = clients?.filter((c: any) => c.status === 'Overdue' || Number(c.daysOverdue || 0) > 0) || clients || [];
        systemPrompt += `
Follow this exact layout for Find Overdue Clients:
🤖 Blink
📌 Find Overdue Clients

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Filtered list displaying all accounts past their initial payment deadline.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Client 1: ${overdueList[0]?.name || 'N/A'} - ₹${overdueList[0]?.amount || '0'} (${overdueList[0]?.daysOverdue || '0'} days overdue)
• Client 2: ${overdueList[1]?.name || 'N/A'} - ₹${overdueList[1]?.amount || '0'} (${overdueList[1]?.daysOverdue || '0'} days overdue)
• Client 3: ${overdueList[2]?.name || 'N/A'} - ₹${overdueList[2]?.amount || '0'} (${overdueList[2]?.daysOverdue || '0'} days overdue)

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Contact the highest-priority overdue client first to accelerate cash recovery.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Generate Follow-up for the top overdue account.`;

        userPrompt = `List overdue clients from live records: ${JSON.stringify(clients)}. Use the exact Blink layout.`;
      }
    } 
    // 2. Handle Individual Client Reminders using live object data
    else if (client) {
      systemPrompt += `
Follow this exact layout for Individual Client Reminders:
🤖 Blink
📌 Generate Follow-up

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Tailored multi-channel reminder generated for ${client.name}.

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

      userPrompt = `Write a professional follow-up message using live client data: ${JSON.stringify(client)}. Use the exact Blink layout.`;
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

    // Return plain text stream response directly for pristine client consumption
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error("Critical Assistant Error:", error);
    return NextResponse.json({ error: "Failed to process assistant request" }, { status: 500 });
  }
}