import crypto from 'crypto';
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

    // --------------------------------------------------
    // Normalize Firebase private key
    // --------------------------------------------------

    privateKey = privateKey.trim();

    // Remove accidental surrounding quotes
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }

    // Convert literal escaped newlines into real newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Normalize Windows line endings
    privateKey = privateKey.replace(/\r/g, '');

    // Final trim
    privateKey = privateKey.trim();

    // --------------------------------------------------
    // Validate Firebase Admin configuration
    // --------------------------------------------------

    if (!projectId) {
      throw new Error(
        'Missing FIREBASE_PROJECT_ID in environment variables.'
      );
    }

    if (!clientEmail) {
      throw new Error(
        'Missing FIREBASE_CLIENT_EMAIL in environment variables.'
      );
    }

    if (!privateKey) {
      throw new Error(
        'Missing FIREBASE_PRIVATE_KEY in environment variables.'
      );
    }

    if (
      !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
      !privateKey.includes('-----END PRIVATE KEY-----')
    ) {
      throw new Error(
        'FIREBASE_PRIVATE_KEY does not appear to be a valid Firebase private key.'
      );
    }

    // --------------------------------------------------
    // SAFE DEBUGGING
    // Never print the actual private key.
    // --------------------------------------------------

    console.log('=== FIREBASE ADMIN DEBUG ===');

    console.log(
      'Project ID exists:',
      !!projectId
    );

    console.log(
      'Client email exists:',
      !!clientEmail
    );

    console.log(
      'Private key exists:',
      !!privateKey
    );

    console.log(
      'Private key starts correctly:',
      privateKey.startsWith('-----BEGIN PRIVATE KEY-----')
    );

    console.log(
      'Private key ends correctly:',
      privateKey.endsWith('-----END PRIVATE KEY-----')
    );

    console.log(
      'Private key contains real newline:',
      privateKey.includes('\n')
    );

    console.log(
      'Private key contains literal \\\\n:',
      privateKey.includes('\\n')
    );

    console.log(
      'Private key length:',
      privateKey.length
    );

    // --------------------------------------------------
    // Cryptographically validate private key
    // --------------------------------------------------

    try {
      crypto.createPrivateKey({
        key: privateKey,
        format: 'pem',
        type: 'pkcs8',
      });

      console.log(
        'Firebase private key validation: PASSED'
      );
    } catch (keyError) {
      console.error(
        'Firebase private key validation: FAILED'
      );

      console.error(
        'The Firebase private key could not be parsed by Node/OpenSSL.'
      );

      throw new Error(
        'FIREBASE_PRIVATE_KEY is not a valid PKCS8 private key.'
      );
    }

    // --------------------------------------------------
    // Initialize Firebase Admin
    // --------------------------------------------------

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

// --------------------------------------------------
// Backward compatibility
// --------------------------------------------------

export const adminDb = {
  collection: (path: string) =>
    getAdminDb().collection(path),

  doc: (path: string) =>
    getAdminDb().doc(path),

  // Add other proxy methods if needed,
  // or update API files to call getAdminDb()
} as unknown as Firestore;
