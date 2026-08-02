import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing one or more Firebase environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY).");
  }

  // Ensure escaped \n strings are converted to actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    } as any),
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);