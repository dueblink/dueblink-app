import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Prevent build errors if environment variables are missing during static analysis
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      // Dummy mock app for build phase only
      return initializeApp({
        credential: cert({
          projectId: 'placeholder',
          clientEmail: 'placeholder@placeholder.com',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3...\n-----END PRIVATE KEY-----\n',
        }),
      }, 'build-dummy');
    }
    throw new Error("Missing Firebase environment variables.");
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);