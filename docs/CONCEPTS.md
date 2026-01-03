# Key Concepts Explained

This guide explains important concepts used in the IWOOT application, designed for junior developers.

## Table of Contents

1. [React Concepts](#react-concepts)
2. [Next.js Concepts](#nextjs-concepts)
3. [Firebase Concepts](#firebase-concepts)
4. [State Management](#state-management)
5. [Form Handling](#form-handling)
6. [TypeScript Concepts](#typescript-concepts)
7. [Design Patterns](#design-patterns)

## React Concepts

### What is React?

React is a JavaScript library for building user interfaces. It lets you create reusable components.

**Example**:
```tsx
// A simple React component
function ProductCard({ name, price }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>${price}</p>
    </div>
  )
}
```

### Hooks

Hooks are functions that let you "hook into" React features like state and lifecycle.

**useState** - Manages component state:
```tsx
const [count, setCount] = useState(0)
// count is the current value
// setCount is a function to update it
```

**useEffect** - Runs code after render:
```tsx
useEffect(() => {
  // This runs after the component renders
  loadProducts()
}, [userId]) // Only runs when userId changes
```

**useContext** - Accesses context values:
```tsx
const { user } = useAuth() // Gets user from AuthContext
```

### Component Lifecycle

1. **Mount** - Component is created and added to DOM
2. **Update** - Component re-renders when state/props change
3. **Unmount** - Component is removed from DOM

**Example**:
```tsx
useEffect(() => {
  // Runs on mount
  console.log("Component mounted")
  
  return () => {
    // Runs on unmount (cleanup)
    console.log("Component unmounted")
  }
}, [])
```

## Next.js Concepts

### What is Next.js?

Next.js is a React framework that adds:
- Server-side rendering
- File-based routing
- API routes
- Optimized builds

### App Router

Next.js 14 uses the App Router (file-based routing):

```
app/
  page.tsx          → / (home page)
  dashboard/
    page.tsx        → /dashboard
  login/
    page.tsx        → /login
```

### Client vs Server Components

**Server Components** (default):
- Run on server
- Can access database directly
- No JavaScript sent to browser
- Faster initial load

**Client Components** (with "use client"):
- Run in browser
- Can use hooks, state, event handlers
- Interactive components

**Example**:
```tsx
// Server Component (default)
export default function Page() {
  return <div>Static content</div>
}

// Client Component
"use client"
export default function Button() {
  const [clicked, setClicked] = useState(false)
  return <button onClick={() => setClicked(true)}>Click me</button>
}
```

### Environment Variables

Variables that change between environments (dev/prod).

**Naming**: Must start with `NEXT_PUBLIC_` for client-side access

**Usage**:
```typescript
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
```

## Firebase Concepts

### What is Firebase?

Firebase is Google's platform for building apps. It provides:
- Authentication (user login)
- Firestore (database)
- Storage (file storage)
- Hosting (deploy apps)

### Firestore Database

**What it is**: NoSQL document database (like MongoDB)

**Structure**:
```
Collection: products
  Document: product1
    Fields: { name: "iPad", price: 999 }
  Document: product2
    Fields: { name: "iPhone", price: 1299 }
```

**Operations**:
- **Read**: Get documents
- **Write**: Create/update documents
- **Delete**: Remove documents
- **Query**: Filter documents

**Example**:
```typescript
// Get all products for a user
const q = query(
  collection(db, "products"),
  where("userId", "==", userId)
)
const snapshot = await getDocs(q)
```

### Security Rules

Rules that control who can read/write data.

**Example**:
```javascript
match /products/{productId} {
  // Only allow if user owns the product
  allow read: if request.auth.uid == resource.data.userId;
}
```

**Why important**: Prevents unauthorized access even if someone bypasses client code.

### Authentication Flow

1. User enters email/password
2. Firebase Auth validates
3. Firebase returns ID token
4. Token stored in browser
5. Token sent with every request
6. Security rules validate token

## State Management

### What is State?

State is data that can change over time. When state changes, React re-renders the component.

**Local State** (component-level):
```tsx
const [count, setCount] = useState(0)
```

**Global State** (app-level):
```tsx
// Using Context
const { user } = useAuth() // Available everywhere
```

### State Updates

**Important**: State updates are asynchronous!

```tsx
// ❌ Wrong - count might not be updated yet
setCount(count + 1)
setCount(count + 1) // Still uses old count

// ✅ Right - uses previous value
setCount(prev => prev + 1)
setCount(prev => prev + 1) // Uses updated value
```

### When to Use State

- ✅ User input (form fields)
- ✅ Data from API
- ✅ UI state (loading, errors)
- ✅ Toggle states (open/closed)

- ❌ Don't use for:
  - Computed values (calculate from props)
  - Static data (constants)

## Form Handling

### React Hook Form

Library for managing forms with validation.

**Why use it**:
- Less code
- Better performance
- Built-in validation
- Easy error handling

**Example**:
```tsx
const { register, handleSubmit, formState: { errors } } = useForm()

const onSubmit = (data) => {
  console.log(data) // Form data
}

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("name", { required: true })} />
  {errors.name && <span>Name is required</span>}
</form>
```

### Zod Validation

Schema validation library. Defines what data should look like.

**Example**:
```typescript
const schema = z.object({
  name: z.string().min(1, "Name required"),
  price: z.number().positive("Price must be positive")
})

// Validate
const result = schema.safeParse(data)
if (!result.success) {
  console.log(result.error.errors)
}
```

## TypeScript Concepts

### What is TypeScript?

TypeScript is JavaScript with types. Catches errors before running code.

**Benefits**:
- Find bugs early
- Better IDE support
- Self-documenting code

### Basic Types

```typescript
let name: string = "John"
let age: number = 30
let isActive: boolean = true
let items: string[] = ["a", "b"] // Array of strings
```

### Interfaces

Define the shape of objects:

```typescript
interface Product {
  id: string
  name: string
  price: number
  images?: string[] // Optional field
}

const product: Product = {
  id: "1",
  name: "iPad",
  price: 999
}
```

### Type vs Interface

**Interface**: For objects, can be extended
**Type**: More flexible, can be unions, intersections

```typescript
// Interface
interface User {
  name: string
}

// Type
type Status = "active" | "inactive"
```

## Design Patterns

### Service Layer Pattern

Separates business logic from UI.

**Why**:
- Reusable logic
- Easier to test
- Cleaner components

**Example**:
```typescript
// Service (business logic)
class ProductService {
  static async createProduct(data) {
    validate(data) // Business rule
    return repository.create(data) // Data operation
  }
}

// Component (UI)
function ProductForm() {
  const handleSubmit = async (data) => {
    await ProductService.createProduct(data) // Use service
  }
}
```

### Repository Pattern

Abstracts data access.

**Why**:
- Database-agnostic
- Easy to swap data sources
- Centralized queries

**Example**:
```typescript
// Repository (data access)
export async function getProducts(userId) {
  return await getDocs(query(...))
}

// Service (business logic)
export class ProductService {
  static async getProducts(userId) {
    return await productRepository.getProducts(userId)
  }
}
```

### Custom Hooks Pattern

Encapsulates reusable logic.

**Why**:
- DRY (Don't Repeat Yourself)
- Clean components
- Easy to test

**Example**:
```typescript
// Hook
function useProducts() {
  const [products, setProducts] = useState([])
  const loadProducts = async () => {
    const data = await ProductService.getProducts()
    setProducts(data)
  }
  return { products, loadProducts }
}

// Component
function ProductList() {
  const { products, loadProducts } = useProducts()
  // Clean and simple!
}
```

## Common Patterns in This Project

### 1. Loading States

```tsx
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  setLoading(true)
  try {
    await doSomething()
  } finally {
    setLoading(false)
  }
}

{loading ? "Loading..." : "Submit"}
```

### 2. Error Handling

```tsx
const [error, setError] = useState<string | null>(null)

try {
  await operation()
} catch (err) {
  setError(err.message)
  toast({ title: "Error", description: err.message })
}
```

### 3. Conditional Rendering

```tsx
{user ? (
  <Dashboard />
) : (
  <Login />
)}
```

### 4. List Rendering

```tsx
{products.map(product => (
  <ProductCard key={product.id} product={product} />
))}
```

## Next Steps

- Practice: Try modifying a component
- Read: React documentation
- Experiment: Add a new feature
- Ask: Don't hesitate to ask questions!

