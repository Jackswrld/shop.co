import { reviews } from './review.js';

function initHeroThemeImage() {
  const heroImage = document.querySelector(".hero-image[data-light-src][data-dark-src]");

  if (!heroImage) return;

  const sources = {
    light: heroImage.dataset.lightSrc,
    dark: heroImage.dataset.darkSrc,
  };
  const TRANSITION_DURATION_MS = 220;
  let switchTimer = null;
  let switchId = 0;

  function getActiveTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function preloadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve();
        return;
      }

      const image = new Image();
      const finish = () => resolve();

      image.onload = finish;
      image.onerror = finish;
      image.src = src;

      if (image.complete) {
        resolve();
      }
    });
  }

  function setHeroSource(theme) {
    const targetSrc = sources[theme] || sources.light;

    if (!targetSrc) return;

    if (heroImage.getAttribute("src") !== targetSrc) {
      heroImage.setAttribute("src", targetSrc);
    }
  }

  function swapHeroSource(theme) {
    const targetSrc = sources[theme] || sources.light;

    if (!targetSrc || heroImage.getAttribute("src") === targetSrc) {
      return;
    }

    const currentSwitchId = ++switchId;

    preloadImage(targetSrc).then(() => {
      if (currentSwitchId !== switchId) return;

      window.clearTimeout(switchTimer);
      heroImage.classList.add("hero-image--theme-switching");

      switchTimer = window.setTimeout(() => {
        if (currentSwitchId !== switchId) return;

        heroImage.setAttribute("src", targetSrc);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (currentSwitchId === switchId) {
              heroImage.classList.remove("hero-image--theme-switching");
            }
          });
        });
      }, TRANSITION_DURATION_MS);
    });
  }

  Object.values(sources).filter(Boolean).forEach((src) => {
    preloadImage(src);
  });

  setHeroSource(getActiveTheme());

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
        swapHeroSource(getActiveTheme());
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}

initHeroThemeImage();

  //Function For Stats Countdowm
  document.addEventListener("DOMContentLoaded", () => {
    const statsNumbers = document.querySelectorAll(".stats-number");

    const duration = 1800;     
    const easing = "easeOutQuad"; 

    const easeOutQuad = t => t * (2 - t);

    statsNumbers.forEach((el) => {
      const finalValue = parseInt(el.textContent.replace(/[^0-9]/g, ""), 10); 
      let startValue = 0;
      const suffix = el.textContent.includes("+") ? "+" : ""; 

      // IntersectionObserver – starts animation only when visible
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animateCount(el, startValue, finalValue, duration, suffix);
            observer.disconnect(); 
          }
        },
        { threshold: 0.5 } // start when 50% visible
      );

      observer.observe(el);
    });

    function animateCount(element, start, end, durationMs, suffix = "") {
      const startTime = performance.now();

      function update(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / durationMs, 1); // 0 to 1
        const eased = easeOutQuad(progress);

        const current = Math.floor(start + (end - start) * eased);
        element.textContent = current.toLocaleString() + suffix; // adds commas: 30,000+

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = end.toLocaleString() + suffix; // exact final value
        }
      }

      requestAnimationFrame(update);
    }
  });
  function initHappyCustomers(allReviews) {

    const track   = document.getElementById('hc-track');
    const prevBtn = document.getElementById('hc-prev');
    const nextBtn = document.getElementById('hc-next');
    const fadeL   = document.querySelector('.hc-fade-left');
    const fadeR   = document.querySelector('.hc-fade-right');

    if (!track) return;

    /* ── 2. Render stars (matches your existing renderStars fn) ── */
    function renderStars(rating) {
      let html = '';
      for (let i = 1; i <= 5; i++) {
        html += i <= rating
          ? '<i class="fa-solid fa-star"></i>'
          : '<i class="fa-regular fa-star"></i>';
      }
      return html;
    }

    /* ── 3. Build & inject cards ── */
   function renderReviewCards() {
    
    if (!allReviews || allReviews.length === 0) {
      // No reviews message
      track.innerHTML = `
        <p style="padding:2rem;color:#999;">No reviews yet.</p>
      `;
      return;

    } 
      // Display review cards
      track.innerHTML = allReviews
        .map(
          (review) => `
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
        )
        .join("");
      }

    renderReviewCards();

    /* ── 4. Scroll amount per arrow click ── */
    const SCROLL_STEP = 340; // ~card width + gap

    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
    });

    /* ── 5. Update fade overlays based on scroll position ── */
    function updateFades() {
      const { scrollLeft, scrollWidth, clientWidth } = track;
      const atStart = scrollLeft <= 10;
      const atEnd   = scrollLeft + clientWidth >= scrollWidth - 10;

      fadeL.classList.toggle('hidden', atStart);
      fadeR.classList.toggle('hidden', atEnd);
    }

    track.addEventListener('scroll', updateFades);
    updateFades(); // run once on load

    /* ── 6. Click-drag to scroll (desktop) ── */
    let isDown = false;
    let startX, scrollStart;

    track.addEventListener('mousedown', e => {
      isDown      = true;
      startX      = e.pageX - track.offsetLeft;
      scrollStart = track.scrollLeft;
      track.style.scrollBehavior = 'auto'; // instant while dragging
    });

    document.addEventListener('mouseup', () => {
      isDown = false;
      track.style.scrollBehavior = 'smooth';
    });

    track.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x    = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.2; // 1.2 = drag speed multiplier
      track.scrollLeft = scrollStart - walk;
    });
  }

  /* ── Expose so you can call it from your module ── */
  window.initHappyCustomers = initHappyCustomers;

  /* ── Auto-init if reviews is already global ── */
  if (typeof reviews !== 'undefined') {
    initHappyCustomers(reviews);
  }

initHappyCustomers(reviews);
