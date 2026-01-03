# Product Lookup Feature

The IWOOT app includes an automatic product lookup feature that helps you quickly fill in product details by searching online product databases.

## Overview

When adding a new product, you can use the **Auto-Fill Product Details** feature to automatically populate product information from online databases. This saves time and ensures accurate product data.

## How It Works

The product lookup feature uses **UPCitemdb**, a free product database that doesn't require an API key. It can search for products by:

1. **Product Name** - Search by typing the product name (e.g., "iPad Pro")
2. **Barcode/UPC Code** - Enter a numeric barcode or UPC code
3. **Website URL** - Extract basic information from product URLs

## Using Product Lookup

### Step 1: Open Add Product Dialog

1. Go to your Dashboard
2. Click **Add Product**
3. Select whether it's a "Want" or "Have" product

### Step 2: Use Auto-Fill Feature

You'll see an **Auto-Fill Product Details** section at the top of the form (only when adding new products, not when editing).

#### Option A: Search by Name or Barcode

1. Enter a product name (e.g., "Apple iPad Pro") or barcode (e.g., "0123456789012")
2. Click **Search**
3. If found, the form will automatically fill in:
   - Product Name
   - Brand
   - Description
   - Category
   - Model
   - SKU (if available)
   - Images (if available)
   - Price (if available)
   - Website (if available)

#### Option B: Extract from URL

1. First, enter the product website URL in the "Website" field
2. Click **Extract from URL** in the lookup section
3. Basic product information will be extracted from the URL

### Step 3: Review and Adjust

After the lookup:
- ✅ Review all auto-filled fields
- ✅ Adjust any incorrect information
- ✅ Fill in any missing required fields
- ✅ Add additional details (color, size, notes, etc.)
- ✅ Upload or adjust product images

### Step 4: Save Product

Click **Save** to create the product with the filled-in information.

## Supported Product Information

The lookup can retrieve:

- ✅ Product Name
- ✅ Brand
- ✅ Description
- ✅ Category
- ✅ Model Number
- ✅ SKU/Barcode
- ✅ Product Images
- ✅ Price Information
- ✅ Product Website
- ✅ Specifications (if available)

## Limitations

### Free Tier Limitations

- **UPCitemdb** has rate limits on the free tier
- Some products may not be found in the database
- Not all product details may be available

### What to Do If Product Not Found

If a product isn't found:
1. Try different search terms
2. Search by barcode/UPC if you have it
3. Manually fill in the product details
4. Use the URL extraction feature as a fallback

## Technical Details

### API Used

- **UPCitemdb API** - Free product database
  - No API key required
  - Supports barcode/UPC lookup
  - Supports product name search
  - Rate limited on free tier

### Data Sources

The lookup service tries multiple methods:

1. **Barcode Lookup** - If you enter a numeric code, it tries barcode lookup first
2. **Product Search** - Searches by product name
3. **URL Extraction** - Extracts basic info from product URLs

### Privacy

- All lookups are done client-side (in your browser)
- No product data is sent to our servers
- Direct API calls to UPCitemdb
- Your search queries are not stored

## Tips for Best Results

1. **Be Specific** - Use full product names (e.g., "Apple iPad Pro 13-inch M5" instead of just "iPad")

2. **Use Barcodes** - If you have the product's barcode/UPC, use that for most accurate results

3. **Check Multiple Sources** - If lookup fails, try:
   - Different product name variations
   - Manufacturer's product code
   - Model number

4. **Verify Information** - Always review auto-filled data for accuracy

5. **Complete Missing Fields** - The lookup may not find everything, so fill in any missing required fields manually

## Future Enhancements

Potential improvements:
- Support for additional product APIs
- Better URL parsing for major retailers
- Image recognition for product lookup
- Price history integration
- Multi-source product comparison

## Troubleshooting

### "Product Not Found" Error

- Try different search terms
- Check if the product name is spelled correctly
- Try searching by brand + model number
- Use barcode if available

### "Failed to lookup product" Error

- Check your internet connection
- The API may be temporarily unavailable
- Try again in a few moments
- Fill in details manually as fallback

### Images Not Loading

- Some products may not have images in the database
- You can manually upload images using the Image Upload component
- Try searching for the product on the manufacturer's website

## Support

If you encounter issues with the product lookup feature:
1. Check your internet connection
2. Try a different search term
3. Fill in product details manually
4. Report issues if the feature consistently fails

