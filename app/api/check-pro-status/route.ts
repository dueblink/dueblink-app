import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';

// Flips a lapsed Pro subscription's isPro field to false, server-side.
//
// The client can detect locally that proExpiresAt has passed (that's what
// drives the "Renew" vs "Upgrade" wording instantly, with no network wait),
// but it can never write that back to Firestore — the security rules
// require isPro and proExpiresAt to stay unchanged on any client update, on
// purpose, so a user can't just set themselves to Pro for free. Only the
// Admin SDK can make that change, which is what this route does.
//
// Called by the client (fire-and-forget) whenever it notices isPro is true
// but proExpiresAt has already passed. Safe to call repeatedly — it's a
// no-op once isPro is already false.
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
      console.error('CHECK PRO STATUS AUTH ERROR:', error);

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired authentication token',
        },
        { status: 401 }
      );
    }

    // ======================================================
    // 1. Read the user's current status
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
    const proExpiresAt = data.proExpiresAt ? data.proExpiresAt.toDate() : null;
    const isExpired = !!(data.isPro && proExpiresAt && new Date() > proExpiresAt);

    // ======================================================
    // 2. If it's genuinely expired, flip it off — this is the one write
    //    that can never come from the client itself.
    // ======================================================

    if (isExpired) {
      await userRef.update({
        isPro: false,
        wasPro: true,
      });

      return NextResponse.json({
        success: true,
        isPro: false,
        wasPro: true,
        proExpiresAt: proExpiresAt ? proExpiresAt.toISOString() : null,
        billingCycle: data.billingCycle || null,
        corrected: true,
      });
    }

    // Not expired (or never was Pro) — nothing to correct. Still worth
    // self-healing wasPro here if it's missing, same reasoning as the
    // client-side self-heal, just routed through the Admin SDK so it works
    // even for accounts created before wasPro existed.
    if (data.isPro && !data.wasPro) {
      await userRef.update({ wasPro: true }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      isPro: !!data.isPro,
      wasPro: !!data.isPro || !!data.wasPro || !!data.cancelledAt,
      proExpiresAt: proExpiresAt ? proExpiresAt.toISOString() : null,
      billingCycle: data.billingCycle || null,
      corrected: false,
    });
  } catch (error) {
    console.error('CHECK PRO STATUS ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong checking subscription status.',
      },
      { status: 500 }
    );
  }
}
