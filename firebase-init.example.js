import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  serverTimestamp,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Copie este arquivo para firebase-init.js e adicione suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.firebaseAnalytics = analytics;
window.firebaseDb = db;
window.firebaseCollection = collection;
window.firebaseAddDoc = addDoc;
window.firebaseUpdateDoc = updateDoc;
window.firebaseGetDocs = getDocs;
window.firebaseQuery = query;
window.firebaseOrderBy = orderBy;
window.firebaseLimit = limit;
window.firebaseDoc = doc;
window.firebaseDeleteDoc = deleteDoc;
window.firebaseServerTimestamp = serverTimestamp;
window.firebaseOnSnapshot = onSnapshot;
window.firebaseAuth = getAuth(app);
window.firebaseSignInWithEmailAndPassword = signInWithEmailAndPassword;
window.firebaseSignOut = signOut;
window.firebaseOnAuthStateChanged = onAuthStateChanged;
