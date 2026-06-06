(function () {
  'use strict';

  var searchInput = document.querySelector('[data-receptor-search]');
  var grid = document.querySelector('[data-receptor-grid]');
  if (!searchInput || !grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-receptor-card]'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-receptor-filter]'));
  var countEl = document.querySelector('[data-receptor-count]');
  var emptyEl = document.querySelector('[data-receptor-empty]');
  var activeCategory = 'todos';

  function updateView() {
    var query = searchInput.value.trim().toLowerCase();
    var visible = 0;

    cards.forEach(function (card) {
      var category = card.getAttribute('data-category') || '';
      var searchBlob = card.getAttribute('data-search') || '';
      var matchesCategory = activeCategory === 'todos' || category === activeCategory;
      var matchesSearch = !query || searchBlob.indexOf(query) !== -1;
      var show = matchesCategory && matchesSearch;

      card.hidden = !show;
      if (show) visible += 1;
    });

    if (countEl) {
      countEl.textContent = visible + (visible === 1 ? ' doação disponível' : ' doações disponíveis');
    }

    if (emptyEl) {
      emptyEl.hidden = visible > 0;
    }
  }

  searchInput.addEventListener('input', updateView);

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      activeCategory = chip.getAttribute('data-receptor-filter') || 'todos';
      updateView();
    });
  });
})();
