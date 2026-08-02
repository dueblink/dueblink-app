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
CRITICAL FORMATTING INSTRUCTIONS & LAYOUT RULES:
- NEVER respond like ChatGPT, never write long essays or paragraphs, never use markdown asterisks (**), and never output raw unformatted text blocks.
- Every single piece of data, heading, stat, or item MUST be strictly separated onto its own individual new line using line breaks.
- Strict layout adherence required for every response:
  1. Action Name (e.g., Generate Follow-up, Outstanding Summary, etc.)
  2. Quick Summary (1-2 lines maximum overview)
  3. Client Information (Each detail on its own line: Client name, Company name, Amount Due, Due Date, Status, Email)
  4. Blink Recommendation (Short, 2-3 lines max recommendation)
  5. Next Best Action (One clear actionable step)
  6. Additional Insights (Optional: Days Overdue, Previous Reminders, Recovery Chance, Priority Level)
- Keep sentences extremely short, concise, data-driven, and easy to scan within seconds.`;

    let userPrompt = "";

    // 1. Handle Dashboard Actions
    if (action) {
      if (action === "welcome_pro") {
        systemPrompt += "\nWelcome the user to DueBlink Pro enthusiastically using short, distinct lines. Format every phrase on a new line following the required Blink layout.";
        userPrompt = "Give a short, warm, exciting welcome message for an upgraded Pro user. Format strictly line-by-line following the Blink layout.";
      } else if (action === "recommend") {
        systemPrompt += "\nAnalyze the clients. Output your response strictly using separate lines following the exact Blink layout: Action Name, Quick Summary, Client Information, Blink Recommendation, Next Best Action, and Additional Insights.";
        userPrompt = `Analyze these clients: ${JSON.stringify(clients)}. Format strictly line-by-line following the Blink layout with no paragraph blocks.`;
      } else if (action === "summarize" || action === "summarize_outstanding") {
        systemPrompt += "\nProvide a payment overview. Output your response strictly on separate lines following the exact Blink layout: Action Name, Quick Summary, Client Information/Overview stats, Blink Recommendation, and Next Best Action.";
        userPrompt = `Summarize these clients' outstanding payments: ${JSON.stringify(clients)}. Total outstanding is ₹${total}. Format line-by-line following the Blink layout.`;
      } else if (action === "overdue") {
        systemPrompt += "\nList overdue clients and stats. Output strictly line-by-line following the exact Blink layout with distinct fields for each section.";
        userPrompt = `List overdue clients and suggest strategies based on: ${JSON.stringify(clients)}. Format line-by-line following the Blink layout.`;
      } else if (action === "priorities") {
        systemPrompt += "\nIdentify today's priorities. Output strictly line-by-line following the exact Blink layout for Action Name, Quick Summary, Client Information, Blink Recommendation, and Next Best Action.";
        userPrompt = `What are today's priorities based on: ${JSON.stringify(clients)}? Format line-by-line following the Blink layout.`;
      } else if (action === "rewrite") {
        systemPrompt += "\nRewrite the payment reminder concisely. Output strictly line-by-line following the exact Blink layout.";
        userPrompt = `Rewrite a payment reminder for this client: ${JSON.stringify(clients?.[0] || client || {})}. Format line-by-line following the Blink layout.`;
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
        1. Output strictly line-by-line.
        2. Follow the exact Blink layout: Action Name, Quick Summary, Client Information, Blink Recommendation, Next Best Action, and Additional Insights.
        3. Never combine text into paragraphs.`;
      userPrompt = `Write a ${client.reminderTemplate || 'Professional'} follow-up message with structured line-by-line sections following the Blink layout.`;
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