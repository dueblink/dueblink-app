import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const {
      userId,
      billingCycle,
    } = await req.json();

    console.log('=== DUEBLINK CREATE ORDER ===');
    console.log('User ID exists:', !!userId);
    console.log('Billing Cycle:', billingCycle);

    // --------------------------------------------------
    // 1. Validate request
    // --------------------------------------------------

    if (!userId || !billingCycle) {
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

    const numericAmount =
      billingCycle === 'monthly'
        ? 49900
        : 499900;

    console.log(
      'Server calculated amount:',
      numericAmount
    );

    console.log(
      'Currency:',
      currency
    );

    // --------------------------------------------------
    // 3. Get Razorpay credentials
    // --------------------------------------------------

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

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

    const receipt = `db_${Date.now()}`;

    // --------------------------------------------------
    // 5. Create Basic Authentication
    // --------------------------------------------------

    const authToken = Buffer.from(
      `${keyId}:${keySecret}`
    ).toString('base64');

    // --------------------------------------------------
    // 6. Call Razorpay Orders API directly
    // --------------------------------------------------

    const razorpayResponse = await fetch(
      'https://api.razorpay.com/v1/orders',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authToken}`,
        },

        body: JSON.stringify({
          amount: numericAmount,
          currency,
          receipt,

          notes: {
            userId: String(userId),
            billingCycle,
            product: 'DueBlink Pro',
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

          message:
            razorpayData?.error?.description ||
            razorpayData?.error?.reason ||
            'Razorpay order creation failed',

          razorpayError:
            razorpayData?.error || null,
        },
        {
          status: razorpayResponse.status,
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

    return NextResponse.json(
      {
        success: true,
        orderId: razorpayData.id,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
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

        message:
          error?.message ||
          'Internal server error while creating Razorpay order',
      },
      { status: 500 }
    );
  }
}
