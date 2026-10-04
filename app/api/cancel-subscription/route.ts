import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';
import { FieldValue } from 'firebase-admin/firestore';

// Cancels a user's Pro subscription, server-side.
//
// The client cannot do this itself — the Firestore rules require isPro and
// proExpiresAt to stay unchanged on any client update, on purpose (so a
// user can't just grant or revoke their own Pro status). Only the Admin
// SDK can make that change, which is what this route does.
export async function POST(req: Request) {
  try {
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
      const decodedToken = await getAdminAuth().verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('CANCEL SUBSCRIPTION AUTH ERROR:', error);

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired authentication token',
        },
        { status: 401 }
      );
    }

    // ======================================================
    // 1. Confirm there's actually a Pro subscription to cancel
    // ======================================================

    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    const data = userSnap.data() || {};

    if (!data.isPro) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have an active Pro subscription to cancel.',
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 2. Cancel it
    // ======================================================
    // proExpiresAt is deliberately left untouched here — it still holds
    // whatever the original renewal date was, which has no real meaning
    // anymore now that access ends immediately, but overwriting it isn't
    // necessary either. The client shows "ended today" locally once this
    // call succeeds, which is accurate regardless of what's stored here.

    await userRef.update({
      isPro: false,
      wasPro: true,
      cancelledAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled.',
    });
  } catch (error) {
    console.error('CANCEL SUBSCRIPTION ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong cancelling your subscription.',
      },
      { status: 500 }
    );
  }
}
