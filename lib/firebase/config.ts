import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"
import { getStorage, FirebaseStorage } from "firebase/storage"
import { getAnalytics, Analytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined
let analytics: Analytics | null = null

if (typeof window !== "undefined") {
  // Check if Firebase config is complete
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase configuration is missing. Please check your .env.local file.")
  } else {
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig)
      } else {
        app = getApps()[0]
      }
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)
      
      // Initialize Analytics only in browser and if measurementId is provided
      if (firebaseConfig.measurementId) {
        try {
          analytics = getAnalytics(app)
        } catch (error) {
          console.warn("Firebase Analytics initialization failed:", error)
        }
      }
    } catch (error) {
      console.error("Firebase initialization error:", error)
    }
  }
}

// Helper function to check if Firebase is initialized
export function isFirebaseInitialized(): boolean {
  return typeof window !== "undefined" && !!auth && !!db
}

export { auth, db, storage, analytics }

