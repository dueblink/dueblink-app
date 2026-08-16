import "server-only";

import { getApps } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";

let _adminAuth: Auth | null = null;

export const getAdminAuth = (): Auth => {
  if (_adminAuth) {
    return _adminAuth;
  }

  // This safely ensures your existing Firebase Admin app
  // is initialized using the existing firebaseAdmin.ts setup.
  getAdminDb();

  const apps = getApps();

  if (apps.length === 0) {
    throw new Error("Firebase Admin app was not initialized.");
  }

  _adminAuth = getAuth(apps[0]);

  return _adminAuth;
};
