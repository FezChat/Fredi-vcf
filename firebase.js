// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB2jwbNHZhnWJWszdnQ-Eiud8rS0hAF1PI",
    authDomain: "fredi-ai.firebaseapp.com",
    projectId: "fredi-ai",
    storageBucket: "fredi-ai.firebasestorage.app",
    messagingSenderId: "612087815858",
    appId: "1:612087815858:web:07ebe516d46f65495af3ab",
    measurementId: "G-DCP4DKN42Z"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("✅ Firebase initialized successfully");
