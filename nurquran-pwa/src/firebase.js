import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged
} from "firebase/auth";

// Isi konfigurasi dari Firebase Console > Project settings > Your apps.
// Jangan pernah memasukkan private key/service account ke aplikasi frontend.
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_FIREBASE_API_KEY",
  authDomain: "GANTI_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_PROJECT_ID",
  appId: "GANTI_DENGAN_FIREBASE_APP_ID"
};

const configured = !Object.values(firebaseConfig).some(v => v.startsWith("GANTI_"));
let auth = null;
if (configured) auth = getAuth(initializeApp(firebaseConfig));
const googleProvider = new GoogleAuthProvider();

export { auth, configured, googleProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged };