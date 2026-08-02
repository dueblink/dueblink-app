import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let serviceAccount: any = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      // Decode Base64 string
      const decodedBuffer = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_B64.trim(),
        'base64'
      );
      
      // Convert to string and sanitize literal control characters / unescaped newlines inside strings
      const decodedJson = decodedBuffer
        .toString('utf8')
        .replace(/[\u0000-\u001F]+/g, (match) => {
          // Escape standard control characters so JSON.parse won't crash
          return JSON.stringify(match).slice(1, -1);
        });

      serviceAccount = JSON.parse(decodedJson);
    } catch (e) {
      console.error("Error decoding FIREBASE_SERVICE_ACCOUNT_B64:", e);
    }
  }

  // Fallback if standard service account JSON key is used instead
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim());
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  // Final validation check for private key formatting
  if (serviceAccount && serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key
      .replace(/\\n/g, '\n')
      .replace(/\\\\n/g, '\n');
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