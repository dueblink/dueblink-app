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

    let systemPrompt = `You are Blink, the DueBlink AI Recovery Assistant. 

Strict Layout Rules:
- Return ONLY plain text.
- No JSON.
- No Markdown.
- No code blocks.
- No streaming metadata.
- Every label must be on its own line.
- Never combine fields on one line.
- Keep recommendations under 3 lines.
- Never output long paragraphs.

You must follow this exact layout for every response:

Blink

<Action Name>

━━━━━━━━━━━━━━━━━━━━━━

Quick Summary

<1–2 lines>

━━━━━━━━━━━━━━━━━━━━━━

Client Information

Client
<Value>

Company
<Value>

Amount Due
₹<Amount>

Due Date
<Value>

Status
<Value>

Email
<Value>

━━━━━━━━━━━━━━━━━━━━━━

Blink Recommendation

<2–3 lines>

━━━━━━━━━━━━━━━━━━━━━━

Next Best Action

<One clear action>

━━━━━━━━━━━━━━━━━━━━━━

Additional Insights

Days Overdue
<Value>

Previous Reminders
<Value>

Recovery Chance
<Value>

Priority Level
<Value>`;

    let userPrompt = "";

    // 1. Handle Dashboard Actions
    if (action) {
      if (action === "welcome_pro") {
        systemPrompt += "\nWelcome the user to DueBlink Pro enthusiastically using the exact Blink layout.";
        userPrompt = "Provide a short, welcoming overview for the Pro user using the exact Blink layout.";
      } else if (action === "recommend") {
        systemPrompt += "\nAnalyze the clients. Output your response using the exact Blink layout.";
        userPrompt = `Analyze these clients: ${JSON.stringify(clients)}. Use the exact Blink layout.`;
      } else if (action === "summarize" || action === "summarize_outstanding") {
        systemPrompt += "\nProvide a payment overview. Output your response using the exact Blink layout.";
        userPrompt = `Summarize these clients' outstanding payments: ${JSON.stringify(clients)}. Total outstanding is ₹${total}. Use the exact Blink layout.`;
      } else if (action === "overdue") {
        systemPrompt += "\nList overdue clients and stats following the exact Blink layout.";
        userPrompt = `List overdue clients and stats based on: ${JSON.stringify(clients)}. Use the exact Blink layout.`;
      } else if (action === "priorities") {
        systemPrompt += "\nIdentify today's priorities following the exact Blink layout.";
        userPrompt = `Identify today's priorities based on: ${JSON.stringify(clients)}. Use the exact Blink layout.`;
      } else if (action === "rewrite") {
        systemPrompt += "\nRewrite the payment reminder concisely following the exact Blink layout.";
        userPrompt = `Rewrite a payment reminder for this client: ${JSON.stringify(clients?.[0] || client || {})}. Use the exact Blink layout.`;
      }
    } 
    // 2. Handle Individual Client Reminders
    else if (client) {
      systemPrompt += `
        Generate a professional recovery message for:
        - Client: ${client.name} (${client.company})
        - Amount: ₹${client.amount}
        - Due Date: ${client.dueDate || 'N/A'}
        - Status: ${client.status || 'Pending'}
        - Email: ${client.email || 'N/A'}
        - History Count: ${history?.length || 0}
        - Tone: ${client.reminderTemplate || 'Professional'}
        
        Instructions:
        1. Follow the exact Blink layout.
        2. Never combine text into awkward vertical single-word lines.`;
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