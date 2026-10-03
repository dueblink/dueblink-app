import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendProWelcomeEmail } from '@/lib/emailService';

export async function POST(req: Request) {
  try {
    // ======================================================
    // 1. Get webhook secret
    // ======================================================

    const webhookSecret =
      process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        'LEMON_SQUEEZY_WEBHOOK_SECRET is missing'
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Webhook configuration missing',
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 2. Read RAW request body
    // ======================================================

    const rawBody = await req.text();

    const signature =
      req.headers.get('X-Signature') || '';

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing webhook signature',
        },
        { status: 401 }
      );
    }

    // ======================================================
    // 3. Verify Lemon Squeezy signature
    // ======================================================

    const expectedSignature =
      crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    let isValid = false;

    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      isValid = false;
    }

    if (!isValid) {
      console.error(
        'Invalid Lemon Squeezy webhook signature'
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid signature',
        },
        { status: 401 }
      );
    }

    // ======================================================
    // 4. Parse webhook
    // ======================================================

    const payload = JSON.parse(rawBody);

    const eventName =
      req.headers.get('X-Event-Name') ||
      payload?.meta?.event_name ||
      '';

    console.log(
      '=== LEMON SQUEEZY WEBHOOK ==='
    );

    console.log(
      'Event:',
      eventName
    );

    // ======================================================
    // 5. Get Firebase user ID
    // ======================================================

    const userId =
      payload?.meta?.custom_data?.user_id;

    if (!userId) {
      console.error(
        'Lemon Squeezy webhook missing user_id'
      );

      // The webhook itself is valid, but we cannot
      // associate it with a DueBlink account.
      return NextResponse.json(
        {
          success: true,
          message: 'Webhook received without user_id',
        },
        { status: 200 }
      );
    }

    // ======================================================
    // 6. Get subscription data
    // ======================================================

    const subscriptionId =
      payload?.data?.id || null;

    const attributes =
      payload?.data?.attributes || {};

    const variantId =
      String(attributes?.variant_id || '');

    const status =
      attributes?.status || '';

    const cancelled =
      attributes?.cancelled === true;

    const renewsAt =
      attributes?.renews_at || null;

    const endsAt =
      attributes?.ends_at || null;

    console.log(
      'User ID:',
      userId
    );

    console.log(
      'Subscription ID:',
      subscriptionId
    );

    console.log(
      'Variant ID:',
      variantId
    );

    console.log(
      'Status:',
      status
    );

    // ======================================================
    // 7. Get user from Firebase
    // ======================================================

    const userRef =
      adminDb
        .collection('users')
        .doc(userId);

    const userSnapshot =
      await userRef.get();

    if (!userSnapshot.exists) {
      console.error(
        'DueBlink user not found:',
        userId
      );

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
    // 8. Determine billing cycle
    // ======================================================

    let billingCycle:
      | 'monthly'
      | 'yearly';

    if (variantId === '2198543') {
      billingCycle = 'yearly';
    } else if (variantId === '2198567') {
      billingCycle = 'monthly';
    } else {
      console.error(
        'Unknown Lemon Squeezy variant:',
        variantId
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Unknown subscription variant',
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 9. Subscription created
    // ======================================================

    if (
      eventName === 'subscription_created'
    ) {
      const proExpiresAt =
        renewsAt
          ? new Date(renewsAt)
          : billingCycle === 'yearly'
            ? new Date(
                new Date().setFullYear(
                  new Date().getFullYear() + 1
                )
              )
            : new Date(
                new Date().setMonth(
                  new Date().getMonth() + 1
                )
              );

      await userRef.set(
        {
          isPro: true,
          wasPro: true,

          billingCycle,

          proExpiresAt,

          lemonSqueezySubscriptionId:
            subscriptionId,

          lemonSqueezyVariantId:
            variantId,

          paymentProvider:
            'lemonsqueezy',

          cancelledAt: null,

          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      console.log(
        'DueBlink Pro activated via Lemon Squeezy:',
        userId
      );

      // Send welcome email only once
      if (
        !userData.lemonSqueezyWelcomeEmailSent
      ) {
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

            if (emailResult.success) {
              await userRef.set(
                {
                  lemonSqueezyWelcomeEmailSent:
                    true,
                },
                {
                  merge: true,
                }
              );

              console.log(
                'Lemon Squeezy Pro welcome email sent'
              );
            } else {
              console.error(
                'Welcome email failed:',
                emailResult.error
              );
            }
          } catch (emailError) {
            console.error(
              'Welcome email error:',
              emailError
            );
          }
        }
      }
    }

    // ======================================================
    // 10. Subscription updated
    // ======================================================

    if (
      eventName === 'subscription_updated'
    ) {
      const updateData: Record<
        string,
        unknown
      > = {
        lemonSqueezySubscriptionId:
          subscriptionId,

        lemonSqueezyVariantId:
          variantId,

        paymentProvider:
          'lemonsqueezy',

        billingCycle,

        updatedAt: new Date(),
      };

      // If subscription is still active,
      // keep Pro active and update renewal date.
      if (
        status === 'active' &&
        renewsAt
      ) {
        updateData.isPro = true;
        updateData.wasPro = true;
        updateData.proExpiresAt =
          new Date(renewsAt);
      }

      // Cancellation does NOT immediately remove Pro.
      // Lemon Squeezy keeps the subscription active
      // until the end of the current billing period.
      if (
        cancelled &&
        endsAt
      ) {
        updateData.cancelledAt =
          new Date();

        updateData.proExpiresAt =
          new Date(endsAt);
      }

      await userRef.set(
        updateData,
        {
          merge: true,
        }
      );

      console.log(
        'Lemon Squeezy subscription updated:',
        userId
      );
    }

    // ======================================================
    // 11. Successful subscription payment
    // ======================================================

    if (
      eventName ===
      'subscription_payment_success'
    ) {
      if (renewsAt) {
        await userRef.set(
          {
            isPro: true,
            wasPro: true,

            billingCycle,

            proExpiresAt:
              new Date(renewsAt),

            lemonSqueezySubscriptionId:
              subscriptionId,

            lemonSqueezyVariantId:
              variantId,

            paymentProvider:
              'lemonsqueezy',

            updatedAt: new Date(),
          },
          {
            merge: true,
          }
        );

        console.log(
          'Lemon Squeezy renewal successful:',
          userId
        );
      }
    }

    // ======================================================
    // 12. Subscription expired
    // ======================================================

    if (
      eventName ===
      'subscription_expired'
    ) {
      await userRef.set(
        {
          isPro: false,
          wasPro: true,

          lemonSqueezySubscriptionId:
            subscriptionId,

          lemonSqueezyVariantId:
            variantId,

          paymentProvider:
            'lemonsqueezy',

          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      console.log(
        'Lemon Squeezy subscription expired:',
        userId
      );
    }

    // ======================================================
    // 13. Subscription cancelled
    // ======================================================

    if (
      eventName ===
      'subscription_cancelled'
    ) {
      // IMPORTANT:
      // Do not immediately remove Pro.
      //
      // Lemon Squeezy cancellation normally means
      // the customer has cancelled renewal but keeps
      // access until the end of the current period.

      await userRef.set(
        {
          cancelledAt: new Date(),

          lemonSqueezySubscriptionId:
            subscriptionId,

          lemonSqueezyVariantId:
            variantId,

          paymentProvider:
            'lemonsqueezy',

          ...(endsAt
            ? {
                proExpiresAt:
                  new Date(endsAt),
              }
            : {}),

          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      console.log(
        'Lemon Squeezy subscription cancelled:',
        userId
      );
    }

    // ======================================================
    // 14. Subscription resumed
    // ======================================================

    if (
      eventName ===
      'subscription_resumed'
    ) {
      await userRef.set(
        {
          isPro: true,
          wasPro: true,

          billingCycle,

          ...(renewsAt
            ? {
                proExpiresAt:
                  new Date(renewsAt),
              }
            : {}),

          cancelledAt: null,

          lemonSqueezySubscriptionId:
            subscriptionId,

          lemonSqueezyVariantId:
            variantId,

          paymentProvider:
            'lemonsqueezy',

          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      console.log(
        'Lemon Squeezy subscription resumed:',
        userId
      );
    }

    // ======================================================
    // 15. Always acknowledge successful webhook
    // ======================================================

    return NextResponse.json(
      {
        success: true,
        event: eventName,
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      'LEMON SQUEEZY WEBHOOK ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Webhook processing failed',
      },
      {
        status: 500,
      }
    );
  }
}