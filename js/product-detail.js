import { products } from "./products.js";

document.addEventListener("DOMContentLoaded", function () {
  // ========== PRODUCT STATE (Data Storage) ==========
  // This object stores all current user selections
  const productState = {
    selectedSize: "large",
    quantity: 1,
    price: 260,
    productName: "ONE LIFE GRAPHIC T-SHIRT",
  };

  // ========== GET DOM ELEMENTS ==========
  // Store references to HTML elements we'll interact
  const sizeButtons = document.querySelectorAll(".size-btn");
  const qtyDecreaseBtn = document.querySelector(".qty-decrease");
  const qtyIncreaseBtn = document.querySelector(".qty-increase");
  const qtyDisplay = document.getElementById("quantity-display");
  const addToCartBtn = document.getElementById("add-to-cart-btn");

  // ========== SIZE SELECTION ==========
  function selectSize(clickedButton) {
    // 1. Remove 'active' class from all size buttons
    sizeButtons.forEach((button) => {
      button.classList.remove("active");
    });

    // 2. Add 'active' class to clicked button
    clickedButton.classList.add("active");

    // 3. Store selection in productState
    productState.selectedSize = clickedButton.dataset.size;

    // 4. Log for debugging
    console.log("size selected:", productState.selectedSize);
  }

  // Attach click event to all size buttons
  sizeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      selectSize(this);
    });
  });

  // ========== QUANTITY CONTROLS ==========

  function decreaseQuantity() {
    //Only decrease if quantity is greater than 1
    if (productState.quantity > 1) {
      productState.quantity--;
      updateQuantityDisplay();
    }
  }

  function increaseQuantity() {
    // Increase quantity (add max-limit later)
    productState.quantity++;
    updateQuantityDisplay();
  }

  function updateQuantityDisplay() {
    // Update the number shown on screen
    qtyDisplay.textContent = productState.quantity;
    console.log("Quantity updated:", productState.quantity);
  }

  // Attach click events to quantity buttons
  qtyDecreaseBtn.addEventListener("click", decreaseQuantity);
  qtyIncreaseBtn.addEventListener("click", increaseQuantity);

  // ========== ADD TO CART ==========
  function addToCart() {

    // 2. Create cart item object with all selections
    const cartItem = {
      product: productState.productName,
      size: productState.selectedSize,
      quantity: productState.quantity,
      price: productState.price,
      total: productState.price * productState.quantity
    };

    // 3. Log cart item(later we'll save to localStorage or send to server)
    console.log("Added to cart:", cartItem);

    // 4. Show success message
    alert(`Added to cart!\n
    \nProduct: ${cartItem.product}
    \nSize: ${cartItem.size}
    \nQuantity: ${cartItem.quantity}
    \nPrice: $${cartItem.price}
    \nTotal: $${cartItem.total}`);

    }

    // TODO: Later we'll add:
    // - Save to localStorage
    // - Update cart count in navbar
    // - Show cart sidebar


  // Attach click event to Add to Cart button
  addToCartBtn.addEventListener("click", addToCart);

  // ========== THUMBNAIL IMAGE SWITCHING ==========
  const thumbnails = document.querySelectorAll(".thumbnail");
  const mainImage = document.getElementById("main-product-image");

  function changeMainImage(clickedThumbnail) {
    // 1. Remove 'active' class from all thumbnails
    thumbnails.forEach((thumb) => {
      thumb.classList.remove("active");
    });

    // 2. Add 'active' class to clicked thumbnail
    clickedThumbnail.classList.add("active");

    // 3. Change main image source to clicked thumbnail's full image
    const fullImagePath = clickedThumbnail.dataset.full;
    mainImage.src = fullImagePath;
  }

  // Attach click events to thumbnails
  thumbnails.forEach((thumb) => {
    thumb.addEventListener("click", function () {
      changeMainImage(this);
    });
  });

  // ========== INITIALIZATION ==========
  console.log("Product page loaded successfully!");
  console.log("Initial state:", productState);

  // ============================================
