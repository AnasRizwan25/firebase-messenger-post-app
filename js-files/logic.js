// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getFirestore,orderBy,onSnapshot,increment,serverTimestamp, doc, setDoc, getDoc,deleteDoc, collection, query, where, getDocs, limit,addDoc,updateDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, updateProfile, sendPasswordResetEmail,sendEmailVerification,deleteUser , createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBA--6byAbbK2oihnWcKWERAOXR-NW5LE8",
  authDomain: "social-media-advanced-1.firebaseapp.com",
  projectId: "social-media-advanced-1",
  storageBucket: "social-media-advanced-1.firebasestorage.app",
  messagingSenderId: "564625247459",
  appId: "1:564625247459:web:3900b1bbe1c295dbe149d6",
  measurementId: "G-YJJZ6RBQQ4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  createUserWithEmailAndPassword,orderBy,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  doc,
  setDoc,onSnapshot,
  getDoc,
  collection,increment,
  query,
  where,
  getDocs,deleteDoc,serverTimestamp,
  limit,addDoc,updateDoc,
  updateProfile, sendPasswordResetEmail,sendEmailVerification,deleteUser
};