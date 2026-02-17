import { products } from './products.js';

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
      <div class="product-card" data-id="${product.id}">
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

// Function to filter and display products
function displayProducts() {
  // Get NEW ARRIVALS (first 4 products with 'new-arrival' tag)
  const newArrivals = products.filter(p => p.tags.includes('new-arrival')).slice(0, 4);
  const newArrivalsContainer = document.getElementById('new-arrivals-container');
  if (newArrivalsContainer) {
    newArrivalsContainer.innerHTML = newArrivals.map(createProductCard).join('');
  }

  // Get TOP SELLING (first 4 products with 'top-selling' tag)
  const topSelling = products.filter(p => p.tags.includes('top-selling')).slice(0, 4);
  const topSellingContainer = document.getElementById('top-selling-container');
  if (topSellingContainer) {
    topSellingContainer.innerHTML = topSelling.map(createProductCard).join('');
  }

   // 👇 ADD THIS AFTER HTML IS INSERTED
  const productCards = document.querySelectorAll('.product-card');

  productCards.forEach(card => {
    card.addEventListener('click', function () {
      const productId = this.dataset.id;

      window.location.href = `../pages/product-details.html?id=${productId}`;
    });
  });

}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', displayProducts);
