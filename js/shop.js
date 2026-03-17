import { getAllProducts, getPaginatedProducts } from './api-service.js';
import { createProductCard, attachProductCardListeners } from './render-products.js';
import { products } from './products.js';


// Display labels for raw API category keys
const CATEGORY_LABELS = {
  'mens-shirts':     "Men's Shirts",
  'womens-dresses':  "Women's Dresses",
  'tops':            "Tops",
  'mens-shoes':      "Men's Shoes",
  'womens-shoes':    "Women's Shoes",
  'womens-bags':     "Women's Bags",
  'womens-jewellery':"Jewellery",
  'mens-watches':    "Men's Watches",
  'womens-watches':  "Women's Watches",
  'sunglasses':      "Sunglasses",
  'casual':          "Casual",
  'shoes':           "Shoes",
  'accessories':     "Accessories",
};

// Number of product cards shown per page
const ITEMS_PER_PAGE = 10;

// Central state — single source of truth for the entire shop page
const state = {
  allProducts:    [],   // Full product list, populated once on init, never mutated
  filtered:       [],   // Active subset — updated on category select or clear
  currentPage:    1,    // 1-indexed current page number
  activeCategory: null, // Currently selected category key, e.g. "mens-shirts"
};


/* ─────────────────────────────────────────────────────────────
   INIT — runs once the DOM is ready
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async function () {

  showLoadingSpinner(); // Show spinner while products are being fetched

  // Fetch and merge local + API products; await holds here until resolved
  state.allProducts = await getAllProducts(products);

  // On first load, show all products with no active filter
  state.filtered = [...state.allProducts];

  renderPage();          // Initial render
  setupEventListeners(); // Wire up all UI interactions
  updateCartBadge();     // Sync cart count from localStorage
});


/* ─────────────────────────────────────────────────────────────
   renderPage()
   Central render dispatcher — called on every state change.
   Keeps all UI sections in sync with a single call.
───────────────────────────────────────────────────────────── */
function renderPage() {
  renderFilters();    // Rebuild sidebar category list
  renderProducts();   // Rebuild product grid for current page
  renderPagination(); // Rebuild pagination bar
  updateCount();      // Update "Showing X–Y of Z products" label
}


/* ─────────────────────────────────────────────────────────────
   renderProducts()
   Slices state.filtered to the current page and injects cards
   into the product grid.
───────────────────────────────────────────────────────────── */
function renderProducts() {
  const grid = document.getElementById('shop-products-grid');
  if (!grid) return;

  // Empty state — no products match the active filter
  if (state.filtered.length === 0) {

    // Resolve a human-readable category name for the empty state message
    const categoryName = CATEGORY_LABELS[state.activeCategory]
      || state.activeCategory
      || "this category";

    grid.innerHTML = `
      <div class="shop-empty col-12">
        <i class="fa-solid fa-box-open"></i>
        <h3>No products yet for ${categoryName}</h3>
        <p>We're working on adding more. Try a different category or
           <button onclick="document.getElementById('clear-filter-btn').click()"
             style="background:none;border:none;text-decoration:underline;
                    cursor:pointer;font-family:inherit;font-size:inherit;
                    color:inherit;padding:0;">
             view all products
           </button>.
        </p>
      </div>
    `;
    return;
  }

  // getPaginatedProducts uses a 0-based page index, so subtract 1 from display page
  const { items } = getPaginatedProducts(
    state.filtered,
    state.currentPage - 1,
    ITEMS_PER_PAGE
  );

  // Map each product to an HTML string, then write to DOM in one operation
  grid.innerHTML = items.map(createProductCard).join('');

  // Must run after innerHTML is set — cards must exist in DOM before listeners attach
  attachProductCardListeners();
}


/* ─────────────────────────────────────────────────────────────
   renderFilters()
   Builds the sidebar category list dynamically from product data,
   so the filter always reflects what categories actually exist.
───────────────────────────────────────────────────────────── */
function renderFilters() {
  const categoryList = document.getElementById('category-list');
  if (!categoryList) return;

  // apiCategory → API products | category → local products
  const rawCategories = state.allProducts.map(p => p.apiCategory || p.category);

  // Deduplicate with Set, then strip any falsy values (null, undefined, '')
  const uniqueCategories = [...new Set(rawCategories)].filter(Boolean);

  categoryList.innerHTML = uniqueCategories.map(cat => {

    // Use mapped label if available; otherwise format the raw key as a title
    const label = CATEGORY_LABELS[cat] ||
      cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');

    // data-category stores the raw key used for filtering; active class highlights selection
    return `
      <li class="category-item ${state.activeCategory === cat ? 'active' : ''}"
        data-category="${cat}">
        <span>${label}</span>
        <i class="fa-solid fa-chevron-right"></i>
      </li>
    `;
  }).join('');
}


