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
You must NEVER respond like ChatGPT, never write long essays, never use markdown asterisks (**), and never dump raw unformatted text.
Always speak in short sentences, be friendly, professional, data-driven, and concise.
CRITICAL FORMATTING RULE: Every single point, statistic, or list item MUST be on its own separate new line. Never combine multiple points into a single paragraph or block of text.
Every response must answer three core questions clearly, each on a new line:
1. What did I find?
2. What do I recommend?
3. What should you do next?`;

    let userPrompt = "";

    // 1. Handle Dashboard Actions
    if (action) {
      if (action === "welcome_pro") {
        systemPrompt += "\nWelcome the user to DueBlink Pro enthusiastically in short sentences. Explain that Blink is ready to automate follow-ups and recover pending payments instantly. Put each point on a separate line.";
        userPrompt = "Give a short, warm, exciting welcome message to a freelancer or agency owner who just upgraded to DueBlink Pro!";
      } else if (action === "recommend") {
        systemPrompt += "\nAnalyze the following clients and provide a short summary, a specific recommendation in 2-4 short sentences, and end with one recommended action. Ensure every single item, statistic, or point is isolated on its own separate line.";
        userPrompt = `Analyze these clients: ${JSON.stringify(clients)}. Format every individual data point, insight, and final action on a separate new line.`;
      } else if (action === "summarize" || action === "summarize_outstanding") {
        systemPrompt += "\nSummarize the total outstanding payments with brief stats, a short cash flow insight in short sentences, and a clear next recommended action. Format every stat and point strictly on its own separate line.";
        userPrompt = `Summarize these clients' outstanding payments: ${JSON.stringify(clients)}. Total outstanding is ₹${total}. Format every stat or point on a separate line.`;
      } else if (action === "overdue") {
        systemPrompt += "\nList overdue clients briefly, show amounts and delays, and give a clear recommended action. Every client entry, stat, and recommendation must be on its own separate new line.";
        userPrompt = `List overdue clients and suggest follow-up strategies based on these clients: ${JSON.stringify(clients)}. Ensure every item is on a separate line.`;
      } else if (action === "priorities") {
        systemPrompt += "\nIdentify top priority clients needing attention today based on amount and delay. Speak in short sentences and provide a clear final recommendation. Format each priority item on its own separate line.";
        userPrompt = `What are today's priorities based on these clients: ${JSON.stringify(clients)}? Format every detail on a separate line.`;
      } else if (action === "rewrite") {
        systemPrompt += "\nYou are Blink. Rewrite the payment reminder concisely and professionally without markdown or long paragraphs. Keep lines distinct and separate.";
        userPrompt = `Rewrite a payment reminder to be more professional and persuasive for this client: ${JSON.stringify(clients?.[0] || client || {})}.`;
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
        1. If Days Overdue > 30, emphasize urgency and business impact using short sentences.
        2. If History Count > 2, suggest a call or alternative action.
        3. Return clean, professional text without markdown or raw formatting. Keep distinct segments on separate lines.`;
      userPrompt = `Write a ${client.reminderTemplate || 'Friendly'} follow-up message.`;
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