// DYNAMIC PRODUCT LOADING
// ============================================
// Get product ID from URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// Find the product
const product = products.find(p => p.id == productId);

// If product not found, redirect to homepage
if (!product) {
  alert("Product not found!");
  window.location.href = "../index.html";
}

// ========== UPDATE PAGE WITH PRODUCT DATA ==========
function loadProductData() {
 
  // 1. UPDATE TITLE
  document.getElementById('product-title').textContent = product.name;
 
  // 2. UPDATE RATING
  const starsContainer = document.querySelector('.stars');
  starsContainer.innerHTML = renderStars(product.rating);
  document.getElementById('rating-text').textContent = `${product.rating}/5`;
 
  // 3. UPDATE PRICES
  document.getElementById('current-price').textContent = `$${product.price}`;
 
  const oldPriceElement = document.getElementById('original-price');
  const discountBadge = document.getElementById('discount-badge');
 
  if (product.oldPrice) {
    oldPriceElement.textContent = `$${product.oldPrice}`;
    const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
    discountBadge.textContent = `-${discount}%`;
  } else {
    oldPriceElement.style.display = 'none';
    discountBadge.style.display = 'none';
  }
 
  // 4. UPDATE DESCRIPTION
  document.getElementById('product-description').textContent = product.description;
 
  // 5. UPDATE IMAGES
  const mainImage = document.getElementById('main-product-image');
  mainImage.src = product.images[0];
 
  const thumbnailsContainer = document.querySelector('.thumbnails-column');
  thumbnailsContainer.innerHTML = product.images.map((img, index) => `
    <img src="${img}"
         alt="Product view ${index + 1}"
         class="thumbnail img-fluid rounded-2 ${index === 0 ? 'active' : ''}"
         data-full="${img}">
  `).join('');
 
  // 7. UPDATE SIZES
  const sizeOptions = document.querySelector('.size-options');
  if (product.sizes && product.sizes.length > 0) {
    sizeOptions.innerHTML = product.sizes.map((size, index) => `
      <button class="size-btn ${index === 2 ? 'active' : ''}" data-size="${size.toLowerCase()}">
        ${size}
      </button>
    `).join('');
  };
 
  // 8. UPDATE PRODUCT STATE
  productState.price = product.price;
  productState.productName = product.name;
 
  console.log('Product loaded:', product.name);
}

// Helper function to render stars
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  let html = '';
 
  for (let i = 0; i < fullStars; i++) {
    html += '<i class="fa-solid fa-star"></i>';
  }
 
  if (hasHalf) {
    html += '<i class="fa-solid fa-star-half-stroke"></i>';
  }
 
  const empty = 5 - Math.ceil(rating);
  for (let i = 0; i < empty; i++) {
    html += '<i class="fa-regular fa-star"></i>';
  }
 
  return html;
}

// Load product data when page loads
loadProductData();

 // ========== EVENT DELEGATION ==========
  
  // Sizes (Parent listener)
  document.querySelector('.size-options').addEventListener('click', function(e) {
    const button = e.target.closest('.size-btn');
    if (button) selectSize(button);
  });
  
  // Thumbnails (Parent listener)
  document.querySelector('.thumbnails-column').addEventListener('click', function(e) {
    const thumb = e.target.closest('.thumbnail');
    if (thumb) changeMainImage(thumb);
  });
  
  // ========== REGULAR LISTENERS (Not dynamic) ==========
  document.querySelector('.qty-decrease').addEventListener('click', decreaseQuantity);
  document.querySelector('.qty-increase').addEventListener('click', increaseQuantity);
  document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
  
  // Tabs
  document.querySelectorAll('.nav-tabs .nav-link').forEach(button => {
    button.addEventListener('click', function() {
      switchTab(this);
    });
  });

});
