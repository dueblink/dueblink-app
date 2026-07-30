import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD5LZ0GW7JhJQv3O0ain4nwjVOQcTs-VN0",
  authDomain: "dueblink-1ab08.firebaseapp.com",
  projectId: "dueblink-1ab08",
  storageBucket: "dueblink-1ab08.firebasestorage.app",
  messagingSenderId: "716153090685",
  appId: "1:716153090685:web:6cfaac00406008841c7714",
  measurementId: "G-MSBTNY02B7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export the services
export const auth = getAuth(app);

// Persistence: This ensures the user stays logged in across page refreshes
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

export const db = getFirestore(app);

// Safely initialize analytics only in the browser and if supported
export const analytics = (typeof window !== 'undefined') 
  ? isSupported().then(supported => supported ? getAnalytics(app) : null) 
  : null