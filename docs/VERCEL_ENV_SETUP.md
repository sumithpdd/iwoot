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

