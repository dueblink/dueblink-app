import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdminAuth";
import { sendPasswordResetEmail } from "@/lib/emailService";
import { passwordResetRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const { success } = await passwordResetRateLimit.limit(
      `password-reset:${ip}`
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many password reset requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();

    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: "https://dueblink.com/reset-password",
      handleCodeInApp: true,
    });

    const result = await sendPasswordResetEmail(email, resetLink);

    if (!result.success) {
      console.error("Password reset email failed:", result.error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to send password reset email.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent.",
    });
  } catch (error: any) {
    console.error("Password reset API error:", error);

    // Don't reveal whether an email belongs to a DueBlink account.
    if (
      error?.code === "auth/user-not-found" ||
      error?.code === "auth/invalid-email"
    ) {
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, a reset email has been sent.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process password reset request.",
      },
      { status: 500 }
    );
  }
}