import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdminAuth';
import { getEarlyOfferStatus } from '@/lib/earlyOffer';

export const dynamic = 'force-dynamic';

// ==================================================
// GET /api/early-offer
// ==================================================
// Tells the pricing pages whether to show the early offer.
// Signed-in users send their token, so we can check whether
// they personally still qualify. Visitors who are not signed
// in see the offer while spots are left.
// The real price is always decided again in create-order.
// ==================================================

export async function GET(req: Request) {
  try {
    let userId: string | null = null;

    const authHeader = req.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7).trim();

      if (idToken) {
        try {
          const decoded = await getAdminAuth().verifyIdToken(idToken);
          userId = decoded.uid;
        } catch {
          userId = null;
        }
      }
    }

    const status = await getEarlyOfferStatus(userId);

    return NextResponse.json(
      { success: true, ...status },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('EARLY OFFER STATUS ERROR:', error);

    // If anything fails, simply don't show the offer.
    return NextResponse.json(
      { success: false, spotsLeft: 0, totalSpots: 20, eligible: false },
      { status: 200 }
    );
  }
}
