import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';
import { createOrderRateLimit } from '@/lib/rateLimit';

const MONTHLY_VARIANT_ID = '2198567';
const YEARLY_VARIANT_ID = '2198543';

export async function POST(req: Request) {
  try {
    // --------------------------------------------------
    // 0. Rate limit
    // --------------------------------------------------

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip =
      forwardedFor?.split(',')[0]?.trim() || 'unknown';

    const { success: rateLimitSuccess } =
      await createOrderRateLimit.limit(
        `create-lemonsqueezy-checkout:${ip}`
      );

    if (!rateLimitSuccess) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Too many checkout requests. Please try again later.',
        },
        { status: 429 }
      );
    }

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
      decodedToken =
        await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error(
        'LEMON CHECKOUT AUTH ERROR:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid or expired authentication token',
        },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';
    const userName =
      decodedToken.name || 'DueBlink User';

    // --------------------------------------------------
    // 2. Read request
    // --------------------------------------------------

    const { billingCycle } = await req.json();

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
    // 3. Lemon Squeezy configuration
    // --------------------------------------------------

    const apiKey =
      process.env.LEMON_SQUEEZY_API_KEY;

    const storeId =
      process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      console.error(
        'Lemon Squeezy configuration missing'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Lemon Squeezy server configuration is missing',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 4. Select variant
    // --------------------------------------------------

    const variantId =
      billingCycle === 'monthly'
        ? MONTHLY_VARIANT_ID
        : YEARLY_VARIANT_ID;

    console.log(
      'Creating Lemon Squeezy checkout:',
      {
        userId,
        billingCycle,
        variantId,
      }
    );

    // --------------------------------------------------
    // 5. Create Lemon Squeezy checkout
    // --------------------------------------------------

    const checkoutResponse = await fetch(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        method: 'POST',

        headers: {
          Accept:
            'application/vnd.api+json',

          'Content-Type':
            'application/vnd.api+json',

          Authorization:
            `Bearer ${apiKey}`,
        },

        body: JSON.stringify({
          data: {
            type: 'checkouts',

            attributes: {
              test_mode: true,

              checkout_data: {
                email: userEmail,
                name: userName,

                custom: {
                  user_id: userId,
                  billing_cycle: billingCycle,
                },
              },

              product_options: {
                enabled_variants: [
                  Number(variantId),
                ],

                redirect_url:
                  new URL(
                    '/dashboard?payment=success',
                    req.url
                  ).toString(),
              },

              checkout_options: {
                embed: false,
              },
            },

            relationships: {
              store: {
                data: {
                  type: 'stores',
                  id: storeId,
                },
              },

              variant: {
                data: {
                  type: 'variants',
                  id: variantId,
                },
              },
            },
          },
        }),
      }
    );

    // --------------------------------------------------
    // 6. Read Lemon Squeezy response
    // --------------------------------------------------

    const checkoutData =
      await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error(
        'LEMON CHECKOUT API ERROR:',
        checkoutData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Failed to create Lemon Squeezy checkout',
        },
        { status: 502 }
      );
    }

    const checkoutUrl =
      checkoutData?.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error(
        'Lemon Squeezy checkout URL missing:',
        checkoutData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Checkout URL was not returned by Lemon Squeezy',
        },
        { status: 502 }
      );
    }

    // --------------------------------------------------
    // 7. Return checkout URL to frontend
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        checkoutUrl,
        billingCycle,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      'CREATE LEMON SQUEEZY CHECKOUT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Internal server error while creating checkout',
      },
      { status: 500 }
    );
  }
}