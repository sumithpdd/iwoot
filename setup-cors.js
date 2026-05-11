/**
 * Configure CORS for Firebase Storage (Google Cloud Storage bucket).
 *
 * Prerequisites:
 *   npm install @google-cloud/storage
 *
 * Credentials: place `firebase-service-account.json` in the project root (gitignored),
 * or set GOOGLE_APPLICATION_CREDENTIALS to the absolute path of your key file.
 *
 * Required environment variables (do not hardcode project IDs in this repo):
 *   FIREBASE_PROJECT_ID          — Firebase / GCP project ID (Console → Project settings)
 *   FIREBASE_STORAGE_BUCKET      — Full bucket name (Console → Storage), e.g. YOUR_PROJECT_ID.firebasestorage.app
 *
 * PowerShell example:
 *   $env:FIREBASE_PROJECT_ID="your-project-id"
 *   $env:FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
 *   node setup-cors.js
 */

const { Storage } = require("@google-cloud/storage")
const path = require("path")
const fs = require("fs")

const PROJECT_ID = (process.env.FIREBASE_PROJECT_ID || "").trim()
const BUCKET_NAME = (process.env.FIREBASE_STORAGE_BUCKET || "").trim()

const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
  path.join(__dirname, "firebase-service-account.json")

const corsConfig = [
  {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      // Add production origins when deploying
      // "https://your-app.example.com",
    ],
    method: ["GET", "HEAD", "PUT", "POST", "DELETE"],
    responseHeader: ["Content-Type", "Authorization", "x-goog-resumable"],
    maxAgeSeconds: 3600,
  },
]

async function setCorsConfiguration() {
  if (!PROJECT_ID || !BUCKET_NAME) {
    console.error(`
Missing environment variables.

Set before running:
  FIREBASE_PROJECT_ID       (Firebase project ID)
  FIREBASE_STORAGE_BUCKET   (bucket hostname from Firebase → Storage)

PowerShell:
  $env:FIREBASE_PROJECT_ID="your-project-id"
  $env:FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
  node setup-cors.js
`)
    process.exit(1)
  }

  try {
    console.log(`Project: ${PROJECT_ID}`)
    console.log(`Bucket:  ${BUCKET_NAME}`)

    let storageConfig = { projectId: PROJECT_ID }

    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.log(`Using key file: ${SERVICE_ACCOUNT_PATH}`)
      storageConfig.keyFilename = SERVICE_ACCOUNT_PATH
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
      console.log(
        `Using GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
      )
    } else {
      console.log("No firebase-service-account.json in project root; using default credentials if configured.")
    }

    const storage = new Storage(storageConfig)
    const bucket = storage.bucket(BUCKET_NAME)

    const [exists] = await bucket.exists()
    if (!exists) {
      console.error(`Error: bucket does not exist or no access: ${BUCKET_NAME}`)
      process.exit(1)
    }

    await bucket.setCorsConfiguration(corsConfig)
    console.log("CORS configuration updated successfully.")
    console.log(JSON.stringify(corsConfig, null, 2))
    console.log("\nChanges may take a minute or two to propagate.")
  } catch (error) {
    console.error("Error setting CORS configuration:", error.message)

    if (
      error.message.includes("Could not load the default credentials") ||
      error.message.includes("invalid_grant") ||
      error.message.includes("Could not refresh access token")
    ) {
      console.log("\nUse a service account key:")
      console.log("  Firebase Console → Project settings → Service accounts → Generate new private key")
      console.log("  Save as firebase-service-account.json in this directory, or set GOOGLE_APPLICATION_CREDENTIALS.")
    }

    if (error.message.includes("Permission denied")) {
      console.log("\nGrant the service account the Storage Admin role (Google Cloud Console → IAM).")
    }

    process.exit(1)
  }
}

setCorsConfiguration()
