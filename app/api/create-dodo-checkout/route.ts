import { NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';

const MONTHLY_PRODUCT_ID = 'pdt_0NozauTk7Q8rm9iZmANty';
const YEARLY_PRODUCT_ID = 'pdt_0Nozb8TpM6AgbY94X9uXn';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: 'test_mode',
});

export async function POST(req: Request) {
  try {
    // --------------------------------------------------
    // 1. Verify Firebase authentication
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

    let decodedToken;

    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error('DODO CHECKOUT AUTH ERROR:', error);

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired authentication token',
        },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your account does not have an email address.',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Validate billing cycle
    // --------------------------------------------------

    const body = await req.json();
    const { billingCycle } = body;

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
    // 3. Server-controlled Dodo product selection
    // --------------------------------------------------

    const productId =
      billingCycle === 'monthly'
        ? MONTHLY_PRODUCT_ID
        : YEARLY_PRODUCT_ID;

    // --------------------------------------------------
    // 4. Create Dodo Checkout Session
    // --------------------------------------------------

    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],

      customer: {
        email,
        name: decodedToken.name || 'DueBlink User',
      },

      metadata: {
        app_user_id: userId,
        billing_cycle: billingCycle,
      },

      return_url: 'https://www.dueblink.com/pricing',
    });

    console.log('Dodo checkout session created:', session.session_id);

    if (!session.checkout_url) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dodo did not return a checkout URL.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        checkoutUrl: session.checkout_url,
        sessionId: session.session_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DODO CHECKOUT SERVER ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to create Dodo checkout.',
      },
      { status: 500 }
    );
  }
}