import { products } from "./products.js";
import { reviews } from "./review.js";

document.addEventListener("DOMContentLoaded", function () {
  // ============================================
  // 1. GET PRODUCT DATA FROM URL
  // ============================================

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const product = products.find((p) => p.id == productId);

  // Redirect if product not found
  if (!product) {
    alert("Product not found!");
    window.location.href = "../index.html";
    return;
  }

  // ============================================
  // 2. STATE MANAGEMENT
  // ============================================

  // Product selections
  const productState = {
    selectedSize: "large",
    quantity: 1,
    price: product.price,
    productName: product.name,
  };

  // Reviews state
  let currentReviewsShown = 6;
  let allProductReviews = [];
  let originalProductReviews = [];

  // ============================================
  // 3. HELPER FUNCTIONS
  // ============================================

  // ────── RENDER STARS ──────
  function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const empty = 5 - Math.ceil(rating);
    let html = "";

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      html += '<i class="fa-solid fa-star"></i>';
    }

    // Half star
    if (hasHalf) {
      html += '<i class="fa-solid fa-star-half-stroke"></i>';
    }

    // Empty stars
    for (let i = 0; i < empty; i++) {
      html += '<i class="fa-regular fa-star"></i>';
    }

    return html;
  }

  // ────── SMOOTH TRANSITION ──────
  function smoothTransition(callback) {
    const container = document.querySelector(".reviews-card-container");

    // Fade out
    container.style.opacity = "0";

    setTimeout(() => {
      // Show loading spinner
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--color-text-muted);"></i>
        </div>
      `;
      container.style.opacity = "1";

      setTimeout(() => {
        container.style.opacity = "0";

        setTimeout(() => {
          callback();
          container.style.opacity = "1";
        }, 200);
      }, 300);
    }, 300);
  }

  // ============================================
  // 4. PRODUCT DATA FUNCTIONS
  // ============================================

  // ────── LOAD PRODUCT DATA ──────
  function loadProductData() {
    // Update title
    document.getElementById("product-title").textContent = product.name;

    // Update rating
    const starsContainer = document.querySelector(".stars");
    starsContainer.innerHTML = renderStars(product.rating);
    document.getElementById("rating-text").textContent = `${product.rating}/5`;

    // Update prices
    document.getElementById("current-price").textContent = `$${product.price}`;

    const oldPriceElement = document.getElementById("original-price");
    const discountBadge = document.getElementById("discount-badge");

    if (product.oldPrice) {
      oldPriceElement.textContent = `$${product.oldPrice}`;
      const discount = Math.round(
        ((product.oldPrice - product.price) / product.oldPrice) * 100
      );
      discountBadge.textContent = `-${discount}%`;
    } else {
      oldPriceElement.style.display = "none";
      discountBadge.style.display = "none";
    }

    // Update description
    document.getElementById("product-description").textContent =
      product.description;

    // Update images
    const mainImage = document.getElementById("main-product-image");
    mainImage.src = product.images[0];

    const thumbnailsContainer = document.querySelector(".thumbnails-column");
    thumbnailsContainer.innerHTML = product.images
      .map(
        (img, index) => `
        <img src="${img}"
             alt="Product view ${index + 1}"
             class="thumbnail img-fluid rounded-2 ${index === 0 ? "active" : ""}"
             data-full="${img}">
      `
      )
      .join("");

    // Update sizes
    const sizeOptions = document.querySelector(".size-options");
    if (product.sizes && product.sizes.length > 0) {
      sizeOptions.innerHTML = product.sizes
        .map(
          (size, index) => `
          <button class="size-btn ${index === 2 ? "active" : ""}" data-size="${size.toLowerCase()}">
            ${size}
          </button>
        `
        )
        .join("");
    }

    // Update product state
    productState.price = product.price;
    productState.productName = product.name;
  }

  // ============================================
  // 5. REVIEW FUNCTIONS
  // ============================================

  // ────── LOAD REVIEWS ──────
  function loadReviews() {
    allProductReviews = reviews.filter((r) => r.productId == productId);
    originalProductReviews = [...allProductReviews];

    currentReviewsShown = 6;
    displayReviews();

    document.querySelector(".reviews-count").textContent =
      `(${allProductReviews.length})`;
  }

  // ────── DISPLAY REVIEWS ──────
  function displayReviews() {
    const reviewsToShow = allProductReviews.slice(0, currentReviewsShown);
    const reviewsContainer = document.querySelector(".reviews-card-container");

    if (reviewsToShow.length === 0) {
      // No reviews message
      reviewsContainer.innerHTML = `
        <div class="no-reviews-message" style="text-align: center; padding: 3rem; color: #999;">
          <i class="fa-regular fa-face-frown" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          <p style="font-size: 1.125rem; margin: 0;">No reviews found for this rating.</p>
        </div>
      `;
    } else {
      // Display review cards
      const reviewsHtml = reviewsToShow
        .map(
          (review) => `
          <div class="review-card">
            <div class="review-header">
              <div class="review-stars">
                ${renderStars(review.rating)}
              </div>
              <button class="review-menu-btn" aria-label="Review options">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
            </div>
            
            <div class="review-author">
              <span class="author-name">${review.author}</span>
              ${review.verified ? '<i class="fa-solid fa-circle-check verified-badge"></i>' : ""}
            </div>
            
            <p class="review-text">"${review.text}"</p>
            <p class="review-date">Posted on ${review.date}</p>
          </div>
        `
        )
        .join("");

      reviewsContainer.innerHTML = reviewsHtml;
    }

    // Show/hide load more button
    const loadMoreBtn = document.getElementById("load-more-reviews");
    if (
      currentReviewsShown >= allProductReviews.length ||
      allProductReviews.length === 0
    ) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.style.display = "inline-block";
    }
  }

  // ────── FILTER REVIEWS ──────
  function filterReviewsByRating(rating) {
    let reviewsToFilter = originalProductReviews;
    let targetRating;

    if (rating !== "all") {
      targetRating = parseInt(rating);
      reviewsToFilter = originalProductReviews.filter(
        (review) => Math.floor(review.rating) === targetRating
      );
    }

    allProductReviews = reviewsToFilter;
    currentReviewsShown = 6;

    smoothTransition(() => {
      displayReviews();
      document.querySelector(".reviews-count").textContent =
        `(${allProductReviews.length})`;
    });
  }

  // ────── SORT REVIEWS ──────
  function sortReviews(sortBy) {
    let sortedReviews = [...allProductReviews];

    switch (sortBy) {
      case "latest":
        sortedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;

      case "oldest":
        sortedReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;

      case "highest":
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;

      case "lowest":
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
    }

    allProductReviews = sortedReviews;
    currentReviewsShown = 6;

    smoothTransition(() => {
      displayReviews();
    });
  }

  // ============================================
  // 6. PRODUCT INTERACTION FUNCTIONS
  // ============================================

  // ────── SIZE SELECTION ──────
  function selectSize(clickedButton) {
    const sizeButtons = document.querySelectorAll(".size-btn");
    sizeButtons.forEach((button) => button.classList.remove("active"));
    clickedButton.classList.add("active");
    productState.selectedSize = clickedButton.dataset.size;
  }

  // ────── QUANTITY CONTROLS ──────
  function decreaseQuantity() {
    if (productState.quantity > 1) {
      productState.quantity--;
      updateQuantityDisplay();
    }
  }

  function increaseQuantity() {
    productState.quantity++;
    updateQuantityDisplay();
  }

  function updateQuantityDisplay() {
    const qtyDisplay = document.getElementById("quantity-display");
    qtyDisplay.textContent = productState.quantity;

    // Bounce animation
    qtyDisplay.classList.add("updated");
    setTimeout(() => {
      qtyDisplay.classList.remove("updated");
    }, 300);
  }

  // ────── ADD TO CART ──────
  function addToCart() {
    const cartItem = {
      product: productState.productName,
      size: productState.selectedSize,
      quantity: productState.quantity,
      price: productState.price,
      total: productState.price * productState.quantity,
    };

    alert(
      `Added to cart!\n\nProduct: ${cartItem.product}\nSize: ${cartItem.size}\nQuantity: ${cartItem.quantity}\nPrice: $${cartItem.price}\nTotal: $${cartItem.total}`
    );
  }

  // ────── THUMBNAIL SWITCHING ──────
  function changeMainImage(clickedThumbnail) {
    const thumbnails = document.querySelectorAll(".thumbnail");
    thumbnails.forEach((thumb) => thumb.classList.remove("active"));
    clickedThumbnail.classList.add("active");

    const mainImage = document.getElementById("main-product-image");
    mainImage.src = clickedThumbnail.dataset.full;
  }

  // ────── TAB SWITCHING ──────
  function switchTab(clickedButton) {
    const targetTab = clickedButton.dataset.tab;

    // Update tab buttons
    const tabButtons = document.querySelectorAll(".nav-tabs .nav-link");
    tabButtons.forEach((button) => button.classList.remove("active"));
    clickedButton.classList.add("active");

    // Update tab panels
    const tabPanels = document.querySelectorAll(".tab-pane");
    tabPanels.forEach((panel) => panel.classList.remove("active"));

    const targetPanel = document.getElementById(`${targetTab}-content`);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }

    // Show/hide reviews header
    const reviewHeader = document.querySelector(".reviews-header");
    reviewHeader.style.display =
      targetTab === "rating-reviews" ? "flex" : "none";
  }

  // ============================================
  // 7. DROPDOWN HANDLERS
  // ============================================

  // Toggle dropdowns on click
  const dropdownTriggers = document.querySelectorAll(".dropdown-trigger");
  
  dropdownTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();

      const dropdown = this.closest(".custom-dropdown");
      const isOpen = dropdown.classList.contains("open");

      // Close all dropdowns
      document.querySelectorAll(".custom-dropdown").forEach((dd) => {
        dd.classList.remove("open");
      });

      // Open this one if it was closed
      if (!isOpen) {
        dropdown.classList.add("open");
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".custom-dropdown")) {
      document.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
        dropdown.classList.remove("open");
      });
    }
  });

  // Close dropdown when option selected
  document.querySelectorAll(".dropdown-content a").forEach((link) => {
    link.addEventListener("click", function () {
      const dropdown = this.closest(".custom-dropdown");
      dropdown.classList.remove("open");
    });
  });

  // ============================================
  // 8. EVENT LISTENERS
  // ============================================

  // Size selection (event delegation)
  document
    .querySelector(".size-options")
    .addEventListener("click", function (e) {
      const button = e.target.closest(".size-btn");
      if (button) selectSize(button);
    });

  // Thumbnail switching (event delegation)
  document
    .querySelector(".thumbnails-column")
    .addEventListener("click", function (e) {
      const thumb = e.target.closest(".thumbnail");
      if (thumb) changeMainImage(thumb);
    });

  // Quantity controls
  document
    .querySelector(".qty-decrease")
    .addEventListener("click", decreaseQuantity);
  document
    .querySelector(".qty-increase")
    .addEventListener("click", increaseQuantity);

  // Add to cart
  document
    .getElementById("add-to-cart-btn")
    .addEventListener("click", addToCart);

  // Tab navigation
  document.querySelectorAll(".nav-tabs .nav-link").forEach((button) => {
    button.addEventListener("click", function () {
      switchTab(this);
    });
  });

  // Load more reviews
  document
    .getElementById("load-more-reviews")
    .addEventListener("click", function () {
      currentReviewsShown += 6;
      smoothTransition(() => {
        displayReviews();
      });
    });

  // Filter reviews
  document.querySelectorAll(".filter-option").forEach((option) => {
    option.addEventListener("click", function (e) {
      e.preventDefault();

      const rating = this.dataset.rating;

      // Update active state
      document.querySelectorAll(".filter-option").forEach((opt) => {
        opt.classList.remove("active");
      });
      this.classList.add("active");

      filterReviewsByRating(rating);
    });
  });

  // Sort reviews
  document.querySelectorAll(".sort-option").forEach((option) => {
    option.addEventListener("click", function (e) {
      e.preventDefault();

      const sortBy = this.dataset.sort;

      // Update active state
      document.querySelectorAll(".sort-option").forEach((opt) => {
        opt.classList.remove("active");
      });
      this.classList.add("active");

      // Update button text
      document.querySelector("#sortBtn span").textContent = this.textContent;

      sortReviews(sortBy);
    });
  });

  // ============================================
  // 9. INITIALIZE
  // ============================================

  loadProductData();
  loadReviews();
}); // End DOMContentLoaded