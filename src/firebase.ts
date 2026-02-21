// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7JHm1Vu5GqWxx0XJcdZaGC_UMIVysXgI",
  authDomain: "treasure-hunter-474414.firebaseapp.com",
  projectId: "treasure-hunter-474414",
  storageBucket: "treasure-hunter-474414.firebasestorage.app",
  messagingSenderId: "272231760809",
  appId: "1:272231760809:web:1d2a174dd0c86cc53ffab8",
  measurementId: "G-0XF5Z3QMKG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);


