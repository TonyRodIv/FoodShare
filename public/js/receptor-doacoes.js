(function ReceptorDoacoesModule() {
  'use strict';

  var dashboard = document.querySelector('.receptor-dashboard');
  if (!dashboard) return;

  var searchInput = dashboard.querySelector('[data-receptor-search]');
  var grid = dashboard.querySelector('[data-receptor-grid]');
  var chips = Array.prototype.slice.call(dashboard.querySelectorAll('[data-receptor-filter]'));
  var countEl = dashboard.querySelector('[data-receptor-count]');
  var emptyEl = dashboard.querySelector('[data-receptor-empty]');
  var activeCategory = 'todos';

  function normKey(value) {
    return String(value || '').toLowerCase().normalize('NFC').trim();
  }

  function getCards() {
    if (!grid) return [];
    return Array.prototype.slice.call(grid.querySelectorAll('[data-receptor-card]'));
  }

  function updateView() {
    var cards = getCards();
    if (!searchInput || cards.length === 0) return;

    var query = normKey(searchInput.value);
    var categoryFilter = normKey(activeCategory);
    var visible = 0;

    cards.forEach(function (card) {
      var category = normKey(card.getAttribute('data-category'));
      var searchBlob = normKey(card.getAttribute('data-search'));
      var matchesCategory = categoryFilter === 'todos' || category === categoryFilter;
      var matchesSearch = !query || searchBlob.indexOf(query) !== -1;
      var show = matchesCategory && matchesSearch;

      card.classList.toggle('is-filter-hidden', !show);
      card.toggleAttribute('hidden', !show);
      if (show) visible += 1;
    });

    if (countEl) {
      countEl.textContent = visible + (visible === 1 ? ' doação disponível' : ' doações disponíveis');
    }

    if (emptyEl) {
      emptyEl.hidden = visible > 0;
    }
  }

  function bindFilters() {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function (event) {
        event.preventDefault();
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        activeCategory = chip.getAttribute('data-receptor-filter') || 'todos';
        updateView();
      });
    });
  }

  function init() {
    if (!searchInput || !grid) return;

    searchInput.addEventListener('input', updateView);
    bindFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
