import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/emailService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, userName } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail(
      email,
      userName || "there"
    );

    if (!result.success) {
      console.error("Welcome email failed:", result.error);
      return NextResponse.json(
        { success: false, error: "Failed to send welcome email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully.",
    });
  } catch (error) {
    console.error("Send welcome email API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send welcome email." },
      { status: 500 }
    );
  }
}