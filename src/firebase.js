// Firebase initialization and exports
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQC4Qm37d4UT0NLa3YHbUX05r03_qXffk",
  authDomain: "finaldefense-a8e5f.firebaseapp.com",
  projectId: "finaldefense-a8e5f",
  storageBucket: "finaldefense-a8e5f.firebasestorage.app",
  messagingSenderId: "674994612890",
  appId: "1:674994612890:web:bbcc378388fe838d010d23"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
