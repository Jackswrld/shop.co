import { getAllProducts, getPaginatedProducts } from './api-service.js';
import { createProductCard, attachProductCardListeners } from './render-products.js';
import { products } from './products.js';



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
 
const ITEMS_PER_PAGE = 10; // Matches the design: "Showing 1-10 of 194"
 
 
/* ─────────────────────────────────────────────────────────────
   3. STATE — Single Source of Truth
   ─────────────────────────────────────────────────────────────
   All mutable data lives here. renderPage() reads from this
   object and builds the UI from whatever state currently holds.
 
   WHY ONE OBJECT?
   ▸ If currentPage and filtered fall out of sync (e.g. you filter
     but forget to reset currentPage), you show the wrong products.
     One object makes it impossible to update one without the other
     being visible right next to it.
 
   SHAPE:
     allProducts   → full unfiltered list (set once on init, never changed)
     filtered      → what's currently shown (changes when filter is applied)
     currentPage   → 1-indexed (we convert to 0-indexed for getPaginatedProducts)
     activeCategory → which category button is highlighted (null = all)
───────────────────────────────────────────────────────────── */
const state = {
  allProducts:     [],    // Full list — never modified after init
  filtered:        [],    // Currently visible products
  currentPage:     1,     // 1-indexed for display ("Page 1 of 20")
  activeCategory:  null,  // e.g. "mens-shirts" | null
};
 
 
/* ─────────────────────────────────────────────────────────────
   4. INIT — DOMContentLoaded
   ─────────────────────────────────────────────────────────────
   `async` before a function means it can use `await` inside.
   The browser won't block while waiting for the API — other
   code and UI interactions continue normally.
 
   SEQUENCE:
   1. Show spinner immediately so user knows something is loading
   2. Fetch all products (async — may take ~500ms–2s)
   3. Store in state
   4. Render everything
   5. Set up click listeners
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async function () {
 
  // Show loading spinner right away
  showLoadingSpinner();
 
  /*
    await pauses execution HERE until getAllProducts() resolves.
    It does NOT freeze the browser — only this function pauses.
    The user can still scroll, click links, etc.
 
    getAllProducts(products) combines:
    ▸ products.js local array  (local products)
    ▸ DummyJSON API products   (fetched or returned from cache)
    → returns one merged array
  */
  state.allProducts = await getAllProducts(products);
 
  /*
    On first load, filtered = all products.
    When a category is clicked later, filtered gets updated.
    currentPage resets to 1 on any filter change.
  */
  state.filtered = [...state.allProducts];
 
  // Render the full page from state
  renderPage();
 
  // Attach all click listeners (accordion, pagination, mobile filter)
  setupEventListeners();
 
  // Update cart badge (reads from localStorage — same as cart.js)
  updateCartBadge();
});
 
 
/* ─────────────────────────────────────────────────────────────
   5. renderPage() — THE BRAIN
   ─────────────────────────────────────────────────────────────
   This is called EVERY TIME anything changes:
   ▸ A category is clicked    → renderPage()
   ▸ A pagination button is clicked → renderPage()
   ▸ Clear filter is clicked  → renderPage()
 
   It always calls ALL sub-renders.
   WHY re-render everything instead of only the changed part?
   ▸ Simpler code — one function to call, always consistent.
   ▸ At our scale (a few hundred products), the performance
     cost of re-rendering a sidebar or a count string is zero.
   ▸ This is essentially what React does — it diffs and only
     updates what changed, but the MENTAL MODEL you write with
     is "re-render everything on state change".
───────────────────────────────────────────────────────────── */
function renderPage() {
  renderFilters();
  renderProducts();
  renderPagination();
  updateCount();
}
 
 
/* ─────────────────────────────────────────────────────────────
   6. renderProducts()
   ─────────────────────────────────────────────────────────────
   Slices state.filtered to the current page and renders cards.
 
   getPaginatedProducts() from api-service.js is 0-indexed:
     Page 1 (display) → page 0 (internal)
     Page 2 (display) → page 1 (internal)
   So we always pass `state.currentPage - 1`.
 
   SLICE EXAMPLE with 10 items/page:
     Page 1: products 0–9   (indices 0 to 9)
     Page 2: products 10–19 (indices 10 to 19)
     Page 3: products 20–29 (indices 20 to 29)
   Formula: slice(start=(page-1)*10, end=page*10)
   getPaginatedProducts does exactly this internally.
───────────────────────────────────────────────────────────── */
function renderProducts() {
  const grid = document.getElementById('shop-products-grid');
  if (!grid) return;
 
  if (state.filtered.length === 0) {
    // Empty state — no products matched the filter
    grid.innerHTML = `
      <div class="shop-empty col-12">
        <i class="fa-regular fa-face-frown"></i>
        <h3>No products found</h3>
        <p>Try clearing the filter or choosing a different category.</p>
      </div>
    `;
    return;
  }
 
  /*
    getPaginatedProducts(array, page, itemsPerPage)
    ▸ array         → state.filtered (already filtered list)
    ▸ page          → 0-indexed, so currentPage - 1
    ▸ itemsPerPage  → 10
 
    Returns: { items: [...], total, totalPages, currentPage }
 
    We destructure immediately: const { items } = ...
    Destructuring means "pull out the `items` property".
    Same as: const result = getPaginatedProducts(...); const items = result.items;
    Just cleaner.
  */
  const { items } = getPaginatedProducts(
    state.filtered,
    state.currentPage - 1,
    ITEMS_PER_PAGE
  );
 
  /*
    createProductCard(product) returns an HTML string like:
      '<div class="col-6 col-sm-6 col-md-4 col-lg-3">...'
 
    .map() converts each product object → HTML string.
    .join('') merges the array of strings into one big string.
    grid.innerHTML = that string → one DOM write → one reflow.
  */
  grid.innerHTML = items.map(createProductCard).join('');
 
  /*
    attachProductCardListeners() queries .product-card elements
    and adds click → window.location.href = product-details.html?id=X
 
    Must be called AFTER innerHTML is set — the cards need to
    exist in the DOM before you can attach listeners to them.
    Calling it before would find 0 elements.
  */
  attachProductCardListeners();
}
 
 
/* ─────────────────────────────────────────────────────────────
   7. renderFilters()
   ─────────────────────────────────────────────────────────────
   Builds the category list from the data itself — no hardcoded list.
   This is "data-driven UI": the filter reflects what actually exists.
 
   KEY CONCEPT — extracting unique categories:
   ─────────────────────────────────────────────
   state.allProducts has ~194 products.
   Many share the same apiCategory.
   We need a list with NO duplicates.
 
   STEP 1: map() extracts every apiCategory:
     [{ apiCategory:"mens-shirts" }, { apiCategory:"mens-shirts" }, { apiCategory:"tops" }]
     .map(p => p.apiCategory)
     → ["mens-shirts", "mens-shirts", "tops", ...]
 
   STEP 2: new Set() removes duplicates:
     new Set(["mens-shirts", "mens-shirts", "tops"])
     → Set { "mens-shirts", "tops" }
     (Sets only hold unique values — duplicates are ignored)
 
   STEP 3: [...] spread converts Set back to array:
     → ["mens-shirts", "tops", ...]
 
   REAL WORLD: This exact pattern — map → Set → spread — is
   how you deduplicate any array of values in JS. Used everywhere:
   unique user IDs, unique countries in a dataset, unique tags.
───────────────────────────────────────────────────────────── */
function renderFilters() {
  const categoryList = document.getElementById('category-list');
  if (!categoryList) return;
 
  /*
    p.apiCategory comes from API products.
    p.category comes from local products (e.g. "casual", "shoes").
    We use apiCategory if available, fall back to category.
    The `||` operator: if left side is falsy (null/undefined/''), use right.
  */
  const rawCategories = state.allProducts.map(p => p.apiCategory || p.category);
  const uniqueCategories = [...new Set(rawCategories)].filter(Boolean);
 
  /*
    .filter(Boolean) removes any null/undefined/'' values.
    Boolean(null) → false → filtered out.
    Boolean("tops") → true → kept.
    It's shorthand for .filter(c => c !== null && c !== undefined && c !== '')
  */
 
  categoryList.innerHTML = uniqueCategories.map(cat => {
    /*
      CATEGORY_LABELS[cat] → display label, or a formatted fallback.
      The fallback capitalizes the first letter:
        "mens-shirts" → no label found → "Mens-shirts"
        We handle this with || and string manipulation.
    */
    const label = CATEGORY_LABELS[cat] ||
      cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');
 
    /*
      data-category="${cat}" stores the raw category key on the element.
      When clicked, we read element.dataset.category to know which
      filter was selected — same data attribute pattern as cart.js.
 
      The "active" class is added when state.activeCategory === cat.
      Ternary: condition ? 'value if true' : 'value if false'
    */
    return `
      <li class="category-item ${state.activeCategory === cat ? 'active' : ''}"
          data-category="${cat}">
        <span>${label}</span>
        <i class="fa-solid fa-chevron-right"></i>
      </li>
    `;
  }).join('');
 
  /*
    Event delegation on the category list.
    One listener on the <ul> handles clicks on all <li> children.
    (Same pattern explained in cart.js — parent listens, e.target.closest finds the item)
  */
  categoryList.addEventListener('click', function(e) {
    const item = e.target.closest('.category-item');
    if (!item) return;
 
    const cat = item.dataset.category;
 
    /*
      TOGGLE LOGIC:
      If user clicks the already-active category → deactivate (show all).
      If user clicks a different category → activate it.
 
      Ternary: state.activeCategory === cat means "same one clicked again"
      → null (show all), else → cat (filter to this)
    */
    state.activeCategory = state.activeCategory === cat ? null : cat;
 
    /*
      FILTER:
      If no active category → show all products.
      If a category is active → keep only products matching that category.
 
      We check BOTH apiCategory and category to cover local + API products.
      The || handles local products that don't have apiCategory.
    */
    state.filtered = state.activeCategory
      ? state.allProducts.filter(p =>
          (p.apiCategory || p.category) === state.activeCategory
        )
      : [...state.allProducts];
 
    // Always reset to page 1 when filter changes.
    // If you're on page 5 and filter to 3 items, there's no page 5.
    state.currentPage = 1;
 
    renderPage();
  });
}
 
 
/* ─────────────────────────────────────────────────────────────
   8. renderPagination()
   ─────────────────────────────────────────────────────────────
   Builds the pagination bar matching the design:
     ← Previous   1   2   …   20   Next →
 
   THE ELLIPSIS LOGIC:
   ──────────────────
   With 20 pages, we don't show all 20 buttons — that overflows.
   We show: first page, last page, current page, and one page
   on each side of current. Then "…" fills the gaps.
 
   EXAMPLE with current=5 and totalPages=20:
     Show: 1, 4, 5, 6, 20
     → 1  …  4  5  6  …  20
 
   HOW IT WORKS:
   ▸ Build a Set of pages to show (deduplicates automatically)
   ▸ Sort them ascending
   ▸ Loop through — if gap > 1 between adjacent pages, insert "…"
 
   Set is perfect here: [1, 20, 4, 5, 6, 5] → Set{1,4,5,6,20}
   Duplicate 5 is ignored. Then we sort and render.
───────────────────────────────────────────────────────────── */
function renderPagination() {
  const container = document.getElementById('pagination-container');
  if (!container) return;
 
  const totalPages = Math.ceil(state.filtered.length / ITEMS_PER_PAGE);
  const current    = state.currentPage;
 
  // No pagination needed if only 1 page
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
 
  /*
    Build the set of page numbers to display.
    .filter(p => p >= 1 && p <= totalPages) removes out-of-range values.
    e.g. current=1, current-1=0 → 0 is filtered out.
  */
  const pagesToShow = [...new Set([
    1,
    totalPages,
    current,
    current - 1,
    current + 1
  ].filter(p => p >= 1 && p <= totalPages))].sort((a, b) => a - b);
 
  /*
    .sort((a, b) => a - b) sorts numbers ascending.
    Default .sort() converts to strings: [1,2,10,20] → [1,10,2,20] (wrong!)
    Numeric comparator (a - b) fixes this:
    ▸ a - b < 0 → a comes first
    ▸ a - b > 0 → b comes first
    ▸ a - b = 0 → equal, order unchanged
  */
 
  // Build the page numbers HTML
  let numbersHTML = '';
  let prevPage = 0; // Track previous page to detect gaps for "…"
 
  pagesToShow.forEach(page => {
    // Gap detected — insert ellipsis
    if (prevPage && page - prevPage > 1) {
      numbersHTML += `<span class="page-ellipsis">…</span>`;
    }
    numbersHTML += `
      <button class="page-btn ${page === current ? 'active' : ''}"
              data-page="${page}"
              ${page === current ? 'aria-current="page"' : ''}>
        ${page}
      </button>
    `;
    prevPage = page;
  });
 
  // Assemble full pagination bar
  container.innerHTML = `
    <button class="page-btn prev-btn" data-page="${current - 1}" ${current === 1 ? 'disabled' : ''}>
      <i class="fa-solid fa-chevron-left"></i> Previous
    </button>
 
    <div class="page-numbers">${numbersHTML}</div>
 
    <button class="page-btn next-btn" data-page="${current + 1}" ${current === totalPages ? 'disabled' : ''}>
      Next <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;
 
  /*
    Event delegation on the container.
    Handles ALL buttons (prev, page numbers, next) with ONE listener.
    We read data-page="${number}" from whatever was clicked.
 
    parseInt() converts the string "3" to the number 3.
    dataset values are ALWAYS strings — math operations need numbers.
    "3" + 1 = "31" (string concat) ← WRONG
    3   + 1 = 4    (addition)      ← CORRECT
  */
  container.addEventListener('click', function(e) {
    const btn = e.target.closest('.page-btn');
    if (!btn || btn.disabled || btn.classList.contains('active')) return;
 
    state.currentPage = parseInt(btn.dataset.page);
    renderPage();
 
    /*
      Scroll to top of product area so user sees new products.
      behavior: 'smooth' animates the scroll instead of jumping.
      This is the same UX pattern every e-commerce site uses
      (Amazon, ASOS) when you click a pagination button.
    */
    document.getElementById('shop-products-grid')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
}
 
 
/* ─────────────────────────────────────────────────────────────
   9. updateCount()
   ─────────────────────────────────────────────────────────────
   Updates "Showing 1-10 of 194 products"
 
   MATH:
     start = (currentPage - 1) * perPage + 1
           = (1 - 1) * 10 + 1 = 1    (page 1 starts at item 1)
           = (2 - 1) * 10 + 1 = 11   (page 2 starts at item 11)
 
     end   = Math.min(currentPage * perPage, total)
           = Math.min(1 * 10, 194) = 10   (page 1 ends at item 10)
           = Math.min(20 * 10, 194) = 194 (last page, capped at total)
 
     Math.min() prevents showing "Showing 191-200 of 194"
     — correctly shows "Showing 191-194 of 194" instead.
───────────────────────────────────────────────────────────── */
function updateCount() {
  const countEl = document.getElementById('product-count');
  if (!countEl) return;
 
  const total = state.filtered.length;
 
  if (total === 0) {
    countEl.textContent = 'No products found';
    return;
  }
 
  const start = (state.currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end   = Math.min(state.currentPage * ITEMS_PER_PAGE, total);
 
  countEl.textContent = `Showing ${start}-${end} of ${total} products`;
}
 
 
/* ─────────────────────────────────────────────────────────────
   10. setupEventListeners()
   ─────────────────────────────────────────────────────────────
   Category accordion, clear filter, and mobile sidebar controls.
   Called once after init — these elements exist in the HTML
   from the start, so we can attach directly (no delegation needed).
───────────────────────────────────────────────────────────── */
function setupEventListeners() {
 
  // ── Category accordion toggle ──────────────────────────
  const categoryToggle = document.getElementById('category-toggle');
  const categoryList   = document.getElementById('category-list');
 
  if (categoryToggle && categoryList) {
    categoryToggle.addEventListener('click', function() {
      /*
        getAttribute returns a string: "true" or "false".
        We compare with the string "true" (not the boolean true).
        Then toggle: if open → close, if closed → open.
      */
      const isOpen = this.getAttribute('aria-expanded') === 'true';
 
      this.setAttribute('aria-expanded', !isOpen);
 
      /*
        Inline style toggle — show/hide the list.
        We use style.display because the list was hidden with
        style="display:none" in the HTML. A class toggle wouldn't
        override inline styles without !important.
      */
      categoryList.style.display = isOpen ? 'none' : 'block';
    });
  }
 
 
  // ── Clear Filter ───────────────────────────────────────
  document.getElementById('clear-filter-btn')?.addEventListener('click', function() {
    /*
      ?. is Optional Chaining — if getElementById returns null
      (element doesn't exist), the whole expression returns undefined
      instead of throwing "Cannot read property 'addEventListener' of null".
 
      Clearing the filter means:
      ▸ Reset activeCategory to null (show all)
      ▸ Reset filtered to full list
      ▸ Reset to page 1
      ▸ Re-render
    */
    state.activeCategory = null;
    state.filtered       = [...state.allProducts];
    state.currentPage    = 1;
    renderPage();
  });
 
 
  // ── Mobile filter sidebar ──────────────────────────────
  const mobileBtn = document.getElementById('mobile-filter-btn');
  const sidebar   = document.getElementById('filter-sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
 
  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('visible');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  }
 
  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('visible');
    document.body.style.overflow = ''; // Restore scroll
  }
 
  mobileBtn?.addEventListener('click', openSidebar);
  overlay?.addEventListener('click', closeSidebar);
 
  // Close sidebar when a category is picked (good mobile UX)
  document.getElementById('category-list')?.addEventListener('click', function() {
    if (window.innerWidth < 992) closeSidebar();
  });
}
 
 
/* ─────────────────────────────────────────────────────────────
   11. HELPERS
───────────────────────────────────────────────────────────── */
 
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
 
// Cart badge — reads localStorage same as cart.js
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  try {
    const cart = JSON.parse(localStorage.getItem('shopco_cart') || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.classList.add('visible');
    }
  } catch (_) {}
}
 