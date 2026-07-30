import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { type NextRequest, NextResponse } from 'next/server';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not defined in environment variables.");
    }

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        email_subject: z.string(),
        email_body: z.string(),
        whatsapp_message: z.string(),
        sms_text: z.string(),
        psychology_note: z.string(),
      }),
      prompt: `
        You are an expert Payment Recovery Specialist for freelancers. 
        Your goal is to recover payments quickly while maintaining great client relationships.
        
        Details:
        - Client Name: ${body.clientName}
        - Amount Due: ${body.currency} ${body.amount}
        - Days Overdue: ${body.daysOverdue || '7'} days
        - Invoice Reference: ${body.invoiceRef || 'Pending'}
        - Tone Preference: ${body.tone || 'professional'}
        
        Tone Guidelines:
        - 'gentle': Use warm, polite, and helpful language. Assume the client simply forgot.
        - 'professional': Use formal, direct, and objective language. Focus on the agreement.
        - 'firm': Use urgent, clear, and assertive language. Mention the impact of the delay on operations.

        Output Rules:
        - Email Subject: Professional, clear, includes invoice number.
        - Email Body: Keep under 150 words. Be helpful, clear, and include a placeholder for a payment link.
        - WhatsApp: Short, conversational, friendly. Use appropriate emojis for the tone.
        - SMS: Extremely brief (under 160 characters).
        - Psychology Note: Explain in one sentence why this specific tone is best for this situation.
      `,
    });

    return NextResponse.json(result.object);
  } catch (error: any) {
    console.error("!!! API ROUTE ERROR !!!", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message || "An unexpected error occurred" 
    }, { status: 500 });
  }
}