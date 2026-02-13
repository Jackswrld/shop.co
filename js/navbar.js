// Navbar Toggle Functionality
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("nav");

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
});
