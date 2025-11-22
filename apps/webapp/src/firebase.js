// apps/webapp/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Lazy initialization of messaging to prevent app crash if Firebase messaging is not properly configured
let messagingInstance = null;
export const messaging =
  typeof window !== 'undefined'
    ? (() => {
        try {
          return getMessaging(app);
        } catch (error) {
          console.warn('Firebase messaging initialization failed:', error);
          return null;
        }
      })()
    : null;
