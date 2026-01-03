# Architecture & Design Patterns

This document explains the architecture, design patterns, and code organization used in the IWOOT application.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Design Patterns](#design-patterns)
3. [Code Organization](#code-organization)
4. [Key Concepts](#key-concepts)
5. [Data Flow](#data-flow)

## Project Structure

```
iwoot/
├── app/                    # Next.js App Router (pages)
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── admin/             # Admin page
│   └── layout.tsx         # Root layout
│
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── product-dialog.tsx # Product form dialog
│   ├── product-list.tsx  # Product list display
│   └── ...
│
├── lib/                   # Core libraries and utilities
│   ├── firebase/         # Firebase integration (Repository Layer)
│   │   ├── config.ts     # Firebase initialization
│   │   ├── products.ts   # Product CRUD operations
│   │   ├── receipts.ts   # Receipt CRUD operations
│   │   └── storage.ts    # Image upload operations
│   │
│   ├── services/         # Business Logic Layer
│   │   ├── product.service.ts
│   │   └── receipt.service.ts
│   │
│   ├── validators/        # Validation logic
│   │   ├── product.validator.ts
│   │   └── receipt.validator.ts
│   │
│   ├── hooks/            # Custom React hooks
│   │   └── use-products.ts
│   │
│   ├── types/            # TypeScript type definitions
│   │   ├── product.ts
│   │   └── receipt.ts
│   │
│   └── utils.ts          # Utility functions
│
└── docs/                 # Documentation
```

## Design Patterns

### 1. Service Layer Pattern

**Purpose**: Separate business logic from UI and data access layers.

**Location**: `lib/services/`

**Example**:
```typescript
// lib/services/product.service.ts
export class ProductService {
  static async createProduct(productData) {
    // 1. Validate input
    const validation = validateProduct(productData)
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "))
    }
    
    // 2. Call repository
    return await productRepository.createProduct(productData)
  }
}
```

**Benefits**:
- Centralized business logic
- Easier to test
- Reusable across components
- Single source of truth for operations

### 2. Repository Pattern

**Purpose**: Abstract data access layer from business logic.

**Location**: `lib/firebase/`

**Example**:
```typescript
// lib/firebase/products.ts
export async function createProduct(product) {
  // Direct Firebase operations
  const docRef = await addDoc(collection(db, "products"), productData)
  return docRef.id
}
```

**Benefits**:
- Database-agnostic business logic
- Easy to swap data sources
- Centralized data access

### 3. Custom Hooks Pattern

**Purpose**: Encapsulate component logic and state management.

**Location**: `lib/hooks/`

**Example**:
```typescript
// lib/hooks/use-products.ts
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  
  const loadProducts = async () => {
    setLoading(true)
    const data = await ProductService.getProducts(userId)
    setProducts(data)
    setLoading(false)
  }
  
  return { products, loading, loadProducts }
}
```

**Benefits**:
- Reusable logic across components
- Clean component code
- Easy to test

### 4. Validation Layer

**Purpose**: Centralized input validation.

**Location**: `lib/validators/`

**Example**:
```typescript
// lib/validators/product.validator.ts
export function validateProduct(product) {
  const errors = []
  if (!product.name) errors.push("Name required")
  if (product.price <= 0) errors.push("Price must be positive")
  return { valid: errors.length === 0, errors }
}
```

**Benefits**:
- Consistent validation
- Reusable validation rules
- Clear error messages

## Code Organization

### Layer Separation

The application follows a **layered architecture**:

```
┌─────────────────────────────────┐
│   Presentation Layer            │  ← Components (UI)
│   (React Components)            │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Business Logic Layer          │  ← Services
│   (Business Rules, Validation)  │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Data Access Layer             │  ← Repositories (Firebase)
│   (Database Operations)         │
└─────────────────────────────────┘
```

### Component Structure

**Smart Components** (Container Components):
- Manage state
- Handle business logic
- Connect to services
- Example: `app/dashboard/page.tsx`

**Dumb Components** (Presentational Components):
- Receive props
- Display data
- Emit events
- Example: `components/product-list.tsx`

### File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `product-dialog.tsx`)
- **Services**: `kebab-case.service.ts` (e.g., `product.service.ts`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-products.ts`)
- **Types**: `kebab-case.ts` (e.g., `product.ts`)
- **Utils**: `kebab-case.ts` (e.g., `product.validator.ts`)

## Key Concepts

### 1. Client-Side Authentication

**Why**: Firebase Auth handles authentication client-side, providing secure token management.

**How it works**:
1. User logs in via Firebase Auth
2. Firebase returns an ID token
3. Token is stored in browser
4. Token is sent with every Firestore request
5. Firestore security rules validate the token

**Location**: `lib/auth-context.tsx`

### 2. Security Rules

**Purpose**: Database-level security to prevent unauthorized access.

**Location**: Firebase Console → Firestore → Rules

**Pattern**:
```javascript
match /products/{productId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if request.auth.uid == request.resource.data.userId;
}
```

### 3. Environment Variables

**Purpose**: Keep sensitive data out of source code.

**Pattern**: All Firebase config uses `NEXT_PUBLIC_*` environment variables.

**Location**: `.env.local` (not committed to Git)

### 4. Type Safety

**Purpose**: Catch errors at compile time.

**Pattern**: TypeScript interfaces for all data structures.

**Example**:
```typescript
interface Product {
  id: string
  name: string
  price: number
  // ...
}
```

## Data Flow

### Creating a Product

```
1. User fills form (ProductDialog)
   ↓
2. Form validation (Zod schema)
   ↓
3. Component calls ProductService.createProduct()
   ↓
4. Service validates data (product.validator.ts)
   ↓
5. Service calls productRepository.createProduct()
   ↓
6. Repository saves to Firestore
   ↓
7. Success/Error returned to component
   ↓
8. Component shows toast notification
   ↓
9. Component reloads product list
```

### Loading Products

```
1. Component mounts (Dashboard)
   ↓
2. Component calls useProducts() hook
   ↓
3. Hook calls ProductService.getProducts()
   ↓
4. Service calls productRepository.getProducts()
   ↓
5. Repository queries Firestore
   ↓
6. Data returned through layers
   ↓
7. Hook updates state
   ↓
8. Component re-renders with data
```

## Best Practices

### ✅ DO

- Use services for business logic
- Validate all inputs
- Handle errors gracefully
- Use TypeScript types
- Keep components focused
- Use custom hooks for reusable logic
- Follow naming conventions

### ❌ DON'T

- Put business logic in components
- Access Firebase directly from components
- Skip validation
- Hardcode credentials
- Mix concerns (UI + business logic)
- Ignore TypeScript errors

## Next Steps

- Read `docs/DEVELOPER_GUIDE.md` for detailed coding guidelines
- Check `docs/SECURITY.md` for security best practices
- Review `docs/QUICK_REFERENCE.md` for code snippets

