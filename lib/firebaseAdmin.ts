import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
    : undefined;

  if (serviceAccount && serviceAccount.private_key) {
    // Automatically fix line breaks if Vercel squashed them into spaces
    serviceAccount.private_key = serviceAccount.private_key
      .replace(/\\n/g, '\n')
      .replace(/ /g, '\n'); // Reconnects flattened space chunks into valid PEM line breaks
      
    // Clean up double newlines if any were created
    serviceAccount.private_key = serviceAccount.private_key
      .replace(/\n{2,}/g, '\n')
      .replace('-----BEGIN\nPRIVATE\nKEY-----', '-----BEGIN PRIVATE KEY-----')
      .replace('-----END\nPRIVATE\nKEY-----', '-----END PRIVATE KEY-----');
  }

  return initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);