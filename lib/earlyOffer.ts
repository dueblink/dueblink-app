import { getAdminDb } from '@/lib/firebaseAdmin';
import { EARLY_OFFER } from '@/lib/seasonalPricing';

// ==================================================
// EARLY OFFER (first 20 paying users)
// ==================================================
//
// The counter lives in Firestore at meta/earlyOffer → { claimed }.
// It goes up by 1 when an early-offer payment is verified
// (app/api/verify-payment/route.ts).
//
// A person qualifies when:
//   - there are spots left, and
//   - they have never paid for Pro before, and
//   - they have not used the early offer already.
//
// SERVER ONLY: uses the Admin SDK.
// ==================================================

export const EARLY_OFFER_DOC_PATH = 'meta/earlyOffer';

export async function getEarlyOfferStatus(userId?: string | null) {
  const db = getAdminDb();

  const counterSnap = await db.doc(EARLY_OFFER_DOC_PATH).get();
  const claimed = Number(counterSnap.data()?.claimed || 0);
  const spotsLeft = Math.max(0, EARLY_OFFER.totalSpots - claimed);

  let alreadyUsed = false;

  if (userId) {
    const userSnap = await db.collection('users').doc(userId).get();
    const user = userSnap.data() || {};

    alreadyUsed =
      Boolean(user.earlyOfferUsed) ||
      Boolean(user.wasPro) ||
      Boolean(user.isPro) ||
      Boolean(user.razorpayPaymentId);
  }

  return {
    spotsLeft,
    totalSpots: EARLY_OFFER.totalSpots,
    eligible: spotsLeft > 0 && !alreadyUsed,
  };
}
