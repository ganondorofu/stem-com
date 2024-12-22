// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GithubAuthProvider } from "firebase/auth";

// Initialize Firebase
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// 認証サービスとその他の機能の初期化
export const auth = getAuth(app);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

// GitHub認証関数
export const signInWithGitHub = async () => {
  const provider = new GithubAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    console.log("User info:", user);
    return user;
  } catch (error) {
    console.error("Error during GitHub login:", error);
  }
};
