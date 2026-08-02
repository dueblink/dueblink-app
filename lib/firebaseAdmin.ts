import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let serviceAccount;

  // We read the entire credential as a single Base64 string to prevent Vercel from breaking newlines
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const decodedJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_B64.trim(),
      'base64'
    ).toString('utf8');
    serviceAccount = JSON.parse(decodedJson);
  } else {
    // Fallback if someone uses individual fields
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);