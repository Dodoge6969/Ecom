document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(track.children);
  const gap = 300; // horizontal space between slides
  let index = 0;

  function updateCarousel() {
    slides.forEach((s, i) => {
      const pos = (i - index + slides.length) % slides.length;
      s.classList.remove("active"); // remove active class first

      if (pos === 0) {
        // current (center)
        s.style.transform = "translateX(0px) scale(1.3)";
        s.style.opacity = "1";
        s.style.zIndex = "2";
        s.classList.add("active"); // show text
      } else if (pos === 1) {
        // next (right)
        s.style.transform = `translateX(${gap}px) scale(0.9)`;
        s.style.opacity = "0.7";
        s.style.zIndex = "1";
      } else if (pos === slides.length - 1) {
        // previous (left)
        s.style.transform = `translateX(-${gap}px) scale(0.9)`;
        s.style.opacity = "0.7";
        s.style.zIndex = "1";
      } else {
        // hide others
      }
    });
  }

  function nextSlide() {
    index = (index + 1) % slides.length;
    updateCarousel();
  }

  updateCarousel();
  setInterval(nextSlide, 5000);

  // ====== Navbar scroll / hide on down / show on up (improved) ======
  const navbar = document.querySelector('.Navbar');
  const menuToggle = document.getElementById('menu__toggle');
  const main = document.querySelector('.main');
  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
  let ticking = false;

  function getMainHalfThreshold() {
    if (!main) return 0;
    const rect = main.getBoundingClientRect();
    return window.pageYOffset + rect.top + rect.height * 0.5;
  }

  function handleScroll() {
    const currentY = window.pageYOffset || document.documentElement.scrollTop;
    const menuOpen = menuToggle && menuToggle.checked;
    const threshold = getMainHalfThreshold();
    const delta = currentY - lastScrollY;

    // small deadzone to avoid flicker
    if (Math.abs(delta) < 5) {
      ticking = false;
      return;
    }

    // apply scrolled class for small scrolls
    if (currentY > 60) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    if (menuOpen) {
      // keep visible while menu is open
      navbar.classList.remove('hidden');
    } else {
      if (delta > 0 && currentY >= threshold) {
        // scrolling down past threshold -> hide
        navbar.classList.add('hidden');
      } else if (delta < 0) {
        // scrolling up -> show
        navbar.classList.remove('hidden');
      }
    }

    lastScrollY = Math.max(0, currentY);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }

  // init and listeners
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (menuToggle) {
    // sync menu-open class and force visible when opened
    menuToggle.addEventListener('change', () => {
      navbar.classList.toggle('menu-open', menuToggle.checked);
      if (menuToggle.checked) navbar.classList.remove('hidden');
    });
  }
});

