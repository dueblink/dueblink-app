import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let _adminDb: Firestore | null = null;

export const getAdminDb = (): Firestore => {
  if (_adminDb) {
    return _adminDb;
  }

  const existingApps = getApps();
  let app: App;

  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      } as any),
    });
  }

  _adminDb = getFirestore(app);
  return _adminDb;
};

// For backward compatibility if other files import adminDb directly
export const adminDb = {
  collection: (path: string) => getAdminDb().collection(path),
  doc: (path: string) => getAdminDb().doc(path),
  // Add other proxy methods if needed, or update your API files to call getAdminDb()
} as unknown as Firestore;