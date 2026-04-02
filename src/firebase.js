import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBUn33ZKCJYcR9JCqZrEpnf0hAdoEcUWz4",
  authDomain: "steno-practice-48cee.firebaseapp.com",
  projectId: "steno-practice-48cee",
  storageBucket: "steno-practice-48cee.firebasestorage.app",
  messagingSenderId: "554652769352",
  appId: "1:554652769352:web:880f69ebbb2ccf98c1cc7d",
  measurementId: "G-LNJK5E3T3E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
