import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCnOAZ_PSMulPqRqn9TSRgLd5y5xeGqOFg",
  authDomain: "book-swap-44e9a.firebaseapp.com",
  projectId: "book-swap-44e9a",
  storageBucket: "book-swap-44e9a.firebasestorage.app",
  messagingSenderId: "954788404256",
  appId: "1:954788404256:web:deae6c75bb82228c797045",
  measurementId: "G-WMJZ56L867"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);