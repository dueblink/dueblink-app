import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawEnv) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
  }

  const serviceAccount = JSON.parse(rawEnv);

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  return initializeApp({
    credential: cert(serviceAccount as any),
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);