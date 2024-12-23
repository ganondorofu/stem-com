import { getFirestore } from "firebase/firestore";
import { app } from "./app";

// Initialize Firestore
export const db = getFirestore(app);