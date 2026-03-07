import { products } from "./products.js";
import { reviews } from "./review.js";
import { getAllProducts } from "./api-service.js";
import { createProductCard } from "./render-products.js";
import { attachProductCardListeners } from "./render-products.js";


document.addEventListener("DOMContentLoaded", async function () {
  // ============================================
  // 1. GET PRODUCT DATA FROM URL
  // ============================================

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  
  // Get all products (local + API)
  const allProducts = await getAllProducts(products);
  const product = allProducts.find((p) => p.id == productId);

  // Redirect if product not found
  if (!product) {
    alert("Product not found!");
    window.location.href = "../index.html";
    return;
  }

  // Hide spinner, reveal real content
  document.getElementById('product-loading-spinner').style.display = 'none';
  document.querySelector('.product-main-row').classList.add('loaded');

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
        ((product.oldPrice - product.price) / product.oldPrice) * 100,
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
      `,
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
        `,
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

  function loadSimilarProducts() {

    // Use apiCategory for precise matching, fall back to broad category for local products
    const matchKey = product.apiCategory || product.category;
    const matchField = product.apiCategory ? 'apiCategory' : 'category';

    let similarProducts = allProducts
      .filter(p => p[matchField] === matchKey && p.id !== product.id);

    // Fallback — if empty, try same broad category
    if (similarProducts.length === 0) {
      similarProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id);
    }

    const similarProductsContainer = document.getElementById("similar-products-container");
    if (!similarProductsContainer) return;

    similarProductsContainer.innerHTML = similarProducts.map(createProductCard).join('');
   
    similarProductsContainer.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', function (){
        window.location.href = `../pages/product-details.html?id=${this.dataset.id}`
      })
    });
    // ── Scroll logic ──
    const track = document.getElementById("similar-scroll-track");
    const inner = similarProductsContainer;
    const leftBtn = document.getElementById("similar-scroll-left");
    const rightBtn = document.getElementById("similar-scroll-right");

    let currentIndex = 0;
    const visibleCount = window.innerWidth <= 768 ? 1.3 : 4;
    const gap = 16;

    function getCardWidth() {
      const fullCards = Math.floor(visibleCount);
      const totalGap = gap * (fullCards - 1);
      return (track.offsetWidth - totalGap) / visibleCount;
    }

    function updateScroll() {
      const cardWidth = getCardWidth();
      inner.querySelectorAll("[class*=\"col-\"]").forEach(col => {
        col.style.flex = `0 0 ${cardWidth}px`;
        col.style.width = `${cardWidth}px`;
      });
      inner.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
      leftBtn.disabled = currentIndex === 0;
      rightBtn.disabled = currentIndex >= Math.ceil(similarProducts.length - visibleCount);
    }

    leftBtn.addEventListener("click", () => {
      if (currentIndex > 0) { currentIndex--; updateScroll(); }
    });

    rightBtn.addEventListener("click", () => {
      if (currentIndex < Math.ceil(similarProducts.length - visibleCount)) { currentIndex++; updateScroll(); }
    });

    // Set initial button state
    requestAnimationFrame(updateScroll);
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
        `,
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
        (review) => Math.floor(review.rating) === targetRating,
      );
    }

    allProductReviews = reviewsToFilter;
    currentReviewsShown = 6;

    smoothTransition(() => {
      displayReviews();

      const countElement = document.querySelector(".reviews-count");
      countElement.classList.add("fade");

      setTimeout(() => {
        countElement.textContent = `(${allProductReviews.length})`;
        countElement.classList.remove("fade");
      }, 200);

    });
  }

  // ────── SORT REVIEWS ──────
  function sortReviews(sortBy) {
    let sortedReviews = [...originalProductReviews];

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

      document.querySelector(".reviews-count").textContent =
        `(${allProductReviews.length})`;
    
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
      `Added to cart!\n\nProduct: ${cartItem.product}\nSize: ${cartItem.size}\nQuantity: ${cartItem.quantity}\nPrice: $${cartItem.price}\nTotal: $${cartItem.total}`,
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
  // WRITE REVIEW MODAL
  // ============================================

  // ────── MODAL CONTROLS ──────
  function openReviewModal() {
    const modal = document.getElementById("reviewModal");
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeReviewModal() {
    const modal = document.getElementById("reviewModal");
    modal.classList.remove("active");
    document.body.style.overflow = "";
    resetReviewForm();
  }

  function resetReviewForm() {
    // Reset star rating
    selectedRating = 0;
    document.querySelectorAll(".star-rating-input i").forEach((star) => {
      star.classList.remove("selected");
      star.classList.replace("fa-solid", "fa-regular");
    });
    document.getElementById("ratingText").textContent = "Select a rating";

    // Reset inputs

    const reviewForm = document.getElementById("review-form");

    if (reviewForm) reviewForm.reset();

    if (charCount) charCount.textContent = "0";
    //  charCount.style.color = 'var(--color-text-muted)';
  }
  // Clear errors
  document.querySelectorAll(".error-message").forEach((error) => {
    error.classList.remove("show");
  });
  document.querySelectorAll(".form-input, .form-textarea").forEach((input) => {
    input.classList.remove("error");
  });

  // ────── STAR RATING INTERACTION ──────
  let selectedRating = 0;

  function setupStarRating() {
    const stars = document.querySelectorAll(".star-rating-input i");
    const ratingText = document.getElementById("ratingText");

    const ratingLabels = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };

    stars.forEach((star) => {
      // 1. Hover Effect (Mouse Enter)
      star.addEventListener("mouseenter", function () {
        const rating = parseInt(this.dataset.rating);

        highlightStars(rating, true);
        ratingText.innerHTML = `
       <span class="rating-preview-stars">
    ${renderStars(rating)}
  </span>
  ${ratingLabels[rating]}`;
        ratingText.classList.remove("error-active");
        ratingText.style.color = "";
      });

      // 2. Mouse Leave (Back to selection)
      star.addEventListener("mouseleave", function () {
        highlightStars(selectedRating, false);

        if (selectedRating > 0) {
          ratingText.innerHTML = ` <span class="rating-preview-stars">
    ${renderStars(rating)}
  </span> ${ratingLabels[selectedRating]}`;
        } else {
          ratingText.textContent = "Select a rating";
        }
      });

      // Click to select
      star.addEventListener("click", function () {
        selectedRating = parseInt(this.dataset.rating);
        selectStars(selectedRating);

        // Keep the visual consistent on click
        ratingText.innerHTML = ` <span class="rating-preview-stars">
    ${renderStars(rating)}
  </span> ${ratingLabels[selectedRating]}`;
      });
    });
  }

  function highlightStars(rating, isHover) {
    const stars = document.querySelectorAll(".star-rating-input i");
    stars.forEach((star, index) => {
      star.classList.toggle("hover", isHover && index < rating);
    });
  }

  function selectStars(rating) {
    const stars = document.querySelectorAll(".star-rating-input i");
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add("selected");
        star.classList.replace("fa-regular", "fa-solid");
      } else {
        star.classList.remove("selected");
        star.classList.replace("fa-solid", "fa-regular");
      }
    });
  }

  // ────── CHARACTER COUNTER ──────

  function setupCharCounter() {
    const textarea = document.getElementById("reviewTextarea");
    const charCount = document.getElementById("charCount");

    textarea.addEventListener("input", function () {
      const count = this.value.length;
      charCount.textContent = count;

      // Color changes based on length
      if (count > 150) {
        charCount.style.color = "#dc2626"; // Red when near limit
      } else if (count > 120) {
        charCount.style.color = "#f59e0b"; // Orange
      } else {
        charCount.style.color = "var(--color-text-muted)"; // Default
      }
    });
  }

  // ────── FORM VALIDATION ──────
  function validateReviewForm() {
    let isValid = true;

    const reviewModal = document.querySelector(".review-modal");
    reviewModal.classList.remove("error");

    // Validate rating
    if (selectedRating === 0) {
      showError("ratingText", "Please select a rating");
      isValid = false;
    }

    // Validate name
    const name = document.getElementById("reviewerName").value.trim();
    const nameInput = document.getElementById("reviewerName");
    const nameError = document.getElementById("nameError");

    if (name === "") {
      nameInput.classList.add("error");
      nameError.textContent = "Name is required";
      nameError.classList.add("show");
      isValid = false;
    } else if (name.length < 2) {
      nameInput.classList.add("error");
      nameError.textContent = "Name must be at least 2 characters";
      nameError.classList.add("show");
      isValid = false;
    } else {
      nameInput.classList.remove("error");
      nameError.classList.remove("show");
    }

    // Validate review text
    const reviewText = document.getElementById("reviewTextarea").value.trim();
    const reviewTextarea = document.getElementById("reviewTextarea");
    const reviewError = document.getElementById("reviewError");

    if (reviewText === "") {
      reviewTextarea.classList.add("error");
      reviewError.textContent = "Review is required";
      reviewError.classList.add("show");
      isValid = false;
    } else if (reviewText.length < 10) {
      reviewTextarea.classList.add("error");
      reviewError.textContent = "Review must be at least 10 characters";
      reviewError.classList.add("show");
      isValid = false;
    } else {
      reviewTextarea.classList.remove("error");
      reviewError.classList.remove("show");
    }

    if (!isValid) {
      reviewModal.classList.add("error");
    }

    return isValid;
  }

  function showError(elementId, message) {
    const element = document.getElementById(elementId);

    element.textContent = message;
    element.classList.add("error-active");

    setTimeout(() => {
      element.classList.remove("error-active");
      if (elementId === "ratingText" && selectedRating === 0) {
        element.textContent = "Select a rating";
      }
    }, 3000);
  }

  // ────── SUBMIT REVIEW ──────
  function submitReview() {
    // Validate form
    if (!validateReviewForm()) {
      return;
    }

    // Get form data
    const name = document.getElementById("reviewerName").value.trim();
    const reviewText = document.getElementById("reviewTextarea").value.trim();
    const isVerified = document.getElementById("verifiedCheckbox").checked;

    // Create The New Review Object
    const newReview = {
      id: Date.now(), // Unique ID based on timestamp
      author: name,
      rating: selectedRating,
      text: reviewText,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      verified: isVerified,
    };

    //Add to review array
    reviews.unshift(newReview); // .unshift() puts the newest review at the TOP
    originalProductReviews.unshift(newReview);
    allProductReviews.unshift(newReview);

    // 5. Update the UI
    displayReviews(); // This function re-renders your list

    // Show success message
    showSuccessMessage();

    // 6. Cleanup
    resetReviewForm(); // The function we built earlier!

    // Close modal
    closeReviewModal();

    // Refresh reviews display with animation
    currentReviewsShown = 6;
    smoothTransition(() => {
      displayReviews();
      document.querySelector(".reviews-count").textContent =
        `(${allProductReviews.length})`;
    });
  }

  function showSuccessMessage() {
    const message = document.createElement("div");
    message.className = "success-message";
    message.innerHTML = `
    <i class="fa-solid fa-circle-check"></i>
    <span>Review submitted successfully!</span>
  `;

    document.body.appendChild(message);

    // Remove after 3 seconds
    setTimeout(() => {
      message.style.animation = "slideInRight 0.3s ease reverse";
      setTimeout(() => {
        message.remove();
      }, 300);
    }, 3000);
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
  // MODAL EVENT LISTENERS
  // ============================================

  // Open modal
  document
    .querySelector(".reviews-header .btn-dark")
    .addEventListener("click", openReviewModal);

  // Close modal - X button
  document
    .getElementById("closeModalBtn")
    .addEventListener("click", closeReviewModal);

  // Close modal - Cancel button
  document
    .getElementById("cancelBtn")
    .addEventListener("click", closeReviewModal);

  // Close modal - Click outside
  document
    .getElementById("reviewModal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        closeReviewModal();
      }
    });

  // Close modal - ESC key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("reviewModal");
      if (modal.classList.contains("active")) {
        closeReviewModal();
      }
    }
  });

  // Submit review
  document
    .getElementById("submitReviewBtn")
    .addEventListener("click", submitReview);
  // ============================================
  // 9. INITIALIZE
  // ============================================

  loadProductData();
  loadReviews();
  loadSimilarProducts()
  setupStarRating();
  setupCharCounter();
}); // End DOMContentLoaded
  
