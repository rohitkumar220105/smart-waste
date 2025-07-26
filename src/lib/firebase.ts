import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmvIJNQHnq6AKdIDf01s52vLZtUT2bajw",
  authDomain: "smart-waste-23f25.firebaseapp.com",
  databaseURL: "https://smart-waste-23f25-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-waste-23f25",
  storageBucket: "smart-waste-23f25.appspot.com",
  messagingSenderId: "10319189681",
  appId: "1:10319189681:web:bec1da860a6569a5bbf490"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 