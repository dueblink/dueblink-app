import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';

  // If Vercel stripped out newlines and turned them into spaces, fix them back
  if (rawKey.includes('-----BEGIN PRIVATE KEY-----') && !rawKey.includes('\n')) {
    rawKey = rawKey
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
      .replace(/MIIEvQIBADANBgkqhkiG9w0BAQEF/g, '\nMIIEvQIBADANBgkqhkiG9w0BAQEF'); // safety patch or handle generic spacing
  }

  // Proper cleanup for escaped newlines or standard newline conversions
  const privateKey = rawKey
    .replace(/\\n/g, '\n')
    .trim();

  // Ensure headers and footers have correct wrapping
  const formattedPrivateKey = privateKey.startsWith('-----BEGIN PRIVATE KEY-----')
    ? privateKey
    : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail || !formattedPrivateKey) {
    throw new Error(
      "Firebase Admin initialization failed: Missing Firebase environment variables."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);
