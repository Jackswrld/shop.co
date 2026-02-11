// ============================================
// PRODUCT PAGE - Interactive Functionality
// ============================================

// Wait for DOM to fully load before running code
document.addEventListener('DOMContentLoaded', function() {
  
  // ========== PRODUCT STATE (Data Storage) ==========
  // This object stores all current user selections
  const productState = {
    selectedColor: null,
    selectedColorName: null,
    selectedSize: 'large',        // Default: Large is pre-selected
    quantity: 1,
    price: 260,
    productName: 'ONE LIFE GRAPHIC T-SHIRT'
  };

  // ========== GET DOM ELEMENTS ==========
  // Store references to HTML elements we'll interact with
  const colorCircles = document.querySelectorAll('.color-circle');
  const sizeButtons = document.querySelectorAll('.size-btn');
  const qtyDecreaseBtn = document.querySelector('.qty-decrease');
  const qtyIncreaseBtn = document.querySelector('.qty-increase');
  const qtyDisplay = document.getElementById('quantity-display');
  const addToCartBtn = document.getElementById('add-to-cart-btn');

  // ========== COLOR SELECTION ==========
  
  function selectColor(clickedCircle) {
    // 1. Remove 'active' class from all color circles
    colorCircles.forEach(circle => {
      circle.classList.remove('active');
    });

    // 2. Add 'active' class to clicked circle
    clickedCircle.classList.add('active');

    // 3. Store selection in productState
    productState.selectedColor = clickedCircle.dataset.color;
    productState.selectedColorName = clickedCircle.dataset.colorName;

    // 4. Log for debugging (you can remove this later)
    console.log('Color selected:', productState.selectedColorName);
  }

  // Attach click event to all color circles
  colorCircles.forEach(circle => {
    circle.addEventListener('click', function() {
      selectColor(this);
    });
  });

  // ========== SIZE SELECTION ==========
  
  function selectSize(clickedButton) {
    // 1. Remove 'active' class from all size buttons
    sizeButtons.forEach(button => {
      button.classList.remove('active');
    });

    // 2. Add 'active' class to clicked button
    clickedButton.classList.add('active');

    // 3. Store selection in productState
    productState.selectedSize = clickedButton.dataset.size;

    // 4. Log for debugging
    console.log('Size selected:', productState.selectedSize);
  }

  // Attach click event to all size buttons
  sizeButtons.forEach(button => {
    button.addEventListener('click', function() {
      selectSize(this);
    });
  });

  // ========== QUANTITY CONTROLS ==========
  
  function decreaseQuantity() {
    // Only decrease if quantity is greater than 1
    if (productState.quantity > 1) {
      productState.quantity--;
      updateQuantityDisplay();
    }
  }

  function increaseQuantity() {
    // Increase quantity (you can add max limit later)
    productState.quantity++;
    updateQuantityDisplay();
  }

  function updateQuantityDisplay() {
    // Update the number shown on screen
    qtyDisplay.textContent = productState.quantity;
    console.log('Quantity:', productState.quantity);
  }

  // Attach click events to quantity buttons
  qtyDecreaseBtn.addEventListener('click', decreaseQuantity);
  qtyIncreaseBtn.addEventListener('click', increaseQuantity);

  // ========== ADD TO CART ==========
  
  function addToCart() {
    // 1. Validate: Check if color is selected
    if (!productState.selectedColor) {
      alert('Please select a color');
      return; // Stop function here if no color selected
    }

    // 2. Create cart item object with all selections
    const cartItem = {
      product: productState.productName,
      color: productState.selectedColorName,
      colorId: productState.selectedColor,
      size: productState.selectedSize,
      quantity: productState.quantity,
      price: productState.price,
      total: productState.price * productState.quantity
    };

    // 3. Log cart item (later we'll save to localStorage or send to server)
    console.log('Added to cart:', cartItem);

    // 4. Show success message
    alert(`Added to cart!\n\nProduct: ${cartItem.product}\nColor: ${cartItem.color}\nSize: ${cartItem.size}\nQuantity: ${cartItem.quantity}\nTotal: $${cartItem.total}`);

    // TODO: Later we'll add:
    // - Save to localStorage
    // - Update cart count in navbar
    // - Show cart sidebar
  }

  // Attach click event to Add to Cart button
  addToCartBtn.addEventListener('click', addToCart);

  // ========== THUMBNAIL IMAGE SWITCHING ==========
  // (Bonus feature - switch main image when clicking thumbnails)
  
  const thumbnails = document.querySelectorAll('.thumbnail');
  const mainImage = document.getElementById('main-product-image');

  function changeMainImage(clickedThumbnail) {
    // 1. Remove 'active' class from all thumbnails
    thumbnails.forEach(thumb => {
      thumb.classList.remove('active');
    });

    // 2. Add 'active' class to clicked thumbnail
    clickedThumbnail.classList.add('active');

    // 3. Change main image source to clicked thumbnail's full image
    const fullImagePath = clickedThumbnail.dataset.full;
    mainImage.src = fullImagePath;
  }

  // Attach click events to thumbnails
  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function() {
      changeMainImage(this);
    });
  });

  // ========== INITIALIZATION ==========
  console.log('Product page loaded successfully!');
  console.log('Initial state:', productState);

}); // End of DOMContentLoaded