import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendProWelcomeEmail } from '@/lib/emailService';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';
import { verifyPaymentRateLimit } from '@/lib/rateLimit';
import { FieldValue } from 'firebase-admin/firestore';
import { EARLY_OFFER_DOC_PATH } from '@/lib/earlyOffer';

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billingCycle,
    } = await req.json();

    // ======================================================
    // 0. Verify Firebase authentication
    // ======================================================

    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7).trim();

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication token missing',
        },
        { status: 401 }
      );
    }

    let userId: string;

    try {
      const decodedToken =
        await getAdminAuth().verifyIdToken(idToken);

      userId = decodedToken.uid;
    } catch (error) {
      console.error(
        'VERIFY PAYMENT AUTH ERROR:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired authentication token',
        },
        { status: 401 }
      );
    }

    console.log('Verified User ID:', userId);

    // ======================================================
    // Rate limit payment verification
    // ======================================================

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    const { success } = await verifyPaymentRateLimit.limit(
      `verify-payment:${ip}`
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many payment verification requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    // ======================================================
    // 1. Validate required parameters
    // ======================================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
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

    // ======================================================
    // 2. Validate billing cycle
    // ======================================================

    if (
      billingCycle !== 'monthly' &&
      billingCycle !== 'yearly'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid billing cycle',
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 3. Make sure Razorpay secret exists
    // ======================================================

    const razorpaySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      console.error(
        'RAZORPAY_KEY_SECRET is missing'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Razorpay server configuration is missing',
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 4. Generate expected Razorpay signature
    // ======================================================

    const body =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body)
      .digest('hex');

    // ======================================================
    // 5. Verify payment signature
    // ======================================================

    let isAuthentic = false;

    try {
      isAuthentic = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(razorpay_signature, 'utf8')
      );
    } catch {
      isAuthentic = false;
    }

    if (!isAuthentic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payment signature',
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 5b. Use the plan that was actually paid for
    // ======================================================
    // create-order saved what each order is for. Use that, not
    // the billingCycle the browser sends, so nobody can pay for
    // a month and claim a year. (Orders made before this update
    // have no saved record; those fall back to the old way.)

    const orderRef =
      adminDb.collection('paymentOrders').doc(String(razorpay_order_id));

    const orderSnapshot = await orderRef.get();
    const savedOrder = orderSnapshot.exists ? orderSnapshot.data() || {} : null;

    if (savedOrder && savedOrder.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'This payment belongs to a different account',
        },
        { status: 403 }
      );
    }

    const paidBillingCycle: 'monthly' | 'yearly' =
      savedOrder?.billingCycle === 'yearly' || savedOrder?.billingCycle === 'monthly'
        ? savedOrder.billingCycle
        : billingCycle;

    const isEarlyOffer = savedOrder?.offer === 'early-offer';

    // ======================================================
    // 6. Get user from Firebase
    // ======================================================

    const userRef =
      adminDb.collection('users').doc(userId);

    const userSnapshot =
      await userRef.get();

    if (!userSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    const userData =
      userSnapshot.data() || {};

    // ======================================================
    // Prevent duplicate payment processing
    // ======================================================

    if (
      userData.razorpayPaymentId ===
        razorpay_payment_id &&
      userData.razorpayOrderId ===
        razorpay_order_id
    ) {
      return NextResponse.json(
        {
          success: true,
          message: 'Payment has already been verified.',
          billingCycle:
            userData.billingCycle || paidBillingCycle,
          proExpiresAt:
            userData.proExpiresAt?.toDate
              ? userData.proExpiresAt.toDate().toISOString()
              : null,
        },
        { status: 200 }
      );
    }

    // ======================================================
    // 7. Calculate Pro expiration date on SERVER
    // ======================================================

    const proExpiresAt = new Date();

    if (paidBillingCycle === 'yearly') {
      proExpiresAt.setFullYear(
        proExpiresAt.getFullYear() + 1
      );
    } else {
      proExpiresAt.setMonth(
        proExpiresAt.getMonth() + 1
      );
    }

    // ======================================================
    // 8. Activate Pro in Firebase
    // ======================================================

    await userRef.set(
      {
        isPro: true,
        wasPro: true,
        billingCycle: paidBillingCycle,
        ...(isEarlyOffer ? { earlyOfferUsed: true } : {}),
        proExpiresAt: proExpiresAt,
        razorpayPaymentId:
          razorpay_payment_id,
        razorpayOrderId:
          razorpay_order_id,
        cancelledAt: null,
        updatedAt: new Date(),
      },
      {
        merge: true,
      }
    );

    // Mark the order paid, and count an early-offer spot as used.
    // (Never let this block Pro activation if it fails.)
    try {
      if (savedOrder) {
        await orderRef.update({
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          paidAt: new Date(),
        });
      }

      if (isEarlyOffer) {
        await adminDb.doc(EARLY_OFFER_DOC_PATH).set(
          { claimed: FieldValue.increment(1), updatedAt: new Date() },
          { merge: true }
        );
      }
    } catch (bookkeepingError) {
      console.error(
        'Pro activated, but order/offer bookkeeping failed:',
        bookkeepingError
      );
    }

    // ======================================================
    // 9. Send Pro Welcome Email
    // ======================================================

    const userEmail =
      userData.email ||
      userData.emailAddress;

    const userName =
      userData.name ||
      userData.displayName ||
      'there';

    if (userEmail) {
      try {
        const emailResult =
          await sendProWelcomeEmail(
            userEmail,
            userName
          );

        if (!emailResult.success) {
          console.error(
            'Pro activated, but Pro welcome email failed:',
            emailResult.error
          );
        } else {
          console.log(
            'Pro welcome email sent successfully to:',
            userEmail
          );
        }
      } catch (emailError) {
        // Email failure must NOT undo
        // successful payment or Pro activation.
        console.error(
          'Pro activated, but Pro welcome email threw an error:',
          emailError
        );
      }
    } else {
      console.warn(
        'Pro activated, but no email address was found for user:',
        userId
      );
    }

    // ======================================================
    // 10. Return successful verification
    // ======================================================

    return NextResponse.json(
      {
        success: true,
        message:
          'Payment verified and Pro status activated successfully',
        billingCycle: paidBillingCycle,
        proExpiresAt:
          proExpiresAt.toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      'Verification error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}