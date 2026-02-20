// Navbar Toggle Functionality
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("nav");
  const searchIconBtn = document.querySelector(".search-icon-btn");
  const searchContainer = document.querySelector(".search-container");
  const searchBar = document.querySelector(".search-bar");

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
});
