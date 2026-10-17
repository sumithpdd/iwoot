import fs from "fs"
import path from "path"
import admin from "firebase-admin"

let initialized = false

/** Google-downloaded JSON uses snake_case; `admin.ServiceAccount` uses camelCase. */
type GoogleServiceAccountFile = {
  project_id?: string
  private_key?: string
  client_email?: string
  projectId?: string
  privateKey?: string
  clientEmail?: string
}

/**
 * Env-based JSON often stores `private_key` with literal `\n` instead of newlines,
 * which breaks `credential.cert()` and surfaces as `app/invalid-app-options` on verifyIdToken.
 */
function parseServiceAccountFromUnknown(raw: unknown): admin.ServiceAccount {
  const o = raw as GoogleServiceAccountFile
  const projectId = String(o.project_id ?? o.projectId ?? "").trim()
  let privateKey = String(o.private_key ?? o.privateKey ?? "")
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n")
  }
  const clientEmail = String(o.client_email ?? o.clientEmail ?? "").trim()
  if (!projectId || !privateKey || !clientEmail) {
    throw new Error(
      "[firebase-admin] Service account JSON must include project_id, private_key, and client_email"
    )
  }
  return { projectId, privateKey, clientEmail }
}

function readServiceAccountFile(filePath: string): admin.ServiceAccount {
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath)
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `[firebase-admin] Service account file not found: ${resolved}`
    )
  }
  const raw = fs.readFileSync(resolved, "utf8")
  return parseServiceAccountFromUnknown(JSON.parse(raw))
}

export function getAdminApp(): admin.app.App {
  // Next.js HMR resets this module's `initialized` flag while the Admin SDK
  // singleton may already exist — reusing it avoids `app/invalid-app-options` / 401s.
  if (admin.apps.length > 0) {
    initialized = true
    return admin.app()
  }

  const bucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET

  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()

  let cred: admin.ServiceAccount | undefined

  if (explicitPath) {
    cred = readServiceAccountFile(explicitPath)
  } else if (jsonEnv) {
    try {
      cred = parseServiceAccountFromUnknown(JSON.parse(jsonEnv))
    } catch (e) {
      console.error(
        "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.",
        e
      )
      throw new Error(
        "Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Prefer FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json"
      )
    }
  } else if (gacPath) {
    cred = readServiceAccountFile(gacPath)
  }

  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  if (cred?.projectId && publicProjectId && cred.projectId !== publicProjectId) {
    throw new Error(
      `[firebase-admin] Service account project_id "${cred.projectId}" does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID "${publicProjectId}". Download a new key from the same Firebase project or fix .env.local.`
    )
  }

  const initOptions: admin.AppOptions = {
    projectId: cred?.projectId || publicProjectId || undefined,
  }
  if (bucket) {
    initOptions.storageBucket = bucket
  }

  if (cred) {
    admin.initializeApp({
      ...initOptions,
      credential: admin.credential.cert(cred),
    })
  } else {
    admin.initializeApp({
      ...initOptions,
      credential: admin.credential.applicationDefault(),
    })
  }

  initialized = true
  return admin.app()
}

export function getAdminFirestore() {
  return getAdminApp().firestore()
}

export function getAdminAuth() {
  return getAdminApp().auth()
}

export function getAdminBucket() {
  const name =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET
  if (!name) {
    throw new Error("Storage bucket not configured (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)")
  }
  return getAdminApp().storage().bucket(name)
}