/* ─────────────────────────────────────────────────────────────
   renderPagination()
   Renders a condensed page range around the current page:
     1  …  4  [5]  6  …  20
   Ellipses are inserted wherever the gap between shown pages > 1.
───────────────────────────────────────────────────────────── */
function renderPagination() {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  const totalPages = Math.ceil(state.filtered.length / ITEMS_PER_PAGE);
  const current    = state.currentPage;

  // Hide pagination entirely when there's only one page
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  // Always include: first page, last page, current page, and its immediate neighbours
  const pagesToShow = [...new Set([
    1,
    totalPages,
    current,
    current - 1,
    current + 1,
  ].filter(p => p >= 1 && p <= totalPages))].sort((a, b) => a - b); // Numeric sort ascending

  // Build page number buttons, inserting "…" wherever there's a gap between pages
  let numbersHTML = '';
  let prevPage    = 0; // Tracks the last rendered page to detect gaps

  pagesToShow.forEach(page => {

    // A gap greater than 1 between adjacent pages means an ellipsis is needed
    if (prevPage && page - prevPage > 1) {
      numbersHTML += `<span class="page-ellipsis">…</span>`;
    }

    // Active page gets aria-current for accessibility
    numbersHTML += `
      <button class="page-btn ${page === current ? 'active' : ''}"
              data-page="${page}"
              ${page === current ? 'aria-current="page"' : ''}>
        ${page}
      </button>`;

    prevPage = page;
  });

  // Full pagination bar: Previous · page numbers · Next
  container.innerHTML = `
    <button class="page-btn prev-btn" data-page="${current - 1}" ${current === 1 ? 'disabled' : ''}>
      <i class="fa-solid fa-chevron-left"></i> Previous
    </button>

    <div class="page-numbers">${numbersHTML}</div>

    <button class="page-btn next-btn" data-page="${current + 1}" ${current === totalPages ? 'disabled' : ''}>
      Next <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  // Single delegated listener handles prev, next, and all numbered buttons
  container.addEventListener('click', function (e) {
    const btn = e.target.closest('.page-btn');
    if (!btn || btn.disabled || btn.classList.contains('active')) return;

    // dataset values are strings — parseInt converts "3" → 3 for arithmetic
    state.currentPage = parseInt(btn.dataset.page);
    renderPage();

    // Scroll product grid into view after page change
    document.getElementById('shop-products-grid')?.scrollIntoView({
      behavior: 'smooth',
      block:    'start',
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   updateCount()
   Updates the "Showing X–Y of Z products" label.
   Math.min caps the end value so it never exceeds the total.
───────────────────────────────────────────────────────────── */
function updateCount() {
  const countEl = document.getElementById('product-count');
  if (!countEl) return;

  const total = state.filtered.length;

  if (total === 0) {
    countEl.textContent = 'No products found';
    return;
  }

  // start: first item index on this page (1-based)
  const start = (state.currentPage - 1) * ITEMS_PER_PAGE + 1;

  // end: last item on this page, capped at total to avoid overshooting on the last page
  const end = Math.min(state.currentPage * ITEMS_PER_PAGE, total);

  countEl.textContent = `Showing ${start}-${end} of ${total} products`;
}


/* ─────────────────────────────────────────────────────────────
   setupEventListeners()
   Wires up the category accordion, clear-filter button,
   category selection, and mobile sidebar controls.
   Called once on init — all target elements are static HTML.
───────────────────────────────────────────────────────────── */
function setupEventListeners() {

  // ── Category accordion toggle ──────────────────────────
  const categoryToggle = document.getElementById('category-toggle');
  const categoryList   = document.getElementById('category-list');

  if (categoryToggle && categoryList) {
    categoryToggle.addEventListener('click', function () {

      // aria-expanded is a string attribute — compare against "true", not boolean true
      const isOpen = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isOpen);

      // Toggle visibility; style.display used because element starts with inline display:none
      categoryList.style.display = isOpen ? 'none' : 'block';
    });
  }

  // ── Clear filter — resets to full unfiltered product list ─
  document.getElementById('clear-filter-btn')?.addEventListener('click', function () {
    state.activeCategory = null;
    state.filtered       = [...state.allProducts];
    state.currentPage    = 1;
    renderPage();
  });

  // ── Category selection — filters products by clicked category ─
  categoryList.addEventListener('click', function (e) {
    const item = e.target.closest('.category-item'); // Delegate up from any child element
    if (!item) return;

    const cat = item.dataset.category; // Raw category key stored in data-category attribute

    state.activeCategory = cat;

    // Match against apiCategory (API products) or category (local products)
    state.filtered = state.allProducts.filter(
      p => (p.apiCategory || p.category) == cat
    );

    // Reset to page 1 — current page may no longer exist after filtering
    state.currentPage = 1;
    renderPage();
  });

  // ── Mobile filter sidebar ──────────────────────────────
  const mobileBtn = document.getElementById('mobile-filter-btn');
  const sidebar   = document.getElementById('filter-sidebar');
  const overlay   = document.getElementById('sidebar-overlay');

  // Lock background scroll when sidebar is open
  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  // Restore background scroll when sidebar closes
  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('visible');
    document.body.style.overflow = '';
  }

  mobileBtn?.addEventListener('click', openSidebar);
  overlay?.addEventListener('click', closeSidebar); // Tap overlay to dismiss sidebar

  // Auto-close sidebar after a category is selected on mobile
  document.getElementById('category-list')?.addEventListener('click', function () {
    if (window.innerWidth < 992) closeSidebar();
  });
}


/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

// Injects a loading spinner into the grid while products are being fetched
function showLoadingSpinner() {
  const grid = document.getElementById('shop-products-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="shop-loading col-12">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading products…</p>
      </div>
    `;
  }
}

// Reads cart data from localStorage and updates the nav badge count
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  try {
    const cart  = JSON.parse(localStorage.getItem('shopco_cart') || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0); // Sum all item quantities
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total; // Cap display at 99+
      badge.classList.add('visible');
    }
  } catch (_) {} // Silently ignore malformed localStorage data
}