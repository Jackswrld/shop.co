

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