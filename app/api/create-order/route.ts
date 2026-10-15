import { NextResponse } from 'next/server';
import { getSeasonalPricing, NORMAL_PRICES, EARLY_OFFER } from '@/lib/seasonalPricing';
import { getEarlyOfferStatus } from '@/lib/earlyOffer';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';
import { createOrderRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    const { success } = await createOrderRateLimit.limit(
      `create-order:${ip}`
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many payment requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    const {
      billingCycle,
    } = await req.json();

    console.log('=== DUEBLINK CREATE ORDER ===');
    console.log('Billing Cycle:', billingCycle);

    // --------------------------------------------------
    // 0. Verify Firebase authentication
    // --------------------------------------------------

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
        'CREATE ORDER AUTH ERROR:',
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

    // --------------------------------------------------
    // 1. Validate request
    // --------------------------------------------------

    if (!billingCycle) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required parameters',
        },
        { status: 400 }
      );
    }

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

    // --------------------------------------------------
    // 2. SERVER-CONTROLLED PRICING
    // --------------------------------------------------

    const currency = 'INR';

    // Order of priority:
    // 1. Early offer (first 20 paying users, once per person)
    // 2. A festival offer, only if it is cheaper than normal
    // 3. Normal price
    const earlyOffer =
      await getEarlyOfferStatus(userId);

    const seasonalPricing =
      earlyOffer.eligible ? null : getSeasonalPricing();

    const offerId =
      earlyOffer.eligible
        ? 'early-offer'
        : seasonalPricing?.id || 'none';

    const amountInRupees =
      earlyOffer.eligible
        ? billingCycle === 'monthly'
          ? EARLY_OFFER.monthly
          : EARLY_OFFER.yearly
        : seasonalPricing
        ? billingCycle === 'monthly'
          ? seasonalPricing.monthlyPrice
          : seasonalPricing.yearlyPrice
        : billingCycle === 'monthly'
          ? NORMAL_PRICES.monthly
          : NORMAL_PRICES.yearly;

    const numericAmount =
      amountInRupees * 100;

    console.log(
      'Offer:',
      offerId
    );

    console.log(
      'Server calculated price:',
      amountInRupees,
      'INR'
    );

    console.log(
      'Server calculated amount:',
      numericAmount,
      'paise'
    );

    console.log(
      'Currency:',
      currency
    );

    // --------------------------------------------------
    // 3. Get Razorpay credentials
    // --------------------------------------------------

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    // SAFE diagnostic logs
    // NEVER log the actual secret.

    console.log(
      'Razorpay Key ID exists:',
      !!keyId
    );

    console.log(
      'Razorpay Key ID length:',
      keyId?.length
    );

    console.log(
      'Razorpay Secret exists:',
      !!keySecret
    );

    console.log(
      'Razorpay Secret length:',
      keySecret?.length
    );

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Razorpay server credentials are missing. Check .env.local',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 4. Create unique receipt
    // --------------------------------------------------

    const receipt =
      `db_${Date.now()}`;

    // --------------------------------------------------
    // 5. Create Basic Authentication
    // --------------------------------------------------

    const authToken =
      Buffer.from(
        `${keyId}:${keySecret}`
      ).toString('base64');

    // --------------------------------------------------
    // 6. Call Razorpay Orders API directly
    // --------------------------------------------------

    const razorpayResponse =
      await fetch(
        'https://api.razorpay.com/v1/orders',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Basic ${authToken}`,
          },

          body: JSON.stringify({
            amount: numericAmount,
            currency,
            receipt,

            notes: {
              userId: String(userId),
              billingCycle,
              product: 'DueBlink Pro',

              offer: offerId,
            },
          }),
        }
      );

    // --------------------------------------------------
    // 7. Read Razorpay response
    // --------------------------------------------------

    const razorpayData =
      await razorpayResponse.json();

    console.log(
      'Razorpay HTTP status:',
      razorpayResponse.status
    );

    console.log(
      'Razorpay response:',
      razorpayData
    );

    // --------------------------------------------------
    // 8. Handle Razorpay error
    // --------------------------------------------------

    if (!razorpayResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'Razorpay order creation failed',
        },
        {
          status:
            razorpayResponse.status,
        }
      );
    }

    // --------------------------------------------------
    // 9. Success
    // --------------------------------------------------

    console.log(
      'Razorpay Order Created:',
      razorpayData.id
    );

    // --------------------------------------------------
    // 10. Remember exactly what this order is for.
    // verify-payment reads this, so the plan given is the
    // plan that was paid for (not what the browser says).
    // --------------------------------------------------

    await getAdminDb()
      .collection('paymentOrders')
      .doc(String(razorpayData.id))
      .set({
        userId,
        billingCycle,
        amountInRupees,
        offer: offerId,
        status: 'created',
        createdAt: new Date(),
      });

    return NextResponse.json(
      {
        success: true,
        orderId: razorpayData.id,
        amount: razorpayData.amount,
        currency:
          razorpayData.currency,
        offer: offerId,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(
      'CREATE ORDER SERVER ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while creating Razorpay order',
      },
      { status: 500 }
    );
  }
}