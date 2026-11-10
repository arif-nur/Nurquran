import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged
} from "firebase/auth";

// Isi konfigurasi dari Firebase Console > Project settings > Your apps.
// Jangan pernah memasukkan private key/service account ke aplikasi frontend.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAS1e5NDe1q4ghlJ-SFBbcA0t4URMzotWc",
  authDomain: "nurquran-pwa.firebaseapp.com",
  projectId: "nurquran-pwa",
  storageBucket: "nurquran-pwa.firebasestorage.app",
  messagingSenderId: "163574890848",
  appId: "1:163574890848:web:248f29e064224690035e05",
  measurementId: "G-P5JMMKVJKZ"
};

const configured = !Object.values(firebaseConfig).some(v => v.startsWith("GANTI_"));
let auth = null;
if (configured) auth = getAuth(initializeApp(firebaseConfig));
const googleProvider = new GoogleAuthProvider();

export { auth, configured, googleProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged };