import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const decodedJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_B64.trim(),
      'base64'
    ).toString('utf8');
    
    // Parse safely
    serviceAccount = JSON.parse(decodedJson);
  }

  // Ensure private key handles newlines correctly after decoding
  if (serviceAccount && serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key
      .replace(/\\n/g, '\n');
  }

  if (!serviceAccount) {
    throw new Error("Firebase Admin initialization failed: Invalid service account.");
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);