/* Gallery pagination - muestra 6 items por página */
(function initGalleryPager() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const pager = document.getElementById('galleryPager');
  if (!pager) return;

  const items = Array.from(grid.querySelectorAll('.gallery-item'));
  const perPage = parseInt(grid.dataset.perPage || '6', 10);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPageSpan = document.getElementById('galleryCurrentPage');
  const totalPagesSpan = document.getElementById('galleryTotalPages');
  const btnPrev = pager.querySelector('[data-action="prev"]');
  const btnNext = pager.querySelector('[data-action="next"]');

  if (totalPagesSpan) totalPagesSpan.textContent = String(totalPages);

  function showPage(page) {
    page = Math.max(1, Math.min(totalPages, page));
    items.forEach((item, i) => {
      const start = (page - 1) * perPage;
      const end = start + perPage;
      item.classList.toggle('hidden', i < start || i >= end);
    });
    if (currentPageSpan) currentPageSpan.textContent = String(page);
    grid.dataset.page = String(page);
    if (btnPrev) btnPrev.disabled = page === 1;
    if (btnNext) btnNext.disabled = page === totalPages;
  }

  if (btnPrev) btnPrev.addEventListener('click', () => showPage(parseInt(grid.dataset.page, 10) - 1));
  if (btnNext) btnNext.addEventListener('click', () => showPage(parseInt(grid.dataset.page, 10) + 1));

  showPage(1);
})();
