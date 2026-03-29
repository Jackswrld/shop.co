/**
 * cart.js — Shopping Cart Logic
 * SHOP.CO E-Commerce Project
 */

/* 1. CONSTANTS & REGISTRY */
const PROMO_CODES = {
  SAVE20: {
    type: "percent", 
    value: 20,
    label: "-20%"
  },
  WELCOME10: {
    type: "percent", 
    value: 10,
    label: "-10%"
  },
 FLAT15: {
    type: "fixed", 
    value: 15,
    label: "-$15"
  },

};

const DELIVERY_FEE = 15;

/* 2. STATE Management */
let state = {
  cart: [],
  appliedPromo: null,
  promoCode: "",
};
/* 3. localStorage HELPERS */
function loadCartFromStorage() {
  try{
    const raw = localStorage.getItem("shopco_cart");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Cart data corruted, resetting:", err);
    return [];
  }
}

function saveCartToStorage(cart) {
  localStorage.setItem("shopco_cart", JSON.stringify(cart));
}

function loadPromoFromStorage() {
  try {
    const raw = localStorage.getItem("shopco_promo");
    return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
}
function savePromoToStorage(promo, code) {
  localStorage.setItem("shopco_promo", JSON.stringify({promo, code}));
}
 function clearPromoFromStorage() {
  localStorage.removeItem("shopco_promo");
 }
/* 4. CART OPERATIONS */

/**
 * Adds item to cart. Combines ID and Size to create a unique cartKey.
 */
function addToCart(item){
  const cartKey = `${item.id}_${item.size}`;
  const existingIndex = state.cart.findIndex((i) => i.cartKey === cartKey);

  if (existingIndex !== -1) {
    state.cart[existingIndex].quantity += item.quantity;
  } else {
    state.cart.push({ ...item, cartKey });
  }

  saveCartToStorage(state.cart);
  updateCartBadge();
  return true;
}

function removeFromCart(cartKey) {
  state.cart = state.cart.filter((item) => item.cartKey !== cartKey);
  saveCartToStorage(state.cart);
  renderCart();
  renderOrderSummary();
  updateCartBadge();
}

/**
 * Updates quantity based on delta (+1 or -1). Removes item if quantity < 1.
 */
function updateQuantity(cartKey, delta) {
  const index = state.cart.findIndex((i) => i.cartKey === cartKey);

  if (index === -1) return;

  const newQty = state.cart[index].quantity + delta;

  if (newQty <= 0) {
    removeFromCart(cartKey);
    return;
  }

  state.cart[index].quantity = newQty;
  saveCartToStorage(state.cart);
  renderCart();
  renderOrderSummary();
  updateCartBadge();
}

/* 5. CALCULATIONS */
function calculateSubtotal() {
  return state.cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

function calculateDiscount(subtotal) {
  if (!state.appliedPromo) return 0;

  if (state.appliedPromo.type === "percent") {
    return (subtotal * state.appliedPromo.value) / 100;
  }

  if (state.appliedPromo.type === "fixed") {
    return Math.min(state.appliedPromo.value, subtotal);
  }
  return 0;
}
  
function calculateTotal(subtotal, discount) {
  const total = subtotal - discount + DELIVERY_FEE;
  return Math.max(0, total);
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

/* 6. RENDER FUNCTIONS */
function renderCart() {
  const itemsList = document.getElementById("cart-items-list");
  const itemsCard = document.getElementById("cart-items-card");
  const emptyState = document.getElementById("empty-cart-state");

  if (state.cart.length === 0) {
    emptyState.classList.add("visible");
    itemsCard.classList.remove("visible");
    return;
  }

  emptyState.classList.remove("visible");
  itemsCard.classList.add("visible");

  itemsList.innerHTML = state.cart.map((item) => renderCartItem(item)).join("");

  itemsList.querySelectorAll(".cart-item.entering").forEach((itemEl) => {
    itemEl.addEventListener(
      "animationend",
      () => {
        itemEl.classList.remove("entering");
      },
      { once: true }
    );
  });
}

function renderCartItem(item) {
  const meta = item.color
    ? `<span>Size: ${item.size}</span><span>Color: ${item.color}</span>`
    : `<span>Category: ${item.category || "fashion"}</span>`;

  return `
    <div class="cart-item entering" data-cart-key="${item.cartKey}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='../assets/placeholder.png'" />
      <div class="cart-item-details">
        <p class="cart-item-name">${item.name}</p>
        <div class="cart-item-meta">${meta}</div>
        <div class="cart-item-bottom">
          <span class="cart-item-price">${formatCurrency(item.price)}</span>
          <div class="qty-controls">
            <button class="qty-btn qty-decrease" data-cart-key="${item.cartKey}" aria-label="Decrease" ${item.quantity <= 1 ? "disabled" : ""}>
              <i class="fa-solid fa-minus" style="font-size:11px;"></i>
            </button>
            <span class="qty-number">${item.quantity}</span>
            <button class="qty-btn qty-increase" data-cart-key="${item.cartKey}" aria-label="Increase">
              <i class="fa-solid fa-plus" style="font-size:11px;"></i>
            </button>
          </div>
        </div>
      </div>
      <button class="cart-delete-btn" data-cart-key="${item.cartKey}" aria-label="Remove item">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
    
}

function renderOrderSummary() {
  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const total = calculateTotal(subtotal, discount);

  document.getElementById("summary-subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("summary-delivery").textContent = formatCurrency(DELIVERY_FEE);
  document.getElementById("summary-total").textContent = formatCurrency(total);

  const discountEl = document.getElementById("summary-discount");
  const discountBadge = document.getElementById("discount-badge");

  discountEl.textContent = `-${formatCurrency(discount)}`;

  if (discount > 0) {
    discountEl.classList.add("is-discount");
    discountBadge.textContent = state.appliedPromo.label;
    discountBadge.style.display = "inline-block";
  } else {
    discountEl.classList.remove("is-discount");
    discountBadge.style.display = "none";
  }
}

/* 7. EVENT DELEGATION */
function setupEventDelegation() {
  const itemsList = document.getElementById("cart-items-list");

  if (!itemsList) return;

  itemsList.addEventListener("click", function(e) {
    const decreaseBtn = e.target.closest(".qty-decrease");
    const increaseBtn = e.target.closest(".qty-increase");
    const deleteBtn = e.target.closest(".cart-delete-btn");

    if (decreaseBtn) updateQuantity(decreaseBtn.dataset.cartKey, -1);
    if (increaseBtn) updateQuantity(increaseBtn.dataset.cartKey, +1);
    if (deleteBtn) animateRemove(deleteBtn.dataset.cartKey);
  });
}

  function animateRemove(cartKey) {
    const itemEl = document.querySelector(`[data-cart-key="${cartKey}"]`);

    if (itemEl) {
      itemEl.style.transition = "opacity 0.25s ease,      max-height 0.3s ease, padding 0.3s ease";
      itemEl.style.overflow = "hidden";
      itemEl.style.opacity = "0";
      itemEl.style.maxHeight = itemEl.offsetHeight + "px";

    itemEl.offsetHeight; // Force reflow

    itemEl.style.maxHeight  = "0";
    itemEl.style.padding    = "0 20px";

      setTimeout(() => removeFromCart(cartKey), 310);
    } else {
      removeFromCart(cartKey);
    }
  }


/* 8. PROMO CODE LOGIC */
/// Apply promo code
function applyPromoCode() {
  const input = document.getElementById("promo-input");
  const message = document.getElementById("promo-message");
  const code = input.value.trim().toUpperCase();

  // 🔒 Step 1: Check if a promo is already applied
  if (state.appliedPromo) {
    showPromoMessage("A promo code has already been applied. You cannot use another one.", "error");
    input.value = "";
    return;
  }

  // Reset message area
  message.className = "promo-message";
  message.textContent = "";

  if (!code) {
    showPromoMessage("Please enter a promo code.", "error");
    return;
  }

  const promo = PROMO_CODES[code];
  if (!promo) {
    showPromoMessage("Invalid promo code.", "error");
    return;
  }
  
  state.appliedPromo = promo;
  state.promoCode = code;
  savePromoToStorage(promo, code);

  // Save the success message to localStorage so it persists
  const successMessage = `✓ "${code}" applied!`;
  localStorage.setItem("promoMessage", successMessage);

  renderOrderSummary();
  showPromoMessage(successMessage, "success");

  input.disabled = true;
  input.value = "";
}

function showPromoMessage(text, type) {
  const message = document.getElementById("promo-message");
  message.textContent = text;
  message.className = `promo-message ${type}`;
}

// 🔄 Restore promo message on page load
function restorePromoMessage() {
  const savedMessage = localStorage.getItem("promoMessage");
  if (savedMessage) {
    showPromoMessage(savedMessage, "success");
    document.getElementById("promo-input").disabled = true; // keep input locked
  }
}

restorePromoMessage();


/* 9. CHECKOUT */
function goToCheckout() {
  if (state.cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  alert("Proceeding to checkout!");
}

/* 10. CART BADGE */
function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const cart = loadCartFromStorage();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems > 0) {
    badge.textContent = totalItems > 99 ? "99+" : totalItems;
    badge.classList.add("visible");
  } else {
    badge.classList.remove("visible");
  }
}

/* 11. INITIALIZE */
document.addEventListener("DOMContentLoaded", function () {
  state.cart = loadCartFromStorage();

  const savedPromo = loadPromoFromStorage();
  if (savedPromo) {
    state.appliedPromo = savedPromo.promo;
    state.promoCode    = savedPromo.code;
    const input = document.getElementById("promo-input");
    if (input) input.value = savedPromo.code;
  }

  renderCart();
  renderOrderSummary();
  setupEventDelegation();
  updateCartBadge();
  

  const applyBtn = document.getElementById("promo-apply-btn");
  if (applyBtn) applyBtn.addEventListener("click", applyPromoCode);

  const promoInput = document.getElementById("promo-input");
  if (promoInput) {
    promoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyPromoCode();
    });
  }
});

