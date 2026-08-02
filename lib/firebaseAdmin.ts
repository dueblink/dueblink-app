import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let serviceAccount: any = null;

  // Decode the secure Base64 environment variable from Vercel
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      const decodedJson = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_B64.trim(),
        'base64'
      ).toString('utf8');
      serviceAccount = JSON.parse(decodedJson);
    } catch (e) {
      console.error("Error decoding FIREBASE_SERVICE_ACCOUNT_B64:", e);
    }
  }

  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin initialization failed: FIREBASE_SERVICE_ACCOUNT_B64 environment variable is missing or invalid."
    );
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);