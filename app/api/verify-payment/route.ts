import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin'; // Ensure you have initialized Firebase Admin SDK server-side

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json({ success: false, message: "Missing required parameters" }, { status: 400 });
    }

    // 1. Generate signature using your Key Secret
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    // 2. Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // 3. Update user's subscription status in Firebase using Firebase Admin SDK
      const userRef = adminDb.collection('users').doc(userId);
      
      await userRef.set({
        isPro: true,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return NextResponse.json({ success: true, message: "Payment verified and Pro status activated successfully" }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}