/* ============================================
   THEME TOGGLE — theme.js
   Handles light / dark mode toggle.
   Include this script in every page.
   ============================================ */

(function () {
  const STORAGE_KEY = "shopco-theme";
  const html = document.documentElement;

  /* ── Apply saved or system preference on load ── */
  function applyTheme(theme) {
    if (theme === "dark") {
      html.setAttribute("data-theme", "dark");
    } else {
      html.removeAttribute("data-theme");
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    applyTheme(saved);
  } else {
    /* Default: light mode */
    applyTheme("light");
  }

  /* ── Wire up toggle button after DOM is ready ── */
  document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      const isDark = html.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  });
})();