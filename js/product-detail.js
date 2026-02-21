import { products } from "./products.js";
import { reviews } from "./review.js";
import { getAllProducts } from "./api-service.js";

console.log("Reviews imported:", reviews);
console.log("Number of reviews:", reviews.length);

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
    return; // Stop execution
  }

  // ============================================
  // 2. PRODUCT STATE (User Selections)
  // ============================================

  const productState = {
    selectedSize: "large",
    quantity: 1,
    price: product.price, // Dynamic from product data
    productName: product.name, // Dynamic from product data
  };

  //Reviews state
  let currentReviewsShown = 6;
  let allProductReviews = [];

  // ============================================
  // 3. FUNCTION DEFINITIONS
  // ============================================

  // ────── RENDER STARS (Used by multiple functions) ──────
  function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    let html = "";

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      html += '<i class="fa-solid fa-star"></i>';
    }

    // Add half star if needed
    if (hasHalf) {
      html += '<i class="fa-solid fa-star-half-stroke"></i>';
    }

    // Add empty stars
    const empty = 5 - Math.ceil(rating);
    for (let i = 0; i < empty; i++) {
      html += '<i class="fa-regular fa-star"></i>';
    }

    return html;
  }

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

    console.log("✅ Product loaded:", product.name);
  }

  function displayReviews() {
    //Get reviews to show (from 0 to currentReviewsShown)
    const reviewsToShow = allProductReviews.slice(0, currentReviewsShown);

    // Get first 6 reviews

    // Create HTML for each review
    const reviewsHtml = reviewsToShow
      .map((review) => `
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
      ).join('');

    // Insert reviews into page
    document.querySelector(".reviews-card-container").innerHTML = reviewsHtml;

    //Show/Hide Load More Button
    const loadMoreBtn = document.getElementById("load-more-reviews");
    if (currentReviewsShown >= allProductReviews.length) {
      loadMoreBtn.style.display = "none"; //Hide if all shown
    } else {
      loadMoreBtn.style.display = "inline-block"; //Show if more available
    }

    console.log(
      `Showing ${reviewsToShow.length} of ${allProductReviews.length} reviews`,
    );
  }

  // ────── LOAD REVIEWS ──────
  function loadReviews() {
    //Get all reviews for this product
    allProductReviews = reviews.filter((r) => r.productId == productId);

    // Reset to first 6
    currentReviewsShown = 6;

    // Display first 6
    displayReviews();

    // Update review count
    document.querySelector(".reviews-count").textContent =
      `(${allProductReviews.length})`;

    console.log("✅ Reviews loaded:", allProductReviews.length);
  }

  // ────── SIZE SELECTION ──────
  function selectSize(clickedButton) {
    // Remove active from all size buttons
    const sizeButtons = document.querySelectorAll(".size-btn");
    sizeButtons.forEach((button) => button.classList.remove("active"));

    // Add active to clicked button
    clickedButton.classList.add("active");

    // Store selection in state
    productState.selectedSize = clickedButton.dataset.size;

    console.log("Size selected:", productState.selectedSize);
  }

  // ────── QUANTITY CONTROLS ──────
  function decreaseQuantity() {
    if (productState.quantity > 1) {
      productState.quantity--;
      updateQuantityDisplay();
    }
  }

  // ────── INCREASE QUANTITY CONTROLS ──────
  function increaseQuantity() {
    productState.quantity++;
    updateQuantityDisplay();
  }

  // ────── DECREASE QUANTITY CONTROLS ──────
  function updateQuantityDisplay() {
    const qtyDisplay = document.getElementById("quantity-display");
    qtyDisplay.textContent = productState.quantity;
    console.log("Quantity updated:", productState.quantity);
  }

  // ────── ADD TO CART ──────
  function addToCart() {
    // Create cart item object
    const cartItem = {
      product: productState.productName,
      size: productState.selectedSize,
      quantity: productState.quantity,
      price: productState.price,
      total: productState.price * productState.quantity,
    };

    // Log cart item
    console.log("Added to cart:", cartItem);

    // Show success message
    alert(
      `Added to cart!\n\nProduct: ${cartItem.product}\nSize: ${cartItem.size}\nQuantity: ${cartItem.quantity}\nPrice: $${cartItem.price}\nTotal: $${cartItem.total}`,
    );

    // TODO: Save to localStorage, update navbar count
  }

  // ────── THUMBNAIL IMAGE SWITCHING ──────
  function changeMainImage(clickedThumbnail) {
    // Remove active from all thumbnails
    const thumbnails = document.querySelectorAll(".thumbnail");
    thumbnails.forEach((thumb) => thumb.classList.remove("active"));

    // Add active to clicked thumbnail
    clickedThumbnail.classList.add("active");

    // Change main image
    const mainImage = document.getElementById("main-product-image");
    mainImage.src = clickedThumbnail.dataset.full;
  }

  // ────── TAB SWITCHING ──────
  function switchTab(clickedButton) {
    const targetTab = clickedButton.dataset.tab;

    // Remove active from all tab buttons
    const tabButtons = document.querySelectorAll(".nav-tabs .nav-link");
    tabButtons.forEach((button) => button.classList.remove("active"));

    // Add active to clicked button
    clickedButton.classList.add("active");

    // Hide all tab panels
    const tabPanels = document.querySelectorAll(".tab-pane");
    tabPanels.forEach((panel) => panel.classList.remove("active"));

    // Show target panel
    const targetPanel = document.getElementById(`${targetTab}-content`);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }

    // Show/hide reviews header based on tab
    const reviewHeader = document.querySelector(".reviews-header");
    if (targetTab === "rating-reviews") {
      reviewHeader.style.display = "flex";
    } else {
      reviewHeader.style.display = "none";
    }

    console.log("Switched to tab:", targetTab);
  }

  // ============================================
  // 4. EVENT LISTENERS (Event Delegation)
  // ============================================

  // Sizes (dynamically created, use delegation)
  document
    .querySelector(".size-options")
    .addEventListener("click", function (e) {
      const button = e.target.closest(".size-btn");
      if (button) selectSize(button);
    });

  // Thumbnails (dynamically created, use delegation)
  document
    .querySelector(".thumbnails-column")
    .addEventListener("click", function (e) {
      const thumb = e.target.closest(".thumbnail");
      if (thumb) changeMainImage(thumb);
    });

  // Quantity controls (static elements)
  document
    .querySelector(".qty-decrease")
    .addEventListener("click", decreaseQuantity);
  document
    .querySelector(".qty-increase")
    .addEventListener("click", increaseQuantity);

  // Add to cart button (static element)
  document
    .getElementById("add-to-cart-btn")
    .addEventListener("click", addToCart);

  // Tab navigation (static elements)
  document.querySelectorAll(".nav-tabs .nav-link").forEach((button) => {
    button.addEventListener("click", function () {
      switchTab(this);
    });

    //Load More Reviews button
    document
      .getElementById("load-more-reviews")
      .addEventListener("click", function () {
        currentReviewsShown += 6;
        displayReviews();
      });
  });

  // ============================================
  // 5. INITIALIZE - Load Data (LAST!)
  // ============================================

  loadProductData(); // Load product info first
  loadReviews(); // Then load reviews

  console.log("🚀 Product page initialized!");
  console.log("📦 Product:", product.name);
  console.log("💰 Price:", productState.price);
}); // End of DOMContentLoaded
