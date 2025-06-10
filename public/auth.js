// THIS IS A PLACEHOLDER FOR FIREBASE CONFIGURATION
// REPLACE WITH YOUR ACTUAL FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Authentication Functions ---

// Sign Up
async function signUp(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log("User signed up:", userCredential.user);
        // You might want to create a user document in Firestore here
        await db.collection("users").doc(userCredential.user.uid).set({
            email: userCredential.user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { user: userCredential.user, error: null };
    } catch (error) {
        console.error("Sign up error:", error);
        return { user: null, error: error.message };
    }
}

// Login
async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("User logged in:", userCredential.user);
        return { user: userCredential.user, error: null };
    } catch (error) {
        console.error("Login error:", error);
        return { user: null, error: error.message };
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        console.log("User logged out");
        return { success: true, error: null };
    } catch (error) {
        console.error("Logout error:", error);
        return { success: false, error: error.message };
    }
}

// Monitor Auth State (to redirect user or update UI)
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(user => {
        callback(user);
    });
}
