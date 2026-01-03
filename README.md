# IWOOT - Price Tracker Application

**I Want One Of Those** and **I Have One Of Those** - A Next.js application for tracking product prices.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Guide](#setup-guide)
- [Firebase Configuration](#firebase-configuration)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Get these values from**: Firebase Console → Project Settings → Your apps → Web app config

### 3. Configure Firebase Security Rules

**⚠️ CRITICAL**: You must set security rules or you'll get permission errors!

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Firestore Database** → **Rules** tab
3. Paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    match /products/{productId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId) && request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }
    match /receipts/{receiptId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId) && request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

4. Click **Publish**

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✨ Features

### Product Tracking
- **"I Want One Of Those"**: Track products you want to buy, monitor prices, set target prices
- **"I Have One Of Those"**: Track products you own, record purchase prices, monitor current values

### Additional Features
- 📸 Image uploads (Firebase Storage)
- 📊 Price history tracking
- 🧾 Receipt management
- 🔍 Search functionality
- 📱 Responsive design
- 🔐 Secure authentication

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Icons**: Lucide React

## 📖 Setup Guide

### Prerequisites

- Node.js 18+ and npm
- Firebase account (free tier works)
- Code editor (VS Code recommended)

### Step-by-Step Setup

#### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org/) (LTS version)

#### 2. Clone/Download Project
```bash
git clone [repository-url]
cd iwoot
```

#### 3. Install Dependencies
```bash
npm install
```

#### 4. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → Enter name → Continue
3. **Enable Authentication**:
   - Click **Authentication** → **Get started**
   - Select **Email/Password** → Enable → Save
4. **Create Firestore Database**:
   - Click **Firestore Database** → **Create database**
   - Choose **Start in test mode** → Select location → Enable
5. **Enable Storage** (for image uploads):
   - Click **Storage** → **Get started**
   - Choose **Start in test mode** → Select location → Done

#### 5. Get Firebase Configuration

1. Firebase Console → ⚙️ **Project settings**
2. Scroll to **"Your apps"** → Click **Web icon** (`</>`)
3. Register app (name: `iwoot-web`)
4. Copy the `firebaseConfig` values

#### 6. Create `.env.local`

Create `.env.local` in project root with your Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=iwoot-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=iwoot-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=iwoot-xxxxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXX
```

#### 7. Set Security Rules

See [Firebase Configuration](#firebase-configuration) section above.

#### 8. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔥 Firebase Configuration

### Firestore Security Rules

Set in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    match /products/{productId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId) && request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }
    match /receipts/{receiptId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId) && request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

### Storage Security Rules

Set in Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    match /products/{userId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if isOwner(userId);
    }
    match /receipts/{userId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if isOwner(userId);
    }
  }
}
```

## 🚀 Deployment

### Deploy to Vercel

Your app can be deployed to Vercel! 🎉

#### Important: Add Environment Variables

Before the app works, you need to add Firebase environment variables in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Select your project → **Settings** → **Environment Variables**
2. Add all Firebase environment variables (same as `.env.local`)
3. Select **Production**, **Preview**, and **Development** environments
4. Redeploy: Go to **Deployments** → Click **⋯** → **Redeploy**

For detailed instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

#### Quick Deploy Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls
```

## 📁 Project Structure

```
iwoot/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # Main dashboard
│   ├── login/             # Login/Register
│   └── layout.tsx         # Root layout
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── product-dialog.tsx
│   ├── product-list.tsx
│   ├── receipt-dialog.tsx
│   └── search-bar.tsx
│
├── lib/                  # Utilities
│   ├── firebase/        # Firebase config & operations
│   ├── services/        # Business logic layer
│   ├── validators/      # Validation schemas
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── auth-context.tsx # Auth context
│
├── docs/                # Detailed documentation
├── public/              # Static assets
└── package.json         # Dependencies
```

## 💻 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding shadcn/ui Components

```bash
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add alert
```

### Code Architecture

- **Service Layer**: Business logic (`lib/services/`)
- **Validation Layer**: Zod schemas (`lib/validators/`)
- **Firebase Layer**: Database operations (`lib/firebase/`)
- **Components**: UI components (`components/`)
- **Hooks**: Custom React hooks (`lib/hooks/`)

## 🐛 Troubleshooting

### "Missing or insufficient permissions"
- ✅ Set Firestore security rules (see [Firebase Configuration](#firebase-configuration))
- ✅ Verify you're logged in
- ✅ Check rules were published

### "Firebase: Error (auth/configuration-not-found)"
- ✅ Check `.env.local` exists in project root
- ✅ Verify all variables start with `NEXT_PUBLIC_`
- ✅ Restart dev server after creating/updating `.env.local`

### "Permission denied" when uploading images
- ✅ Set Storage security rules (see [Firebase Configuration](#firebase-configuration))
- ✅ Check file size is under 5MB
- ✅ Verify file is an image type

### Module not found errors
```bash
npm install
```

### Styles not loading
- ✅ Check `tailwind.config.ts` includes content paths
- ✅ Ensure `globals.css` imports Tailwind directives
- ✅ Restart dev server

## 📚 Documentation

### Quick Reference
- **Setup**: This README
- **Architecture**: `docs/ARCHITECTURE.md`
- **Concepts**: `docs/CONCEPTS.md`
- **Security**: `docs/SECURITY.md`
- **Developer Guide**: `docs/DEVELOPER_GUIDE.md`
- **Quick Reference**: `docs/QUICK_REFERENCE.md`

### Detailed Guides
- `docs/SETUP_INSTRUCTIONS.md` - Complete setup walkthrough
- `docs/FIREBASE_SETUP.md` - Firebase configuration details
- `docs/FIRESTORE_RULES.md` - Security rules explanation
- `docs/FIREBASE_STORAGE_SETUP.md` - Storage setup guide

## 🔒 Security Notes

- ✅ Never commit `.env.local` (already in `.gitignore`)
- ✅ Use different Firebase projects for dev/production
- ✅ Security rules enforce user data isolation
- ✅ All operations require authentication

## 📄 License

MIT License

---

**Happy Coding! 🚀**
