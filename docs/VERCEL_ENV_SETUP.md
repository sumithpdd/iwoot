# Vercel Environment Variables Setup

## Quick Setup

Your app is deployed but needs Firebase environment variables to work.

## Step 1: Go to Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `iwoot` project
3. Go to **Settings** → **Environment Variables**

## Step 2: Add Environment Variables

Add each of these variables (click **Add** for each one):

### Required Variables:

1. **NEXT_PUBLIC_FIREBASE_API_KEY**
   - Value: Your Firebase API Key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

2. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Value: `your-project-id.firebaseapp.com`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Value: Your Firebase Project ID
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Value: `your-project-id.firebasestorage.app`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

5. **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - Value: Your Messaging Sender ID
   - Environments: ✅ Production, ✅ Preview, ✅ Development

6. **NEXT_PUBLIC_FIREBASE_APP_ID**
   - Value: Your App ID
   - Environments: ✅ Production, ✅ Preview, ✅ Development

7. **NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID** (Optional)
   - Value: Your Measurement ID (for Analytics)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

8. **FIREBASE_SERVICE_ACCOUNT_JSON** (required for `/api/*` on Vercel)
   - Value: the **full JSON** of your Firebase service account key, as a single line
   - Environments: ✅ Production, ✅ Preview
   - Do **not** use `FIREBASE_SERVICE_ACCOUNT_PATH` on Vercel (no local key file)
   - Same project as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

9. **GOOGLE_GENERATIVE_AI_API_KEY** (optional — AI assist / chat)
   - Environments: ✅ Production, ✅ Preview
10. **GEMINI_MODEL** (optional — default `gemini-flash-latest`)
   - Do not use `gemini-2.5-flash` for new Google AI Studio keys; that id is blocked for new users.
11. **IWOOT_MCP_TOKEN** (optional — Claude / ChatGPT MCP at `/api/mcp`)
   - Long random secret; Environments: ✅ Production, ✅ Preview
12. **IWOOT_MCP_USER_ID** (optional — Firebase uid for the MCP token)
   - Your signed-in user’s Firebase Auth uid; Environments: ✅ Production, ✅ Preview

## Step 3: Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or run: `vercel --prod`

## Step 4: Verify

Visit your production URL and test:
- ✅ Login/Signup works
- ✅ Products load
- ✅ Image upload works

## Alternative: Add via CLI

You can also add variables via CLI:

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production preview development
# Paste value when prompted

# Repeat for each variable
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production preview development
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production preview development
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production preview development
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production preview development
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production preview development
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production preview development
```

Then redeploy:
```bash
vercel --prod
```

