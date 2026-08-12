import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      billingCycle,
    } = await req.json();

    // 1. Validate required parameters
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !userId ||
      !billingCycle
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required parameters',
        },
        { status: 400 }
      );
    }

    // 2. Validate billing cycle
    if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid billing cycle',
        },
        { status: 400 }
      );
    }

    // 3. Make sure Razorpay secret exists
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      console.error('RAZORPAY_KEY_SECRET is missing');

      return NextResponse.json(
        {
          success: false,
          message: 'Razorpay server configuration is missing',
        },
        { status: 500 }
      );
    }

    // 4. Generate expected Razorpay signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body)
      .digest('hex');

    // 5. Verify payment signature
    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isAuthentic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payment signature',
        },
        { status: 400 }
      );
    }

    // 6. Get user from Firebase
    const userRef = adminDb.collection('users').doc(userId);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // 7. Calculate Pro expiration date on the SERVER
    const proExpiresAt = new Date();

    if (billingCycle === 'yearly') {
      proExpiresAt.setFullYear(proExpiresAt.getFullYear() + 1);
    } else {
      proExpiresAt.setMonth(proExpiresAt.getMonth() + 1);
    }

    // 8. Activate Pro in Firebase
    await userRef.set(
      {
        isPro: true,
        billingCycle: billingCycle,
        proExpiresAt: proExpiresAt,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        cancelledAt: null,
        updatedAt: new Date(),
      },
      {
        merge: true,
      }
    );

    // 9. Return successful verification
    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified and Pro status activated successfully',
        billingCycle,
        proExpiresAt: proExpiresAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}