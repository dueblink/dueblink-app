import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/emailService';
import { getAdminAuth } from "@/lib/firebaseAdminAuth";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7).trim();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Authentication token missing" },
        { status: 401 }
      );
    }

    try {
      await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("SEND WELCOME AUTH ERROR:", error);

      return NextResponse.json(
        { success: false, error: "Invalid or expired authentication token" },
        { status: 401 }
      );
    }

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