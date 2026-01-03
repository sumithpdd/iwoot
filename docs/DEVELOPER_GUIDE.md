# Developer Guide for Junior Developers

This guide is designed to help junior developers understand and work with the IWOOT codebase.

## Table of Contents

1. [Understanding the Architecture](#understanding-the-architecture)
2. [Key Concepts](#key-concepts)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Common Patterns](#common-patterns)
5. [Best Practices](#best-practices)
6. [Debugging Tips](#debugging-tips)

## Understanding the Architecture

### What is Next.js?

Next.js is a React framework that provides:
- **Server-Side Rendering (SSR)**: Pages are rendered on the server
- **File-Based Routing**: Files in `app/` directory become routes
- **API Routes**: Create backend endpoints
- **Optimization**: Automatic code splitting, image optimization, etc.

### App Router vs Pages Router

This project uses the **App Router** (Next.js 13+):
- Files in `app/` directory
- `page.tsx` = route page
- `layout.tsx` = shared layout
- `loading.tsx` = loading UI
- `error.tsx` = error UI

### Client vs Server Components

**Server Components** (default):
- Run on the server
- Can access databases directly
- Cannot use browser APIs
- No JavaScript sent to client

**Client Components** (use `"use client"`):
- Run in the browser
- Can use React hooks
- Can handle user interactions
- JavaScript sent to client

## Key Concepts

### 1. TypeScript Types

TypeScript helps catch errors before runtime. Here's how we use it:

```typescript
// Define a type
interface Product {
  id: string
  name: string
  price: number
}

// Use the type
const product: Product = {
  id: "123",
  name: "iPad",
  price: 999
}
```

### 2. React Hooks

Hooks let you use state and other React features:

```typescript
// useState - manage component state
const [count, setCount] = useState(0)

// useEffect - run code after render
useEffect(() => {
  console.log("Component mounted")
}, [])

// Custom hooks - reusable logic
const { user } = useAuth()
```

### 3. Firebase Firestore

Firestore is a NoSQL database. Think of it like this:

```
Firestore
  └── Collections (like tables)
      └── Documents (like rows)
          └── Fields (like columns)
```

Example:
```
products (collection)
  └── abc123 (document)
      ├── name: "iPad Pro"
      ├── price: 999
      └── userId: "user123"
```

### 4. Form Handling with React Hook Form

```typescript
// 1. Create form with useForm
const { register, handleSubmit, formState: { errors } } = useForm()

// 2. Register inputs
<input {...register("name")} />

// 3. Handle submission
const onSubmit = (data) => {
  console.log(data) // { name: "value" }
}

<form onSubmit={handleSubmit(onSubmit)}>
```

## File-by-File Breakdown

### `/app/layout.tsx`

**Purpose**: Root layout that wraps all pages

**Key Points**:
- Wraps entire app with `AuthProvider`
- Sets up global styles
- Defines metadata

**What to modify**: Add global navigation, footer, etc.

### `/app/page.tsx`

**Purpose**: Home page (redirects to dashboard or login)

**Key Points**:
- Server component (no `"use client"`)
- Checks authentication
- Redirects based on auth status

### `/app/login/page.tsx`

**Purpose**: Login and registration page

**Key Points**:
- Client component (`"use client"`)
- Uses Firebase Auth
- Handles form submission
- Shows toast notifications

**How it works**:
1. User enters email/password
2. Form submits
3. Firebase authenticates
4. On success, redirects to dashboard
5. On error, shows toast message

### `/app/dashboard/page.tsx`

**Purpose**: Main dashboard showing products

**Key Points**:
- Uses `useAuth()` hook
- Fetches products from Firestore
- Shows tabs for "Want" vs "Have"
- Opens dialog to add/edit products

**Data Flow**:
1. Component mounts
2. Checks if user is authenticated
3. Fetches products for that user
4. Displays products in cards
5. User can add/edit/delete products

### `/lib/firebase/config.ts`

**Purpose**: Initialize Firebase

**Key Points**:
- Only runs on client (checks `typeof window`)
- Exports `auth` and `db` for use throughout app
- Uses environment variables for config

**Why check `typeof window`?**
- Server-side rendering doesn't have `window`
- Firebase client SDK needs browser environment

### `/lib/firebase/products.ts`

**Purpose**: All database operations for products

**Functions**:

```typescript
// Get all products for a user
getProducts(userId: string, type?: "want" | "have")

// Get single product
getProduct(productId: string)

// Create new product
createProduct(product: Product)

// Update existing product
updateProduct(productId: string, updates: Partial<Product>)

// Delete product
deleteProduct(productId: string)

// Add price history entry
addPriceHistory(productId: string, price: number, website: string)
```

**How to use**:
```typescript
import { getProducts } from "@/lib/firebase/products"

const products = await getProducts(user.uid, "want")
```

### `/lib/auth-context.tsx`

**Purpose**: Provide authentication state to all components

**How it works**:
1. Wraps app in `AuthProvider`
2. Listens to Firebase auth state changes
3. Provides `user` and `signOut` via `useAuth()` hook

**Usage**:
```typescript
const { user, loading, signOut } = useAuth()

if (loading) return <Loading />
if (!user) return <Login />
```

### `/components/product-dialog.tsx`

**Purpose**: Form to add/edit products

**Key Points**:
- Uses React Hook Form
- Validates with Zod
- Handles both create and update
- Shows errors inline

**Form Flow**:
1. User opens dialog
2. Form loads with existing data (if editing) or empty
3. User fills form
4. Zod validates on submit
5. If valid, saves to Firestore
6. Shows success/error toast
7. Closes dialog and refreshes list

### `/components/product-list.tsx`

**Purpose**: Display list of products

**Key Points**:
- Receives products as props
- Maps over products to show cards
- Each card has edit/delete buttons
- Shows price comparison

**Props**:
```typescript
interface ProductListProps {
  products: Product[]      // Array of products to display
  type: "want" | "have"  // Type of products
  onEdit: (product) => void  // Called when edit clicked
  onDelete: () => void   // Called after delete (to refresh)
}
```

## Common Patterns

### Pattern 1: Loading States

```typescript
const [loading, setLoading] = useState(true)

useEffect(() => {
  loadData().finally(() => setLoading(false))
}, [])

if (loading) return <LoadingSpinner />
return <Content />
```

### Pattern 2: Error Handling

```typescript
try {
  await someOperation()
  toast({ title: "Success" })
} catch (error) {
  toast({ 
    title: "Error", 
    description: error.message,
    variant: "destructive" 
  })
}
```

### Pattern 3: Conditional Rendering

```typescript
{products.length === 0 ? (
  <EmptyState />
) : (
  <ProductList products={products} />
)}
```

### Pattern 4: Form Validation

```typescript
const schema = z.object({
  name: z.string().min(1, "Required"),
  price: z.number().positive("Must be positive")
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})

<input {...register("name")} />
{errors.name && <p>{errors.name.message}</p>}
```

## Best Practices

### 1. Always Check Authentication

```typescript
const { user } = useAuth()
if (!user) return <Redirect to="/login" />
```

### 2. Handle Loading States

```typescript
const [loading, setLoading] = useState(true)
// ... fetch data
setLoading(false)
```

### 3. Show User Feedback

```typescript
toast({ title: "Success", description: "Product saved!" })
```

### 4. Validate User Input

Always use Zod schemas for form validation.

### 5. Type Everything

Use TypeScript types for all data structures.

### 6. Error Boundaries

Wrap components that might fail:

```typescript
try {
  // risky operation
} catch (error) {
  console.error(error)
  toast({ title: "Error", variant: "destructive" })
}
```

## Debugging Tips

### 1. Use Console.log Strategically

```typescript
console.log("Products:", products)
console.log("User:", user)
```

### 2. Check Browser DevTools

- **Console**: See errors and logs
- **Network**: Check API calls
- **React DevTools**: Inspect component state

### 3. Firebase Console

- Check Firestore data
- View authentication users
- Check security rules

### 4. Common Errors

**"Cannot read property of undefined"**
- Check if data exists before accessing
- Use optional chaining: `product?.name`

**"Firebase permission denied"**
- Check security rules
- Verify user is authenticated
- Check userId matches

**"Module not found"**
- Run `npm install`
- Check import paths
- Restart dev server

### 5. Debugging Steps

1. **Read the error message** - It usually tells you what's wrong
2. **Check the console** - Browser and terminal
3. **Add console.logs** - See what data you're working with
4. **Check Firebase Console** - Verify data exists
5. **Check network tab** - See if requests are failing
6. **Ask for help** - Share error message and code

## Quick Reference

### Import Paths

```typescript
// Components
import { Button } from "@/components/ui/button"

// Utilities
import { cn } from "@/lib/utils"

// Firebase
import { auth, db } from "@/lib/firebase/config"
import { getProducts } from "@/lib/firebase/products"

// Types
import { Product } from "@/lib/types/product"

// Hooks
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
```

### Common Firebase Operations

```typescript
// Get collection
const snapshot = await getDocs(collection(db, "products"))

// Get document
const doc = await getDoc(doc(db, "products", id))

// Add document
await addDoc(collection(db, "products"), data)

// Update document
await updateDoc(doc(db, "products", id), updates)

// Delete document
await deleteDoc(doc(db, "products", id))
```

### Common React Patterns

```typescript
// State
const [value, setValue] = useState(initial)

// Effect
useEffect(() => {
  // code
}, [dependencies])

// Form
const { register, handleSubmit } = useForm()
```

---

**Remember**: It's okay to make mistakes! Every developer does. The important thing is to learn from them. 🚀

