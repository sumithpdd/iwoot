# Firebase service account (Storage CORS and local API routes)

## Why this exists

- **Storage CORS**: administrative access to set CORS on your GCS bucket.
- **Next.js `/api/*` routes**: Firebase Admin verifies ID tokens; it needs a service account from the **same** Firebase project as your web app (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`).

Never commit key files or paste private keys into chat, tickets, or public repos.

## Step 1: Generate a service account key

1. Open [Firebase Console](https://console.firebase.google.com/) and select **your** project.
2. **Project settings** (gear) → **Service accounts**.
3. **Generate new private key** and confirm the download.

## Step 2: Store the key outside version control

**Recommended (local dev)**  
1. Rename the file to `firebase-service-account.json`.  
2. Put it in the **project root** (same folder as `package.json`).  
3. Ensure it stays **gitignored** (see repository `.gitignore`).

**Alternative (path outside the repo)**  
1. Save the JSON somewhere **outside** the cloned repo (e.g. a folder you use only for secrets on your machine).  
2. Point the app or tools at it with an environment variable (examples use a **placeholder** path only):

   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="D:\secrets\firebase\your-service-account.json"
   ```

   Use **your** real path locally; do not commit that line with a real path into the repo.

For Next.js Admin verification, prefer in `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
```

(or the env vars described in the root `README.md` under Firebase / local development).

## Step 3: `.gitignore` (this repository)

The repo ignores common credential filenames. **Do not** add a blanket `*.json` rule (that would ignore `package.json`, `tsconfig.json`, etc.). If you keep keys under a folder name such as `firebase-keys/` inside the repo, that folder name is ignored by policy here—prefer keeping keys **outside** the repo or only `firebase-service-account.json` in root as documented.

## Step 4: Grant Storage Admin (for CORS script only)

1. [Google Cloud Console](https://console.cloud.google.com/) → select the **same** project.
2. **IAM & Admin** → **IAM** → your service account email → **Edit** → **Add role** → **Storage Admin** → **Save**.

## Step 5: Run the CORS setup script

Set **your** project and bucket (from Firebase → **Project settings** and **Storage**), then run:

```powershell
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
node setup-cors.js
```

Bucket hostnames often look like `PROJECT_ID.firebasestorage.app` or `PROJECT_ID.appspot.com`—use exactly what the console shows.

Expected output: confirmation that CORS was applied.

## Security notes

- Do not commit service account JSON or `.env.local`.
- Rotate (delete and regenerate) a key if it was ever exposed.
- Keys grant broad access to the linked GCP/Firebase project.

## Troubleshooting

- **Permission denied** — Ensure **Storage Admin** (or sufficient role) on that service account; allow a few minutes for IAM to propagate.
- **Could not load credentials** — Check path, file validity, and `GOOGLE_APPLICATION_CREDENTIALS` / key file in project root.
- **Bucket not found** — Bucket name must match **Storage** in the console for that project.

## Alternative: `gsutil`

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_HOSTNAME
```

Use your real `YOUR_PROJECT_ID` and bucket URI from the console.

---

## API routes (`/api/*`) and `verifyIdToken` / 401

Next.js API routes use the **Firebase Admin** SDK to verify the user’s **ID token** (`Authorization: Bearer …`). See `lib/server/require-auth.ts` and `lib/server/firebase-admin.ts`.

If logs show `verifyIdToken failed: app/invalid-app-options`, common causes are:

1. Service account JSON is for a **different** project than `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
2. **`private_key`** mangled in a one-line `FIREBASE_SERVICE_ACCOUNT_JSON` (escaped `\n`). Prefer `FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json` in `.env.local`.
3. Restart `npm run dev` after fixing credentials.
4. **Intermittent 401 after routes compile** — Next.js HMR can break Admin init. Prefer `FIREBASE_SERVICE_ACCOUNT_PATH` over a one-line `FIREBASE_SERVICE_ACCOUNT_JSON`, and fully restart the dev server (`Ctrl+C`, then `npm run dev`) if APIs flip from 200 → 401.

See **`docs/FIRESTORE_PRODUCT_EXAMPLE.md`** for an example Firestore `products` document shape (no real user data).
