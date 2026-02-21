import { products } from './products.js';
import { fetchApiProducts, getAllProducts, getPaginatedProducts } from './api-service.js';

// Storage for all products (local + API)
let allProducts = [];
let currentViewAllSection = null;
let currentViewAllPage = 0;

// Function to render star rating
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let starsHtml = '';

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<span class="star"><i class="fas fa-star"></i></span>';
  }

  // Half star
  if (hasHalfStar) {
    starsHtml += '<span class="star"><i class="fas fa-star-half-alt"></i></span>';
  }

  // Empty stars
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<span class="star empty"><i class="far fa-star"></i></span>';
  }

  return starsHtml;
}

// Function to create product card HTML
function createProductCard(product) {
  const discountPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  return `
    <div class="col-6 col-sm-6 col-md-4 col-lg-3">
      <div class="product-card" data-id="${product.id}" data-source="${product.source || 'local'}">
        <div class="product-image-wrapper">
          <img src="${product.images[0]}" alt="${product.name}" class="product-image" />
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating">
            <div class="star-rating">
              ${renderStars(product.rating)}
            </div>
            <span class="review-count">${product.reviewCount}</span>
          </div>
          <div class="product-price">
            <span class="current-price">$${product.price}</span>
            ${product.oldPrice ? `<span class="old-price">$${product.oldPrice}</span>` : ''}
            ${discountPercent ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Function to attach click listeners to product cards
function attachProductCardListeners() {
  const productCards = document.querySelectorAll('.product-card');

  productCards.forEach(card => {
    card.addEventListener('click', function () {
      const productId = this.dataset.id;

      window.location.href = `../pages/product-details.html?id=${productId}`;
    });
  });
}

// Function to create and show View All modal
function createViewAllModal(filteredProducts, sectionTitle) {
  let modalHtml = `
    <div class="view-all-modal-overlay" id="viewAllModal">
      <div class="view-all-modal-content">
        <div class="view-all-modal-header">
          <h2>${sectionTitle}</h2>
          <button class="view-all-modal-close" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="view-all-modal-body">
          <div class="row g-4" id="view-all-products-container">
            <!-- Products will be inserted here -->
          </div>
        </div>
        <div class="view-all-modal-footer">
          <button class="view-all-prev-btn" id="prevBtn" style="display: none;">← Previous</button>
          <span class="view-all-pagination" id="paginationInfo"></span>
          <button class="view-all-next-btn" id="nextBtn">Next →</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  const modal = document.getElementById('viewAllModal');
  const closeBtn = modal.querySelector('.view-all-modal-close');
  const containerDiv = document.getElementById('view-all-products-container');
  
  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.remove();
    currentViewAllSection = null;
    currentViewAllPage = 0;
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      currentViewAllSection = null;
      currentViewAllPage = 0;
    }
  });

  // Display paginated products
  displayViewAllProducts(filteredProducts, containerDiv);
}

// Function to display paginated products in View All modal
function displayViewAllProducts(filteredProducts, containerDiv) {
  const itemsPerPage = 12;
  const paginated = getPaginatedProducts(filteredProducts, currentViewAllPage, itemsPerPage);
  
  // Render products
  containerDiv.innerHTML = paginated.items.map(createProductCard).join('');
  attachProductCardListeners();

  // Update pagination info
  const paginationInfo = document.getElementById('paginationInfo');
  paginationInfo.textContent = `Page ${paginated.currentPage + 1} of ${paginated.totalPages}`;

  // Update button states
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (currentViewAllPage > 0) {
    prevBtn.style.display = 'inline-block';
    prevBtn.onclick = () => {
      currentViewAllPage--;
      displayViewAllProducts(filteredProducts, containerDiv);
      document.querySelector('.view-all-modal-body').scrollTop = 0;
    };
  } else {
    prevBtn.style.display = 'none';
  }

  if (currentViewAllPage < paginated.totalPages - 1) {
    nextBtn.style.display = 'inline-block';
    nextBtn.onclick = () => {
      currentViewAllPage++;
      displayViewAllProducts(filteredProducts, containerDiv);
      document.querySelector('.view-all-modal-body').scrollTop = 0;
    };
  } else {
    nextBtn.style.display = 'none';
  }
}

// Function to filter and display products
async function displayProducts() {
  // Fetch and combine all products
  allProducts = await getAllProducts(products);

  // Get NEW ARRIVALS (first 4 products with 'new-arrival' tag)
  const newArrivals = allProducts.filter(p => p.tags.includes('new-arrival')).slice(0, 4);
  const newArrivalsContainer = document.getElementById('new-arrivals-container');
  if (newArrivalsContainer) {
    newArrivalsContainer.innerHTML = newArrivals.map(createProductCard).join('');
    attachProductCardListeners();
  }

  // Get TOP SELLING (first 4 products with 'top-selling' tag)
  const topSelling = allProducts.filter(p => p.tags.includes('top-selling')).slice(0, 4);
  const topSellingContainer = document.getElementById('top-selling-container');
  if (topSellingContainer) {
    topSellingContainer.innerHTML = topSelling.map(createProductCard).join('');
    attachProductCardListeners();
  }

  // Get FEATURED from API (first 4 API products)
  const apiProducts = allProducts.filter(p => p.source === 'api');
  const featuredApi = apiProducts.slice(0, 4);
  const featuredApiContainer = document.getElementById('featured-api-container');
  if (featuredApiContainer) {
    featuredApiContainer.innerHTML = featuredApi.map(createProductCard).join('');
    attachProductCardListeners();
  }

  // Setup View All buttons
  setupViewAllButtons();
}

// Function to setup View All button listeners
function setupViewAllButtons() {
  const viewAllButtons = document.querySelectorAll('.btn-view-all');
  
  viewAllButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      currentViewAllPage = 0;
      let filteredProducts = [];
      let sectionTitle = '';

      if (index === 0) {
        // New Arrivals View All
        filteredProducts = allProducts.filter(p => p.tags.includes('new-arrival'));
        sectionTitle = 'All New Arrivals';
      } else if (index === 1) {
        // Top Selling View All
        filteredProducts = allProducts.filter(p => p.tags.includes('top-selling'));
        sectionTitle = 'All Top Selling Products';
      } else if (index === 2) {
        // Featured API View All
        filteredProducts = allProducts.filter(p => p.source === 'api');
        sectionTitle = 'All Featured Fashion';
      }

      if (filteredProducts.length > 0) {
        createViewAllModal(filteredProducts, sectionTitle);
      }
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', displayProducts);
