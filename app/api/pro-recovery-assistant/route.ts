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
    // Since you sent it as a JSON.stringify string, we parse it again here.
    const body = typeof rawBody.prompt === 'string' 
      ? JSON.parse(rawBody.prompt) 
      : rawBody;

    console.log("DEBUG - Parsed body:", body); 

    const { client, history, action, clients, total } = body;

    let systemPrompt = "You are the DueBlink Recovery Assistant. Be professional, data-driven, and concise.";
    let userPrompt = "";

    // 1. Handle Dashboard Actions
    if (action) {
      if (action === "recommend") {
        systemPrompt += "\nAnalyze the following clients and recommend the next best action. Identify urgent follow-ups.";
        userPrompt = `Analyze these clients: ${JSON.stringify(clients)}. Suggest follow-up priorities.`;
      } else if (action === "summarize" || action === "summarize_outstanding") {
        systemPrompt += "\nSummarize the total outstanding payments and provide a high-level cash flow insight.";
        userPrompt = `Summarize these clients' outstanding payments: ${JSON.stringify(clients)}. Total outstanding is ₹${total}.`;
      } else if (action === "overdue") {
        systemPrompt += "\nIdentify all clients who are overdue by more than 30 days and suggest a 'Firm' tone follow-up strategy.";
        userPrompt = `List overdue clients and suggest follow-up strategies: ${JSON.stringify(clients)}.`;
      } 
      // NEW ACTIONS CONNECTED TO AI
      else if (action === "priorities") {
        systemPrompt += "\nAnalyze all clients and identify the top 3 most critical clients that require immediate action today based on amount and delay.";
        userPrompt = `What are today's priorities based on these clients: ${JSON.stringify(clients)}?`;
      } else if (action === "rewrite") {
        systemPrompt += "\nYou are an expert communication editor. Rewrite a payment reminder for a client to be more persuasive and professional.";
        userPrompt = `Rewrite a payment reminder to be more professional and persuasive for a client: ${JSON.stringify(clients[0])}.`;
      }
    } 
    // 2. Handle Individual Client Reminders
    else if (client) {
      systemPrompt += `
        Generate a professional recovery message for:
        - Client: ${client.name} (${client.company})
        - Amount: ₹${client.amount}
        - History Count: ${history?.length || 0}
        - Tone: ${client.reminderTemplate || 'Friendly'}
        
        Instructions:
        1. If Days Overdue > 30, emphasize urgency and business impact.
        2. If History Count > 2, suggest a call or alternative action.
        3. Return ONLY the email body text.`;
      userPrompt = `Write a ${client.reminderTemplate || 'Friendly'} follow-up email.`;
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

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error("Critical Assistant Error:", error);
    return NextResponse.json({ error: "Failed to process assistant request" }, { status: 500 });
  }
}