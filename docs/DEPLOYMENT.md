# Deployment Guide - Vercel

This guide will help you deploy IWOOT to Vercel.

## Prerequisites

- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Vercel CLI installed (`npm i -g vercel` or already installed)
- ✅ Firebase project configured
- ✅ Environment variables ready

## Deployment Methods

### Method 1: Vercel CLI (Recommended for First Deployment)

#### Step 1: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

#### Step 2: Deploy to Vercel

From your project root:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (for first deployment)
- **Project name?** → `iwoot` (or your preferred name)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

#### Step 3: Set Environment Variables

After deployment, you need to add your Firebase environment variables:

**Option A: Via Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

5. Select **Production**, **Preview**, and **Development** environments
6. Click **Save**

**Option B: Via CLI**

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# Paste your value when prompted
# Select: Production, Preview, Development

# Repeat for each variable:
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

#### Step 4: Redeploy with Environment Variables

After adding environment variables, redeploy:

```bash
vercel --prod
```

Or trigger a new deployment from the Vercel dashboard.

### Method 2: GitHub Integration (Recommended for Continuous Deployment)

#### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/iwoot.git
git push -u origin main
```

#### Step 2: Import Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

#### Step 3: Add Environment Variables

Before deploying, add all environment variables in the project settings (same as Method 1, Step 3).

#### Step 4: Deploy

Click **Deploy**. Vercel will:
- Install dependencies
- Build your Next.js app
- Deploy to production

Every push to your main branch will trigger a new deployment automatically.

## Post-Deployment Checklist

- [ ] Environment variables added to Vercel
- [ ] Firebase Security Rules configured
- [ ] Firebase Storage Rules configured
- [ ] Test authentication (login/signup)
- [ ] Test product creation
- [ ] Test image upload
- [ ] Verify Firebase Analytics (if enabled)

## Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Domains**
3. Add your domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Check that `npm install` completes successfully locally

**Error: "Environment variable not found"**
- Verify all `NEXT_PUBLIC_*` variables are set in Vercel
- Redeploy after adding variables

### Runtime Errors

**Error: "Firebase configuration is missing"**
- Check environment variables in Vercel dashboard
- Ensure variables are set for Production environment
- Redeploy after adding variables

**Error: "Missing or insufficient permissions"**
- Verify Firestore Security Rules are published
- Verify Storage Security Rules are published
- Check that rules allow authenticated users

### Firebase CORS Issues

If you see CORS errors:
1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to **Authorized domains**
3. Format: `your-app.vercel.app` or your custom domain

## Environment Variables Reference

All required environment variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Vercel CLI Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View project info
vercel inspect

# Remove deployment
vercel remove [deployment-url]

# View logs
vercel logs [deployment-url]
```

## Next Steps

After successful deployment:
1. Test all features on the production URL
2. Set up monitoring (Vercel Analytics)
3. Configure custom domain (optional)
4. Set up preview deployments for pull requests
5. Enable Vercel Analytics for performance monitoring

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

