# Documentation Index

Complete guide to all documentation files in the IWOOT project.

## 🚀 Getting Started

**New to the project?** Start here:

1. **`README.md`** (root) - Quick start and overview
   - Quick setup guide
   - Firebase configuration
   - Security rules
   - Troubleshooting

2. **`docs/SETUP_INSTRUCTIONS.md`** - Complete step-by-step setup
   - Prerequisites
   - Firebase setup
   - Environment variables
   - Security rules
   - Troubleshooting

## 📖 Learning Resources

**Want to understand the code?** Read these:

1. **`docs/CONCEPTS.md`** - Key concepts explained
   - React (hooks, components, state)
   - Next.js (App Router, SSR, routing)
   - Firebase (Auth, Firestore, Storage)
   - TypeScript (types, interfaces)
   - Design patterns

2. **`docs/ARCHITECTURE.md`** - Current layers (UI → services → API → Admin SDK)
   - Inventory in Firestore vs static `lib/data`
   - What not to commit (seed APIs, Admin scripts)

3. **`docs/DEVELOPER_GUIDE.md`** - Comprehensive developer guide
   - File-by-file breakdown
   - Common patterns
   - Best practices
   - Debugging tips

4. **`docs/QUICK_REFERENCE.md`** - Code snippets
   - Common operations
   - Quick lookup
   - Examples

## 🛒 Products & resale

**Product data and second-hand workflows:**

1. **`docs/PRODUCT_LOOKUP.md`** - Product auto-fill feature
   - Search by name or barcode
   - Extract info from URLs
   - Troubleshooting

2. **`docs/SELLING_AND_COMPARE.md`** - Resale journey & price compare
   - Dashboard selling journey card
   - Stores, “I have” products, images, listing fields
   - `/sell-compare` hub (Sonos Move, Nebula, AirPods, …)

3. **`docs/MCP.md`** - Claude / ChatGPT MCP connector for inventory + listings

3. **`docs/FIRESTORE_PRODUCT_EXAMPLE.md`** - Example `products` document (field shapes, legacy `images`)

## 🔐 Security & Configuration

**Security and setup guides:**

1. **`docs/SECURITY.md`** - Security audit and best practices
   - Security audit results
   - Vulnerabilities and mitigations
   - Security checklist
   - Best practices

2. **`docs/FIRESTORE_RULES.md`** - Firestore security rules (console **or** `firebase deploy --only firestore:rules`)
   - Complete rules explanation
   - Step-by-step setup
   - Troubleshooting

3. **`docs/FIREBASE_SETUP.md`** - Firebase configuration
   - Quick reference
   - Troubleshooting
   - Checklist

4. **`docs/FIREBASE_STORAGE_SETUP.md`** - Storage setup
   - Enable Storage
   - Security rules
   - Image upload guide

## 📋 Project Information

1. **`docs/PROJECT_OVERVIEW.md`** - Project overview
   - Features
   - Technology stack
   - Architecture

## 📁 Documentation Structure

```
docs/
├── SETUP_INSTRUCTIONS.md      # Main setup guide
├── CONCEPTS.md                # Concepts explained
├── ARCHITECTURE.md            # Architecture & patterns
├── DEVELOPER_GUIDE.md         # Developer guide
├── QUICK_REFERENCE.md         # Code snippets
├── SECURITY.md                # Security audit
├── FIRESTORE_RULES.md         # Security rules
├── FIREBASE_SETUP.md          # Firebase config
├── FIREBASE_STORAGE_SETUP.md  # Storage setup
├── PRODUCT_LOOKUP.md          # Product auto-fill feature
├── SELLING_AND_COMPARE.md     # Marketplace selling UX & compare pages
├── FIRESTORE_PRODUCT_EXAMPLE.md # Example product document shape
├── DEPLOYMENT.md              # Vercel deployment guide
├── VERCEL_ENV_SETUP.md        # Vercel environment variables
└── PROJECT_OVERVIEW.md        # Project info

Root:
└── README.md                  # Project overview & quick start
```

## 🎯 Quick Navigation

**I want to...**

- **Set up the project** → `README.md` (root) or `docs/SETUP_INSTRUCTIONS.md`
- **Understand React/Next.js** → `docs/CONCEPTS.md`
- **Learn the architecture** → `docs/ARCHITECTURE.md`
- **Fix permission errors** → `README.md` (Firebase Configuration section)
- **Check security** → `docs/SECURITY.md`
- **Find code examples** → `docs/QUICK_REFERENCE.md`
- **Set up Firebase** → `docs/FIREBASE_SETUP.md`
- **Upload images** → `docs/FIREBASE_STORAGE_SETUP.md`
- **Product lookup / auto-fill** → `docs/PRODUCT_LOOKUP.md`
- **Sell on marketplaces / price compare** → `docs/SELLING_AND_COMPARE.md`
- **API 401 / verifyIdToken / service account** → `docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md` (API routes section)
- **Firestore product field shapes** → `docs/FIRESTORE_PRODUCT_EXAMPLE.md`

## 📝 Documentation Standards

All documentation follows these principles:

- ✅ **Step-by-step** - Clear, numbered instructions
- ✅ **Explanations** - "Why" not just "what"
- ✅ **Examples** - Code examples for every concept
- ✅ **Troubleshooting** - Common issues and solutions
- ✅ **Security** - Security considerations highlighted
- ✅ **Beginner-friendly** - No assumptions about prior knowledge

## 🔄 Keeping Documentation Updated

When making changes:

1. Update relevant documentation
2. Add examples if introducing new patterns
3. Update security docs if changing auth/data access
4. Keep step-by-step guides current
5. Add troubleshooting for new features

## 💡 Tips for Reading Documentation

1. **Start with setup** - Get the app running first
2. **Read concepts** - Understand the fundamentals
3. **Explore architecture** - See how it all fits together
4. **Reference as needed** - Use quick reference for specific tasks
5. **Check security** - Review security practices before deploying

---

**Need help?** Check the troubleshooting sections in each guide, or review the error messages in your browser console.
