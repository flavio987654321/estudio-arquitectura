import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDl0kaY9lYFwWZ6ZtiuJdtcWXXWKiUAwGk",
  authDomain: "silmare-b20a2.firebaseapp.com",
  projectId: "silmare-b20a2",
  storageBucket: "silmare-b20a2.firebasestorage.app",
  messagingSenderId: "937811189887",
  appId: "1:937811189887:web:6294add1fd38712b5a9f4a",
  measurementId: "G-S08749Y8DK"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
