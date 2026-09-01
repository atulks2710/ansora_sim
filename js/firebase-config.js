import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const firebaseConfig = {

    apiKey: "AIzaSyDKCs2W0KEcsPTiwdw1eHLdtq5zJQi4cmI",

    authDomain: "ansora-27fe4.firebaseapp.com",

    projectId: "ansora-27fe4",

    storageBucket: "ansora-27fe4.firebasestorage.app",

    messagingSenderId: "230795678686",

    appId: "1:230795678686:web:06f0ccd7b8717ac13ac34f"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);


// Firebase Authentication

export const auth = getAuth(app);


// Firestore

export const db = getFirestore(app);