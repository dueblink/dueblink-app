import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Parse your service account key from environment variables
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : undefined;

// Initialize Firebase Admin (preventing multiple initializations)
const app = !getApps().length 
  ? initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : {}) 
  : getApps()[0];

export const adminDb = getFirestore(app);