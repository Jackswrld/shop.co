// Navbar Toggle Functionality
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("body > nav");
  const navMenu = nav?.querySelector(".nav-menu");
  const navDropdowns = nav ? [...nav.querySelectorAll(".dropdown")] : [];
  const searchIconBtn = document.querySelector(".search-icon-btn");
  const searchContainer = document.querySelector(".search-container");
  const searchBar = document.querySelector(".search-bar");
  const cartBadge = document.getElementById("cart-badge");
  const topInfo = document.querySelector(".top-info");
  const mobileNavMedia = window.matchMedia("(max-width: 900px)");
  let navOverlay = null;

  function syncNavToggleIcon(isOpen) {
    if (!navToggle) return;

    navToggle.setAttribute("aria-expanded", String(isOpen));

    const toggleIcon = navToggle.querySelector("i");
    if (!toggleIcon) return;

    toggleIcon.classList.toggle("fa-bars", !isOpen);
    toggleIcon.classList.toggle("fa-xmark", isOpen);
  }

  function ensureNavOverlay() {
    if (!nav || navOverlay) return navOverlay;

    navOverlay = document.createElement("div");
    navOverlay.className = "nav-overlay";
    navOverlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(navOverlay);

    navOverlay.addEventListener("click", () => {
      closeNav();
    });

    return navOverlay;
  }

  function closeSearch() {
    if (!searchContainer) return;
    searchContainer.classList.remove("search-open");
  }

  function closeDropdowns(exception = null) {
    navDropdowns.forEach((dropdown) => {
      const shouldStayOpen = dropdown === exception;
      dropdown.classList.toggle("is-open", shouldStayOpen);

      const toggleBtn = dropdown.querySelector(".dropdown-toggle-btn");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", String(shouldStayOpen));
      }
    });
  }

  function openNav() {
    if (!nav || !navMenu || !mobileNavMedia.matches) return;

    closeSearch();
    nav.classList.add("nav-open");
    ensureNavOverlay()?.classList.add("is-visible");
    syncNavToggleIcon(true);
  }

  function closeNav() {
    if (!nav) return;

    nav.classList.remove("nav-open");
    navOverlay?.classList.remove("is-visible");
    closeDropdowns();
    syncNavToggleIcon(false);
  }

  function toggleNav() {
    if (!nav) return;

    if (nav.classList.contains("nav-open")) {
      closeNav();
      return;
    }

    openNav();
  }

  // Navbar menu toggle
  if (navToggle && nav) {
    ensureNavOverlay();
    syncNavToggleIcon(nav.classList.contains("nav-open"));

    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleNav();
    });

    // Close menu when clicking on a nav link
    const navLinks = nav.querySelectorAll(".nav-menu a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (mobileNavMedia.matches) {
          closeNav();
        } else {
          closeDropdowns();
        }
      });
    });

    const dropdownToggleButtons = nav.querySelectorAll(".dropdown-toggle-btn");
    dropdownToggleButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const dropdown = button.closest(".dropdown");
        if (!dropdown) return;

        const shouldOpen = !dropdown.classList.contains("is-open");
        closeDropdowns(shouldOpen ? dropdown : null);
      });
    });
  }

  // Search icon toggle functionality for mobile
  if (searchIconBtn && searchContainer) {
    searchIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeNav();
      searchContainer.classList.toggle("search-open");
      
      // Focus the search input when opened
      if (searchContainer.classList.contains("search-open") && searchBar) {
        searchBar.focus();
      }
    });
  }

  // Close search dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (
      searchContainer &&
      searchBar &&
      !searchContainer.contains(e.target) &&
      !searchIconBtn?.contains(e.target)
    ) {
      closeSearch();
    }

    if (
      nav &&
      mobileNavMedia.matches &&
      nav.classList.contains("nav-open") &&
      !nav.contains(e.target)
    ) {
      closeNav();
    }

    if (!e.target.closest("body > nav .nav-menu .dropdown")) {
      closeDropdowns();
    }
  });

  // Close search dropdown when pressing Escape
  if (searchBar) {
    searchBar.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeSearch();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    closeSearch();
    closeNav();
    closeDropdowns();
  });

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
window.addEventListener("resize", () => {
  if (!mobileNavMedia.matches) {
    closeNav();
    closeSearch();
  }

  closeDropdowns();

  updateNavState();
});

// On scroll, update only fixed state (like your original)
window.addEventListener("scroll", () => {
  if (!nav) return;
  const topInfoHeight = topInfo?.offsetHeight || 0;
  const shouldFix = window.scrollY > topInfoHeight;

  nav.classList.toggle("nav-fixed", shouldFix);
  document.body.classList.toggle("nav-fixed", shouldFix);
}, { passive: true });

});
