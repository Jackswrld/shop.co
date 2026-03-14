// Navbar Toggle Functionality
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("nav");
  const searchIconBtn = document.querySelector(".search-icon-btn");
  const searchContainer = document.querySelector(".search-container");
  const searchBar = document.querySelector(".search-bar");
  const cartBadge = document.getElementById("cart-badge");
  const topInfo = document.querySelector(".top-info");

  // Navbar menu toggle
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("nav-open");
      // Update aria-expanded attribute for accessibility
      const isExpanded = nav.classList.contains("nav-open");
      navToggle.setAttribute("aria-expanded", isExpanded);
    });

    // Close menu when clicking on a nav link
    const navLinks = document.querySelectorAll(".nav-menu a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Search icon toggle functionality for mobile
  if (searchIconBtn) {
    searchIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      searchContainer.classList.toggle("search-open");
      
      // Focus the search input when opened
      if (searchContainer.classList.contains("search-open") && searchBar) {
        searchBar.focus();
      }
    });
  }

  // Close search dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (searchContainer && searchBar && !searchContainer.contains(e.target)) {
      searchContainer.classList.remove("search-open");
    }
  });

  // Close search dropdown when pressing Escape
  if (searchBar) {
    searchBar.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchContainer.classList.remove("search-open");
      }
    });
  }

  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem("shopco_cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function updateCartBadge() {
    if (!cartBadge) return;

    const cart = loadCartFromStorage();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

    if (totalItems > 0) {
      cartBadge.textContent = totalItems > 99 ? "99+" : String(totalItems);
      cartBadge.classList.add("visible");
    } else {
      cartBadge.textContent = "";
      cartBadge.classList.remove("visible");
    }
  }

  updateCartBadge();

 const updateNavState = () => {
  if (!nav) return;

  // Always update nav height
  document.documentElement.style.setProperty("--nav-height", `${nav.offsetHeight}px`);

  // Decide if nav should be fixed
  const topInfoHeight = topInfo?.offsetHeight || 0;
  const shouldFix = window.scrollY > topInfoHeight;

  nav.classList.toggle("nav-fixed", shouldFix);
  document.body.classList.toggle("nav-fixed", shouldFix);
};

// Run once on load
updateNavState();

// On resize, update everything
window.addEventListener("resize", updateNavState);

// On scroll, update only fixed state (like your original)
window.addEventListener("scroll", () => {
  if (!nav) return;
  const topInfoHeight = topInfo?.offsetHeight || 0;
  const shouldFix = window.scrollY > topInfoHeight;

  nav.classList.toggle("nav-fixed", shouldFix);
  document.body.classList.toggle("nav-fixed", shouldFix);
}, { passive: true });

});
