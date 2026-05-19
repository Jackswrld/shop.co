import { products } from "./products.js";
import { searchAllProducts } from "./api-service.js";

// Cache for all products (local + API)
let allProducts = null;

// Initialize search functionality
document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.querySelector(".search-bar");
  const searchResultsDropdown = document.getElementById("search-results-dropdown");
  const searchResultsList = document.getElementById("search-results-list");
  const searchContainer = document.querySelector(".search-container");
  const searchIconBtn = document.querySelector(".search-icon-btn");

  // Handle search input - filter and display results in lowercase
  if (searchBar) {
    searchBar.addEventListener("input", async (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();

      // Clear results if search term is empty
      if (searchTerm === "") {
        if (searchResultsDropdown) {
          searchResultsDropdown.style.display = "none";
        }
        if (searchResultsList) {
          searchResultsList.innerHTML = "";
        }
        return;
      }

      if (!searchResultsDropdown || !searchResultsList) {
        return;
      }

      // Filter products based on search term (from both local and API)
      const filteredProducts = await filterProducts(searchTerm);

      // Display filtered results
      displaySearchResults(filteredProducts, searchResultsList, searchResultsDropdown);
    });

    // Show dropdown when search bar is focused (if there's text)
    searchBar.addEventListener("focus", () => {
      if (!searchResultsDropdown || !searchResultsList) {
        return;
      }

      const searchTerm = searchBar.value.trim().toLowerCase();
      if (searchTerm !== "" && searchResultsList.innerHTML !== "") {
        searchResultsDropdown.style.display = "block";
      }
    });
  }

  // Close dropdown when clicking outside search container
  document.addEventListener("click", (e) => {
    if (
      searchContainer &&
      !searchContainer.contains(e.target) &&
      searchResultsDropdown &&
      !e.target.closest(".search-icon-btn")
    ) {
      searchResultsDropdown.style.display = "none";
    }
  });

  // Close dropdown with Escape key
  if (searchBar) {
    searchBar.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && searchResultsDropdown) {
        searchResultsDropdown.style.display = "none";
      }
    });
  }

  // Handle search icon click to show/focus search on mobile
  if (searchIconBtn) {
    searchIconBtn.addEventListener("click", () => {
      if (searchBar) {
        searchBar.focus();
      }
    });
  }
});

/**
 * Filter products based on search term in lowercase
 * Searches both local and API products
 * @param {string} searchTerm - The lowercase search term
 * @returns {Promise<array>} - Filtered products array
 */
async function filterProducts(searchTerm) {
  // Use API service to search both local and API products
  const filteredProducts = await searchAllProducts(searchTerm, products);
  
  // Sort results: local products first, then API products
  const localResults = filteredProducts.filter(p => !p.source || p.source === 'local');
  const apiResults = filteredProducts.filter(p => p.source === 'api');
  
  return [...localResults, ...apiResults];
}

/**
 * Display filtered search results in the dropdown
 * @param {array} filteredProducts - Array of filtered products
 * @param {HTMLElement} resultsList - The results list container
 * @param {HTMLElement} dropdown - The dropdown container
 */
function displaySearchResults(filteredProducts, resultsList, dropdown) {
  if (!resultsList || !dropdown) {
    return;
  }

  // Clear previous results
  resultsList.innerHTML = "";

  if (filteredProducts.length === 0) {
    resultsList.innerHTML =
      '<li class="search-result-item no-results">No products found</li>';
    dropdown.style.display = "block";
    return;
  }

  // Display found products (limit to 5 results for better UX)
  const displayLimit = Math.min(filteredProducts.length, 5);
  for (let i = 0; i < displayLimit; i++) {
    const product = filteredProducts[i];
    const resultItem = createSearchResultItem(product);
    resultsList.appendChild(resultItem);
  }

  // Show "See all results" if there are more than 5 results
  if (filteredProducts.length > 5) {
    const seeAllItem = document.createElement("li");
    seeAllItem.className = "search-result-item see-all";
    seeAllItem.textContent = `See all ${filteredProducts.length} results`;
    resultsList.appendChild(seeAllItem);
  }

  dropdown.style.display = "block";
}

/**
 * Create a search result item element
 * @param {object} product - The product object
 * @returns {HTMLElement} - The result item element
 */
function createSearchResultItem(product) {
  const li = document.createElement("li");
  li.className = "search-result-item";

  // Get product image
  const productImage = product.images && product.images[0] ? product.images[0] : "assets/images/placeholder.png";

  // Create result HTML
  li.innerHTML = `
    <div class="search-result-content">
      <img src="${productImage}" alt="${product.name}" class="search-result-image" />
      <div class="search-result-info">
        <div class="search-result-name">${product.name}</div>
        <div class="search-result-category">${product.category}</div>
        <div class="search-result-price">$${product.price}</div>
      </div>
    </div>
  `;

  // Add click event to navigate to product or take action
  li.addEventListener("click", () => {
    handleProductClick(product);
  });

  return li;
}

/**
 * Handle product click action
 * @param {object} product - The clicked product
 */
function handleProductClick(product) {
  // You can modify this to navigate to product detail page or add to cart
  console.log("Product clicked:", product);
  
  // Example: Navigate to product details page (update path as needed)
  // window.location.href = `pages/product-details.html?id=${product.id}`;
  
  // Or emit a custom event for other parts of the app to handle
  const event = new CustomEvent("productSelected", { detail: product });
  document.dispatchEvent(event);

  // Clear search bar and close dropdown
  const searchBar = document.querySelector(".search-bar");
  const dropdown = document.getElementById("search-results-dropdown");
  if (searchBar) searchBar.value = "";
  if (dropdown) dropdown.style.display = "none";
}
