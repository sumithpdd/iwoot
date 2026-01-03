# Project Overview

## What is IWOOT?

IWOOT stands for **"I Want One Of Those"** and **"I Have One Of Those"**. It's a price tracking application that helps users:

1. **Track products they want to buy** - Monitor prices and get notified of price drops
2. **Track products they own** - Keep track of purchase prices and current market values

## Application Features

### Core Features

✅ **User Authentication**
- Email/password registration and login
- Secure session management
- Protected routes

✅ **Product Management**
- Add products you want or have
- Edit product information
- Delete products
- View product details

✅ **Price Tracking**
- Track original prices
- Monitor current prices (for wanted products)
- Record purchase prices (for owned products)
- Price history tracking

✅ **Admin Dashboard**
- View all users
- System administration
- Extensible for future features

### Technical Features

✅ **Modern Tech Stack**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui components
- React Hook Form with Zod validation

✅ **Firebase Integration**
- Firebase Authentication
- Firestore Database
- Real-time data updates

✅ **Developer Experience**
- Comprehensive documentation
- Type-safe codebase
- Clean code structure
- Easy to extend

## Application Structure

### Pages

1. **Login Page** (`/login`)
   - User authentication
   - Registration
   - Redirects to dashboard after login

2. **Dashboard** (`/dashboard`)
   - Main application page
   - Two tabs: "I Want" and "I Have"
   - Product list view
   - Add/Edit/Delete products

3. **Admin Dashboard** (`/admin`)
   - User management
   - System administration
   - Extensible for more features

### Components

- **ProductDialog**: Form for adding/editing products
- **ProductList**: Displays products in a card grid
- **UI Components**: Reusable shadcn/ui components

### Data Structure

#### Product Types

**WantProduct** (Products you want):
```typescript
{
  type: "want"
  name: string
  brand: string
  website: string
  originalPrice: number
  currentPrice?: number
  date: string
  userId: string
  priceHistory?: PriceHistory[]
}
```

**HaveProduct** (Products you own):
```typescript
{
  type: "have"
  name: string
  brand: string
  website: string
  originalPrice: number
  priceBought: number
  date: string
  userId: string
  priceHistory?: PriceHistory[]
}
```

## User Flow

### New User Flow

1. User visits application
2. Redirected to login page
3. Clicks "Sign Up"
4. Enters email and password
5. Account created
6. Redirected to dashboard
7. Can now add products

### Existing User Flow

1. User visits application
2. Redirected to login page
3. Enters credentials
4. Logs in
5. Redirected to dashboard
6. Views/manages products

### Product Management Flow

1. User clicks "Add Product"
2. Dialog opens with form
3. User selects type (Want/Have)
4. Fills in product details
5. Submits form
6. Product saved to Firestore
7. Product appears in list
8. User can edit or delete

## Database Schema

### Firestore Collections

**products** (Collection)
```
{
  id: string (auto-generated)
  type: "want" | "have"
  name: string
  brand: string
  website: string
  originalPrice: number
  currentPrice?: number (for "want" type)
  priceBought?: number (for "have" type)
  date: string (ISO date)
  userId: string
  priceHistory?: Array<{
    price: number
    date: string
    website: string
  }>
  createdAt: string
  updatedAt: string
}
```

**users** (Collection - for future use)
```
{
  id: string
  email: string
  displayName?: string
  role: "user" | "admin"
  createdAt: string
}
```

## Security

### Authentication
- Firebase Authentication handles user authentication
- JWT tokens stored in cookies
- Protected routes check authentication

### Firestore Security Rules
- Users can only read/write their own products
- Products must have matching userId
- Authentication required for all operations

## Future Enhancements

Potential features to add:

1. **Price Alerts**
   - Email notifications when prices drop
   - Set target prices

2. **Price History Charts**
   - Visualize price changes over time
   - Compare prices across websites

3. **Product Categories**
   - Organize products by category
   - Filter by category

4. **Multiple Websites**
   - Track same product across different sites
   - Compare prices

5. **Wishlist Sharing**
   - Share wishlists with friends/family
   - Collaborative lists

6. **Product Images**
   - Upload or link product images
   - Visual product cards

7. **Export Data**
   - Export products to CSV/JSON
   - Backup functionality

8. **Mobile App**
   - React Native version
   - Push notifications

## Technology Decisions

### Why Next.js?
- Server-side rendering for better performance
- File-based routing (easy to understand)
- Built-in optimizations
- Great developer experience

### Why Firebase?
- Easy to set up
- Free tier available
- Real-time updates
- Built-in authentication
- No backend server needed

### Why TypeScript?
- Catches errors before runtime
- Better IDE support
- Self-documenting code
- Easier refactoring

### Why shadcn/ui?
- Accessible components
- Customizable
- Modern design
- Copy-paste components (not a dependency)

### Why React Hook Form + Zod?
- Better performance than controlled inputs
- Built-in validation
- Type-safe schemas
- Less boilerplate

## Performance Considerations

- **Code Splitting**: Next.js automatically splits code
- **Image Optimization**: Built into Next.js
- **Server Components**: Reduce client-side JavaScript
- **Firestore Indexing**: Automatic for queries
- **Lazy Loading**: Components load on demand

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

- shadcn/ui components are accessible by default
- Keyboard navigation supported
- Screen reader friendly
- ARIA labels included

## Testing

Currently, manual testing is used. Future improvements:
- Unit tests with Jest
- Integration tests
- E2E tests with Playwright

## Deployment

### Recommended Platforms

1. **Vercel** (Recommended)
   - Made by Next.js creators
   - Zero configuration
   - Automatic deployments

2. **Netlify**
   - Easy deployment
   - Good for static sites

3. **Firebase Hosting**
   - Integrates with Firebase
   - Good performance

### Environment Variables

Make sure to set all Firebase environment variables in your deployment platform.

## Support & Resources

- **Documentation**: See `/docs` folder
- **README**: Main project README
- **Developer Guide**: Detailed guide for developers
- **Setup Instructions**: Step-by-step setup guide
- **Quick Reference**: Code snippets and common tasks

## Contributing

1. Read the documentation
2. Understand the codebase
3. Make changes
4. Test thoroughly
5. Submit for review

---

**Built with ❤️ for tracking the things you want and have!**

