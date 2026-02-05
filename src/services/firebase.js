import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD1uU27aXfdcVaRWAxmj8Md-fQld7E48Dc",
  authDomain: "tontine-pour-tous.firebaseapp.com",
  projectId: "tontine-pour-tous",
  storageBucket: "tontine-pour-tous.firebasestorage.app",
  messagingSenderId: "49437145671",
  appId: "1:49437145671:web:bda8e0747ec16283600f62",
  measurementId: "G-VCQB93KYZB"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
