/**
 * API Service to fetch and manage DummyJSON products
 * Converts API data to match the project's product format
 */

// In-memory cache (within same page session)
let cachedApiProducts = null;

// sessionStorage key for cross-page cache
const CACHE_KEY = 'shop_co_api_products';

// Fashion-only categories from DummyJSON
const FASHION_CATEGORIES = [
  'mens-shirts',
  'womens-dresses',
  'tops',
  'mens-shoes',
  'womens-shoes',
  'womens-bags',
  'womens-jewellery',
  'mens-watches',
  'womens-watches',
  'sunglasses'
];

/**
 * Fetch products from DummyJSON API - CLOTHING & FASHION ONLY
 * @returns {Promise<Array>} - Array of formatted products
 */
export async function fetchApiProducts() {
  // 1. Return in-memory cache first (fastest)
  if (cachedApiProducts) {
    return cachedApiProducts;
  }

  // 2. Try sessionStorage cache (survives page navigation)
  try {
    const stored = sessionStorage.getItem(CACHE_KEY);
    if (stored) {
      cachedApiProducts = JSON.parse(stored);
      return cachedApiProducts;
    }
  } catch (_) {}

  try {
    // Fetch ALL categories in parallel instead of one-by-one
    const responses = await Promise.all(
      FASHION_CATEGORIES.map(category =>
        fetch(`https://dummyjson.com/products/category/${category}`)
          .then(res => res.ok ? res.json() : { products: [] })
          .catch(() => ({ products: [] }))
      )
    );

    const allProducts = responses.flatMap(data => data.products || []);

    // Convert API format to your product format
    const formattedProducts = allProducts.map((product, index) => ({
      id: 1000 + index, // Start from 1000 to differentiate from local products (1-999)
      name: product.title,
      category: mapCategory(product.category),
      apiCategory: product.category, // Preserve original category for grouping
      gender: determineGender(product.category),
      price: Math.round(product.price),
      oldPrice: calculateOldPrice(product.price, product.discountPercentage),
      rating: product.rating,
      reviewCount: product.reviews ? product.reviews.length : 0,
      images: [product.thumbnail, ...(product.images || [])].filter(img => img),
      description: product.description,
      tags: index < 4 ? ['new-arrival'] : (index < 8 ? ['top-selling'] : []),
      source: 'api' // Mark as API product for tracking
    }));

    // Save to both in-memory and sessionStorage
    cachedApiProducts = formattedProducts;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(formattedProducts));
    } catch (_) {}

    return formattedProducts;
  } catch (error) {
    console.error('Error fetching API products:', error);
    return [];
  }
}

/**
 * Map DummyJSON categories to project categories
 * @param {string} category - Original category from API
 * @returns {string} - Mapped category
 */
function mapCategory(category) {
  const categoryMap = {
    'mens-shirts': 'casual',
    'tops': 'casual',
    'womens-dresses': 'casual',
    'womens-shoes': 'shoes',
    'mens-shoes': 'shoes',
    'mens-watches': 'accessories',
    'womens-watches': 'accessories',
    'womens-bags': 'accessories',
    'womens-jewellery': 'accessories',
    'sunglasses': 'accessories'
  };
  
  return categoryMap[category.toLowerCase()] || 'casual';
}

/**
 * Determine gender from category
 * @param {string} category - Product category
 * @returns {string} - 'men', 'women', or 'unisex'
 */
function determineGender(category) {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('mens') || lowerCategory.includes('men')) return 'men';
  if (lowerCategory.includes('womens') || lowerCategory.includes('women')) return 'women';
  return 'unisex';
}

/**
 * Calculate old price based on discount percentage
 * @param {number} price - Current price
 * @param {number} discount - Discount percentage
 * @returns {number|null} - Original price or null
 */
function calculateOldPrice(price, discount) {
  if (!discount || discount === 0) return null;
  const originalPrice = Math.round(price / (1 - discount / 100));
  return originalPrice > price ? originalPrice : null;
}

/**
 * Get all available products (local + API)
 * @param {Array} localProducts - Local products array
 * @returns {Promise<Array>} - Combined products array
 */
export async function getAllProducts(localProducts = []) {
  // Add source property to local products
  const localWithSource = localProducts.map(p => ({
    ...p,
    source: 'local'
  }));
  
  const apiProducts = await fetchApiProducts();
  return [...localWithSource, ...apiProducts];
}

/**
 * Search products across local and API products
 * @param {string} searchTerm - Search query
 * @param {Array} localProducts - Local products
 * @returns {Promise<Array>} - Matching products
 */
export async function searchAllProducts(searchTerm, localProducts = []) {
  const allProducts = await getAllProducts(localProducts);
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return allProducts.filter(product => {
    const name = product.name.toLowerCase();
    const category = product.category.toLowerCase();
    const description = product.description.toLowerCase();
    
    return (
      name.includes(lowerSearchTerm) ||
      category.includes(lowerSearchTerm) ||
      description.includes(lowerSearchTerm)
    );
  });
}

/**
 * Get paginated products
 * @param {Array} products - All products
 * @param {number} page - Page number (0-indexed)
 * @param {number} itemsPerPage - Items per page (default: 12)
 * @returns {Object} - {items, total, totalPages, currentPage}
 */
export function getPaginatedProducts(products, page = 0, itemsPerPage = 12) {
  const total = products.length;
  const totalPages = Math.ceil(total / itemsPerPage);
  const start = page * itemsPerPage;
  const items = products.slice(start, start + itemsPerPage);
  
  return {
    items,
    total,
    totalPages,
    currentPage: page
  };
}
