import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize the OpenAI provider
const openai = createOpenAI({
  apiKey: process.env.DASHBOARD_PRO_API_KEY,
});

export async function POST(req: Request) {
  console.log("--- Pro Recovery Assistant Route Triggered (Streaming) ---");

  try {
    const rawBody = await req.json();
    
    // The 'ai' SDK puts your data inside the 'prompt' field.
    const body = typeof rawBody.prompt === 'string' 
      ? JSON.parse(rawBody.prompt) 
      : rawBody;

    console.log("DEBUG - Parsed body:", body); 

    const { client, history, action, clients, total } = body;

    let systemPrompt = `You are Blink, the DueBlink AI-powered payment recovery assistant. You are a premium AI teammate, not a chatbot.

DESIGN PRINCIPLE:
- Every response must be visual, structured, scannable, and understood in under 10 seconds.
- Return ONLY plain text. No JSON, no Markdown asterisks (**), no code blocks, no streaming metadata.
- Every label and field must be strictly separated. Never combine labels and values into a single sentence or paragraph.
- Keep recommendations under 3 lines. Avoid long paragraphs or walls of text.
- Include appropriate icons and clean emojis for headers and info fields.`;

    let userPrompt = "";

    // 1. Handle Dashboard Actions
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
        systemPrompt += `
Follow this exact layout for Generate Follow-up:
🤖 Blink
📌 Generate Follow-up

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Targeted recovery strategy and tailored multi-channel follow-up generated.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Client: ${clients?.[0]?.name || client?.name || 'Selected Client'}
• Company: ${clients?.[0]?.company || client?.company || 'N/A'}
• Amount Due: ₹${clients?.[0]?.amount || client?.amount || '0'}
• Due Date: ${clients?.[0]?.dueDate || client?.dueDate || 'N/A'}
• Status: ${clients?.[0]?.status || client?.status || 'Pending'}

━━━━━━━━━━━━━━━━━━━━━━
✉️ AI Email
Subject: Friendly Payment Reminder - Invoice Follow-up
Hi ${clients?.[0]?.name || client?.name || 'there'}, hope you are doing well. This is a gentle reminder regarding your pending invoice of ₹${clients?.[0]?.amount || client?.amount || '0'}. Please let us know when we can expect the transfer. Thank you!

━━━━━━━━━━━━━━━━━━━━━━
💬 AI WhatsApp
Hi ${clients?.[0]?.name || client?.name || 'there'}! Just following up on the pending invoice of ₹${clients?.[0]?.amount || client?.amount || '0'}. Let's get this settled this week. Thanks!

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Send the personalized email and WhatsApp follow-up today to secure prompt payment.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Send the reminder today.`;

        userPrompt = `Analyze these clients for follow-up: ${JSON.stringify(clients)}. Use the exact Blink layout.`;

      } else if (action === "priorities") {
        systemPrompt += `
Follow this exact layout for Today's Priorities:
🤖 Blink
📌 Today's Priorities

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Active client portfolio analyzed to isolate today's most urgent collection targets.

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

        userPrompt = `Identify today's priorities based on: ${JSON.stringify(clients)}. Use the exact Blink layout.`;

      } else if (action === "summarize" || action === "summarize_outstanding") {
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
• Pending Clients: ${clients?.length || 0}
• Overdue Clients: ${clients?.filter((c:any) => c.status === 'Overdue')?.length || 0}
• Recovery Rate: 85%
• Recovered This Month: ₹12,400

━━━━━━━━━━━━━━━━━━━━━━
📈 Blink Insight
Cash flow is healthy, but pending accounts require attention this week.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Review overdue clients to protect cash flow.`;

        userPrompt = `Summarize these clients' outstanding payments: ${JSON.stringify(clients)}. Total outstanding is ₹${total}. Use the exact Blink layout.`;

      } else if (action === "rewrite") {
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
Dear ${clients?.[0]?.name || client?.name || 'Client'}, this is a formal notification that your account balance of ₹${clients?.[0]?.amount || client?.amount || '0'} is currently pending. Kindly process the payment at your earliest convenience.

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Use a professional tone for active accounts to preserve client relationships while ensuring priority.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Copy the rewritten message and send it to the client.`;

        userPrompt = `Rewrite a payment reminder for this client: ${JSON.stringify(clients?.[0] || client || {})}. Use the exact Blink layout.`;

      } else if (action === "overdue") {
        systemPrompt += `
Follow this exact layout for Find Overdue Clients:
🤖 Blink
📌 Find Overdue Clients

━━━━━━━━━━━━━━━━━━━━━━
💡 Quick Summary
Filtered list displaying all accounts past their initial payment deadline.

━━━━━━━━━━━━━━━━━━━━━━
📌 Important Information
• Client 1: ${clients?.[0]?.name || 'N/A'} - ₹${clients?.[0]?.amount || '0'}
• Client 2: ${clients?.[1]?.name || 'N/A'} - ₹${clients?.[1]?.amount || '0'}
• Client 3: ${clients?.[2]?.name || 'N/A'} - ₹${clients?.[2]?.amount || '0'}

━━━━━━━━━━━━━━━━━━━━━━
✨ Blink Recommendation
Contact the highest-priority overdue client first to accelerate cash recovery.

━━━━━━━━━━━━━━━━━━━━━━
🎯 Next Best Action
Generate Follow-up for the top overdue account.`;

        userPrompt = `List overdue clients and suggest strategies based on: ${JSON.stringify(clients)}. Use the exact Blink layout.`;
      }
    } 
    // 2. Handle Individual Client Reminders
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
• Company: ${client.company}
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

      userPrompt = `Write a ${client.reminderTemplate || 'Professional'} follow-up message using the exact Blink layout.`;
    } 
    // 3. Reject if no valid action/client is found
    else {
      console.log("DEBUG - No valid action or client found in body");
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 4. Perform Streaming Response
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Use text stream response instead of data stream response to eliminate protocol wrappers
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error("Critical Assistant Error:", error);
    return NextResponse.json({ error: "Failed to process assistant request" }, { status: 500 });
  }
}