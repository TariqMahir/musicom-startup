import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getStripePayments } from "@stripe/firestore-stripe-payments";

const firebaseConfig = {
  apiKey: "AIzaSyBjIZ4yPKKLPko-OqOUZBzs3u7D5-JT1Dw",
  authDomain: "musicom-d43cd.firebaseapp.com",
  projectId: "musicom-d43cd",
  storageBucket: "musicom-d43cd.appspot.com",
  messagingSenderId: "339663582383",
  appId: "1:339663582383:web:b1dc5b3da8267c78e1505a",
  measurementId: "G-0PQ0B3WMY2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const firestore = getFirestore(app);
const analytics = getAnalytics(app);
const payments = getStripePayments(app, {
  productsCollection: "products",
  customersCollection: "users",
});
export { app, db, auth, storage, firestore, analytics, payments };
