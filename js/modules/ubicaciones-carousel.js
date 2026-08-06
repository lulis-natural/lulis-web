/* Carrusel de ubicaciones con flechas, dots y swipe */
(function initUbicacionesCarousel() {
  const carousel = document.getElementById('ubicacionesCarousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.ubi-slide'));
  const dots = Array.from(carousel.querySelectorAll('.ubi-dot'));
  const prev = carousel.querySelector('.ubi-arrow--prev');
  const next = carousel.querySelector('.ubi-arrow--next');
  if (slides.length === 0) return;

  let index = 0;
  let timer = null;

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle('is-active', j === index));
    dots.forEach((d, j) => d.classList.toggle('is-active', j === index));
    carousel.dataset.index = String(index);
  }

  function start() {
    stop();
    timer = setInterval(() => goTo(index + 1), 9000);
  }
  function stop() {
    if (timer) clearInterval(timer);
  }

  if (prev) prev.addEventListener('click', () => { goTo(index - 1); start(); });
  if (next) next.addEventListener('click', () => { goTo(index + 1); start(); });
  dots.forEach((d, j) => d.addEventListener('click', () => { goTo(j); start(); }));

  // Pausar en hover
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);

  // Swipe en mobile
  let touchStartX = 0;
  carousel.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    stop();
  }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const delta = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goTo(index + 1);
      else goTo(index - 1);
    }
    start();
  }, { passive: true });

  // Iniciar autoplay cuando la seccion es visible
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.3) start();
      else stop();
    }, { threshold: [0, 0.3, 0.7] });
    obs.observe(carousel);
  } else {
    start();
  }
})();
