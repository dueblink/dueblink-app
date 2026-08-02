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
- Do NOT output every word or character on a separate line. Write in clean, normal flowing sentences grouped into distinct sections.
- Never write long essays or paragraphs, and never use markdown asterisks (**).
- Use clear section titles followed by standard spacing and text:
  Action Name: [Name]
  Quick Summary: [1-2 sentences overview]
  Client Information:
  - Client: [Name]
  - Company: [Company]
  - Amount Due: [Amount]
  - Due Date: [Date]
  - Status: [Status]
  - Email: [Email]
  Blink Recommendation: [2-3 sentences recommendation]
  Next Best Action: [1 clear action step]
  Additional Insights:
  - Days Overdue: [Days]
  - Previous Reminders: [Count]
  - Recovery Chance: [Chance]
  - Priority Level: [Level]`;

    let userPrompt = "";

    // 1. Handle Dashboard Actions
    if (action) {
      if (action === "welcome_pro") {
        systemPrompt += "\nWelcome the user to DueBlink Pro enthusiastically using short, clean paragraphs following the Blink layout.";
        userPrompt = "Give a short, warm, exciting welcome message for an upgraded Pro user following the Blink layout.";
      } else if (action === "recommend") {
        systemPrompt += "\nAnalyze the clients. Output your response using the exact Blink layout with natural sentence structure.";
        userPrompt = `Analyze these clients: ${JSON.stringify(clients)}. Follow the exact Blink section format.`;
      } else if (action === "summarize" || action === "summarize_outstanding") {
        systemPrompt += "\nProvide a payment overview. Output your response using the exact Blink layout with natural sentence structure.";
        userPrompt = `Summarize these clients' outstanding payments: ${JSON.stringify(clients)}. Total outstanding is ₹${total}. Follow the exact Blink section format.`;
      } else if (action === "overdue") {
        systemPrompt += "\nList overdue clients and stats following the exact Blink layout.";
        userPrompt = `List overdue clients and suggest strategies based on: ${JSON.stringify(clients)}. Follow the exact Blink section format.`;
      } else if (action === "priorities") {
        systemPrompt += "\nIdentify today's priorities following the exact Blink layout.";
        userPrompt = `What are today's priorities based on: ${JSON.stringify(clients)}? Follow the exact Blink section format.`;
      } else if (action === "rewrite") {
        systemPrompt += "\nRewrite the payment reminder concisely following the exact Blink layout.";
        userPrompt = `Rewrite a payment reminder for this client: ${JSON.stringify(clients?.[0] || client || {})}. Follow the exact Blink section format.`;
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
        1. Follow the exact Blink layout with clean sentence structure.
        2. Never combine text into awkward vertical single-word lines.`;
      userPrompt = `Write a ${client.reminderTemplate || 'Professional'} follow-up message with structured sections following the Blink layout.`;
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