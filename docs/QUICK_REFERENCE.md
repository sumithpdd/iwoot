# Quick Reference Guide

Quick lookup for common tasks and code snippets.

## Firebase Operations

### Get All Products
```typescript
import { getProducts } from "@/lib/firebase/products"

const products = await getProducts(userId)
const wantProducts = await getProducts(userId, "want")
const haveProducts = await getProducts(userId, "have")
```

### Create Product
```typescript
import { createProduct } from "@/lib/firebase/products"

await createProduct({
  name: "iPad Pro",
  brand: "Apple",
  website: "https://example.com",
  originalPrice: 999,
  type: "want",
  userId: user.uid,
  date: new Date().toISOString().split("T")[0]
})
```

### Update Product
```typescript
import { updateProduct } from "@/lib/firebase/products"

await updateProduct(productId, {
  name: "Updated Name",
  originalPrice: 899
})
```

### Delete Product
```typescript
import { deleteProduct } from "@/lib/firebase/products"

await deleteProduct(productId)
```

## Authentication

### Get Current User
```typescript
import { useAuth } from "@/lib/auth-context"

const { user, loading, signOut } = useAuth()

if (loading) return <Loading />
if (!user) return <Login />
```

### Sign Out
```typescript
const { signOut } = useAuth()
await signOut()
```

## Forms

### Basic Form Setup
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Required"),
  price: z.number().positive("Must be positive")
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})

const onSubmit = (data) => {
  console.log(data)
}

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("name")} />
  {errors.name && <p>{errors.name.message}</p>}
  <button type="submit">Submit</button>
</form>
```

## UI Components

### Button
```typescript
import { Button } from "@/components/ui/button"

<Button>Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
```

### Card
```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Dialog
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content here
  </DialogContent>
</Dialog>
```

### Toast Notifications
```typescript
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

toast({
  title: "Success",
  description: "Operation completed"
})

toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive"
})
```

## TypeScript Types

### Product Types
```typescript
import { Product, WantProduct, HaveProduct, ProductType } from "@/lib/types/product"

const wantProduct: WantProduct = {
  type: "want",
  name: "iPad",
  brand: "Apple",
  website: "https://example.com",
  originalPrice: 999,
  userId: "user123",
  date: "2024-01-01"
}

const haveProduct: HaveProduct = {
  type: "have",
  name: "iPad",
  brand: "Apple",
  website: "https://example.com",
  originalPrice: 999,
  priceBought: 899,
  userId: "user123",
  date: "2024-01-01"
}
```

## React Patterns

### useState
```typescript
const [value, setValue] = useState(initialValue)
const [loading, setLoading] = useState(false)
const [products, setProducts] = useState<Product[]>([])
```

### useEffect
```typescript
// Run once on mount
useEffect(() => {
  loadData()
}, [])

// Run when dependency changes
useEffect(() => {
  loadData()
}, [userId])

// Cleanup
useEffect(() => {
  const unsubscribe = subscribe()
  return () => unsubscribe()
}, [])
```

### Conditional Rendering
```typescript
{loading && <Loading />}
{error && <Error message={error} />}
{products.length > 0 ? <List /> : <EmptyState />}
```

## Common Utilities

### Format Date
```typescript
import { format } from "date-fns"

format(new Date(), "MMM dd, yyyy") // "Jan 01, 2024"
format(new Date(), "yyyy-MM-dd") // "2024-01-01"
```

### Combine Classes
```typescript
import { cn } from "@/lib/utils"

<div className={cn("base-class", condition && "conditional-class")} />
```

## Environment Variables

```typescript
// Access in client components
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

// Access in server components/API routes
const secret = process.env.SECRET_KEY
```

## File Paths

```typescript
// Components
import { Button } from "@/components/ui/button"

// Utilities
import { cn } from "@/lib/utils"

// Types
import { Product } from "@/lib/types/product"

// Firebase
import { auth, db } from "@/lib/firebase/config"
import { getProducts } from "@/lib/firebase/products"

// Hooks
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
```

## Common Errors & Solutions

### "Cannot read property of undefined"
```typescript
// Bad
product.name

// Good
product?.name
product?.name || "Unknown"
```

### "Firebase permission denied"
- Check user is authenticated
- Verify Firestore security rules
- Ensure userId matches authenticated user

### "Module not found"
```bash
npm install
# Restart dev server
```

### "Type error"
- Check TypeScript types match
- Use type assertions if needed: `as Product`
- Check imports are correct

## NPM Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint

# Install package
npm install package-name
```

## Git Commands

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Message"

# Push
git push

# Pull
git pull
```

---

**Tip**: Bookmark this page for quick reference while coding!

