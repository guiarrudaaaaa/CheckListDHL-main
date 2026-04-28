import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do Firebase para o projeto Check List DHL
const firebaseConfig = {
  apiKey: "AIzaSyA8mJ2WWg9edJNDMqDLt9Jp-AQTzj66EeY",
  authDomain: "check-list-dhl-74819.firebaseapp.com",
  projectId: "check-list-dhl-74819",
  storageBucket: "check-list-dhl-74819.firebasestorage.app",
  messagingSenderId: "249950457140",
  appId: "1:249950457140:web:a3d779e3f8075d134f6961",
  measurementId: "G-CZ0XZ14C68"
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Expõe para uso em outros scripts da página
window.firebaseApp = app;
window.firebaseAnalytics = analytics;
window.firebaseDb = db;
window.firebaseCollection = collection;
window.firebaseAddDoc = addDoc;
window.firebaseGetDocs = getDocs;
window.firebaseQuery = query;
window.firebaseOrderBy = orderBy;
window.firebaseDoc = doc;
window.firebaseDeleteDoc = deleteDoc;
window.firebaseServerTimestamp = serverTimestamp;
