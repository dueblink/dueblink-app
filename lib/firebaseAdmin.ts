import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getServiceAccount = () => {
  // 1. Check if Base64 encoded service account exists (Recommended for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      const decodedJson = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_B64,
        'base64'
      ).toString('utf8');
      return JSON.parse(decodedJson);
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_B64:", error);
    }
  }

  // 2. Fallback to standard FIREBASE_SERVICE_ACCOUNT_KEY JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
    }
  }

  return undefined;
};

const serviceAccount = getServiceAccount();

// Initialize Firebase Admin (preventing multiple initializations)
const app = !getApps().length 
  ? initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : {}) 
  : getApps()[0];

export const adminDb = getFirestore(app);