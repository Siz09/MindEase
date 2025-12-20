import { auth } from '../../firebase';
import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as sendPasswordResetEmailFn,
} from 'firebase/auth';

export const firebaseSignInWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const firebaseCreateUserWithEmail = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const firebaseSignInAnonymously = async () => {
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
};

export const firebaseGetIdToken = async (firebaseUser, forceRefresh = false) => {
  if (!firebaseUser) {
    throw new Error('Missing Firebase user');
  }
  return firebaseUser.getIdToken(forceRefresh);
};

export const firebaseSendPasswordResetEmail = async (email) => {
  return sendPasswordResetEmailFn(auth, email);
};

export const firebaseLinkCurrentUserWithEmailPassword = async (email, password) => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error('No active session');
  }

  const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth');
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(firebaseUser, credential);

  return result.user;
};

export const firebaseSignOut = async () => {
  await auth.signOut();
};
