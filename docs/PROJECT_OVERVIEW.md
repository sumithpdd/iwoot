# Project Overview

## What is IWOOT?

IWOOT stands for **"I Want One Of Those"** and **"I Have One Of Those"**. It's a price tracking application that helps users:

1. **Track products they want to buy** - Monitor prices and get notified of price drops
2. **Track products they own** - Keep track of purchase prices, resale listing state, and current market values

## Application Features

### Core Features

✅ **User Authentication**
- Email/password registration and login
- Secure session management
- Protected routes

✅ **Product Management**
- Add products you want or have
- **Auto-fill product details** - Search online databases to automatically populate product information
- **Rich text description** and optional **technical specifications** (key/value), with safe HTML rendering in lists
- **Multiple images** per product (Firebase Storage), reordering, optional tags
- Edit product information
- Delete products
- View product details in grid or table layout

✅ **Stores (retail profiles)**
- Save shops or marketplaces where you buy (optional link to **“I have”** products)
- Create from scratch or prefill from a **receipt**

✅ **Receipts**
- Attach receipts for purchases; link to products where relevant

✅ **Price Tracking**
- Track original prices
- Monitor current prices (for wanted products)
- Record purchase prices (for owned products)
- Price history tracking

✅ **Resale / marketplace helpers**
- **Selling journey** card on the dashboard (stores → “I have” + photos → compare → receipts)
- **“Currently selling”** and **where listed** fields for owned items
- **Static price compare** pages (`/sell-compare`) with example venue grids (maintained in `lib/data/`)

✅ **Product Lookup**
- Search products by name or barcode/UPC
- Auto-fill product details from online databases
- Extract product information from URLs
- Powered by UPCitemdb (free API)

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
- Firebase Authentication (browser)
- Cloud Firestore via Next.js API routes + Admin SDK
- Firebase Storage for images (or `/catalog` / `/receipts` when Storage is unavailable)

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
   - Main application page after login
   - Tabs: **Products**, **Receipts**, **Stores**, **Brands**
   - Products: filters (all / want / have), search, sort, grid or table view
   - Selling journey card and nav link to **Sell compare**

3. **Sell compare hub** (`/sell-compare`)
   - Static reference pages for resale price comparison (e.g. `/sell-compare/airpods-pro-2`, `/sell-compare/sonos-move-2`)

4. **Admin Dashboard** (`/admin`)
   - User management
   - System administration
   - Extensible for more features

### Components (selected)

- **ProductDialog**: Add/edit products (lookup, rich description, specs, images, store link for “have”, selling flags)
- **ProductList**: Grid and table views; description previews support HTML → plain text or sanitized snippets
- **StoreDialog** / **StoreList**: User-scoped store profiles
- **ReceiptDialog** / **ReceiptList**: Receipt capture and listing
- **SellingJourneyCard**: Dashboard guidance for resale workflow
- **SellingVenuePriceGrid**: Compare table/cards for static venue data
- **UI Components**: Reusable shadcn/ui primitives

### Data Structure

#### Product Types

See `lib/types/product.ts` for the full model. Highlights:

**WantProduct** (products you want):
- `type: "want"`, plus `currentPrice`, optional `targetPrice`, `priceHistory`
- Optional: `description` (HTML), `specifications`, `images` (`ProductImageEntry[]`), category, model, sku, etc.

**HaveProduct** (products you own):
- `type: "have"`, plus `priceBought`, optional `storeId`, `purchaseLocation`, `warrantyExpiry`, `receiptId`
- Optional resale tracking: `listingStatus`, `listingPlatforms[]`, `soldAt`, `soldWhere` (legacy `isSelling` / `sellingOn` still read)
- Same optional rich `description`, `specifications`, and `images` as above

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

### Product management flow

1. User opens **Products** tab and chooses **Add** (want vs have is chosen when opening the dialog).
2. Optional: use **Product lookup** or paste a URL to auto-fill.
3. User fills essentials (name, brand, website URL, prices, date) and optional description, specs, images, store (for “have”).
4. Submit saves via API to Firestore; list refreshes.

### Selling-oriented flow

1. Optionally add **Stores** and **Receipts** from their tabs.
2. Add an **“I have”** product with photos and retail or listing URL.
3. Use **Sell compare** for rough reference prices; update static data in repo as needed.
4. When listing on Gumtree, Vinted, etc., enable **Currently selling** and set **Where it is listed**.

## Database Schema

### Firestore Collections

**products** (collection) — see validators and API for the full writable shape. Typical fields include:

- `type`, `name`, `brand`, `website`, `originalPrice`, `date`, `userId`
- Want: `currentPrice`, `targetPrice`, `priceHistory`
- Have: `priceBought`, `storeId`, `purchaseLocation`, `warrantyExpiry`, `listingStatus`, `listingPlatforms`, `soldAt`, `soldWhere`, `receiptId`, `priceHistory` (legacy `isSelling`, `sellingOn` optional)
- Common optional: `description` (string, HTML), `specifications` (map), `images` (array of `{ url, tags? }` or legacy URL strings), `category`, `model`, `sku`, `notes`, etc.
- Timestamps: `createdAt`, `updatedAt` (and optional email audit fields from API)

**stores** (collection)

- User-scoped retailer profile: `userId`, `name`, optional `website`, `address`, `phone`, `notes`, `linkedReceiptIds`, timestamps

**receipts** (collection)

- User-scoped receipt documents (see `lib/types/receipt.ts`)

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
- Users can only read/write their own products, receipts, and stores
- Documents must include a `userId` matching the signed-in user where applicable
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

6. **Export Data**
   - Export products to CSV/JSON
   - Backup functionality

7. **Mobile App**
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

