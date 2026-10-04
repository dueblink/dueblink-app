import { NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendProWelcomeEmail } from '@/lib/emailService';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  environment: 'live_mode',
});

export async function POST(req: Request) {
  try {
    // =====================================================
    // 1. Read the RAW webhook body
    // =====================================================

    const rawBody = await req.text();

    if (!rawBody) {
      return NextResponse.json(
        { success: false, message: 'Empty webhook body' },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. Verify Dodo webhook signature
    // =====================================================

    const headers = Object.fromEntries(req.headers.entries());

    let event;

    try {
      event = dodo.webhooks.unwrap(rawBody, {
        headers,
      });
    } catch (error) {
      console.error('DODO WEBHOOK SIGNATURE ERROR:', error);

      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    console.log('=== DODO WEBHOOK RECEIVED ===');
    console.log('Event type:', event.type);

    // =====================================================
    // 3. Handle subscription becoming active / renewal
    // =====================================================

    if (
      event.type === 'subscription.active' ||
      event.type === 'subscription.renewed'
    ) {
      const subscription = event.data;

      const metadata = subscription.metadata || {};

      const userId = String(metadata.app_user_id || '');
      const billingCycle = String(metadata.billing_cycle || '');

      console.log(
        'Dodo subscription ID:',
        subscription.subscription_id
      );

      console.log(
        'Dodo product ID:',
        subscription.product_id
      );

      console.log(
        'DueBlink user ID:',
        userId
      );

      console.log(
        'Billing cycle:',
        billingCycle
      );

      console.log(
        'Next billing date:',
        subscription.next_billing_date
      );

      if (!userId) {
        console.error(
          'DODO WEBHOOK: app_user_id missing from subscription metadata'
        );

        return NextResponse.json(
          {
            success: false,
            message: 'Missing app_user_id in webhook metadata',
          },
          { status: 400 }
        );
      }

      if (
        billingCycle !== 'monthly' &&
        billingCycle !== 'yearly'
      ) {
        console.error(
          'DODO WEBHOOK: Invalid billing_cycle:',
          billingCycle
        );

        return NextResponse.json(
          {
            success: false,
            message: 'Invalid billing_cycle in webhook metadata',
          },
          { status: 400 }
        );
      }

      const userRef = adminDb
        .collection('users')
        .doc(userId);

      // =====================================================
      // Check current user state BEFORE updating it
      // =====================================================

      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        console.error(
          'DODO WEBHOOK: User not found:',
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

      const userData = userSnapshot.data() || {};

      // Only the first activation should send the welcome email.
      const shouldSendWelcomeEmail =
        event.type === 'subscription.active' &&
        userData.isPro !== true;

      const nextBillingDate = new Date(
        String(subscription.next_billing_date)
      );

      if (Number.isNaN(nextBillingDate.getTime())) {
        console.error(
          'DODO WEBHOOK: Invalid next_billing_date'
        );

        return NextResponse.json(
          {
            success: false,
            message: 'Invalid next billing date',
          },
          { status: 400 }
        );
      }

      // =====================================================
      // 4. Activate / renew DueBlink Pro
      // =====================================================

      await userRef.set(
        {
          isPro: true,
          wasPro: true,
          billingCycle,
          proExpiresAt: nextBillingDate,
          cancelledAt: null,

          dodoSubscriptionId:
            subscription.subscription_id,

          dodoProductId:
            subscription.product_id,

          dodoCustomerId:
            subscription.customer?.customer_id || null,

          dodoLastWebhookType:
            event.type,

          dodoLastWebhookAt:
            new Date(),
        },
        { merge: true }
      );

      console.log(
        'DODO WEBHOOK: Pro activated/renewed for user:',
        userId
      );

      // =====================================================
      // 5. Send Pro Welcome Email ONLY on first activation
      // =====================================================

      if (shouldSendWelcomeEmail) {
        try {
          const userEmail =
            userData.email ||
            userData.emailAddress;

          const userName =
            userData.name ||
            userData.displayName ||
            'there';

          if (userEmail) {
            const emailResult =
              await sendProWelcomeEmail(
                userEmail,
                userName
              );

            if (!emailResult.success) {
              console.error(
                'Dodo Pro activated, but Pro welcome email failed:',
                emailResult.error
              );
            } else {
              console.log(
                'Dodo Pro welcome email sent successfully to:',
                userEmail
              );
            }
          } else {
            console.warn(
              'Dodo Pro activated, but no email address was found for user:',
              userId
            );
          }
        } catch (emailError) {
          // Email failure must NOT undo
          // successful payment or Pro activation.
          console.error(
            'Dodo Pro activated, but Pro welcome email threw an error:',
            emailError
          );
        }
      } else {
        console.log(
          'DODO WEBHOOK: Welcome email skipped because this is not the first activation.'
        );
      }
    }

    // =====================================================
    // 6. Handle subscription expiration
    // =====================================================

    if (event.type === 'subscription.expired') {
      const subscription = event.data;

      const userId = String(
        subscription.metadata?.app_user_id || ''
      );

      if (userId) {
        await adminDb
          .collection('users')
          .doc(userId)
          .set(
            {
              isPro: false,
              wasPro: true,
              dodoLastWebhookType: event.type,
              dodoLastWebhookAt: new Date(),
            },
            { merge: true }
          );

        console.log(
          'DODO WEBHOOK: Pro expired for user:',
          userId
        );
      }
    }

    // =====================================================
    // 7. Acknowledge webhook
    // =====================================================

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'DODO WEBHOOK SERVER ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}