(function SolicitacoesMinhasModule() {
  'use strict';

  var page = document.querySelector('.solicitacoes-minhas-page');
  if (!page) return;

  var overlay = null;
  var bodyEl = null;
  var actionsEl = null;
  var catalog = {};
  var listEl = page.querySelector('[data-minhas-solicitacoes-list]');
  var countEl = page.querySelector('[data-minhas-solicitacoes-count]');
  var filterEmptyEl = page.querySelector('[data-minhas-solicitacoes-filter-empty]');
  var filterChips = page.querySelectorAll('[data-minhas-solicitacao-filter]');
  var activeFilter = 'todos';

  function R() {
    return window.AppDetailModalRender;
  }

  function loadCatalog() {
    var script = document.getElementById('solicitacoes-detalhe-data');
    if (!script) return;
    try {
      catalog = JSON.parse(script.textContent || '{}');
    } catch (err) {
      catalog = {};
      console.error('[solicitacao-detail] JSON inválido:', err);
    }
  }

  function getItems() {
    if (!listEl) return [];
    return Array.prototype.slice.call(listEl.querySelectorAll('[data-solicitacao-id]'));
  }

  function updateFilterView() {
    var items = getItems();
    var visible = 0;

    items.forEach(function (item) {
      var status = item.getAttribute('data-status') || '';
      var show = activeFilter === 'todos' || status === activeFilter;
      item.classList.toggle('is-filter-hidden', !show);
      item.toggleAttribute('hidden', !show);
      if (show) visible += 1;
    });

    if (countEl) {
      countEl.textContent = visible + (visible === 1 ? ' solicitação' : ' solicitações');
    }

    if (filterEmptyEl) {
      filterEmptyEl.hidden = visible > 0;
    }
  }

  function bindFilters() {
    filterChips.forEach(function (chip) {
      chip.addEventListener('click', function (event) {
        event.preventDefault();
        filterChips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        activeFilter = chip.getAttribute('data-minhas-solicitacao-filter') || 'todos';
        updateFilterView();
      });
    });
  }

  function renderDetail(detail) {
    var render = R();
    if (!render) return;

    var badges = [
      { key: detail.statusKey, label: detail.statusLabel },
      { key: 'neutral', label: detail.criadoLabel },
    ];

    var facts = [];
    if (!detail.isPendente) {
      facts.push({ label: 'Atualizado em', value: detail.atualizadoEm });
    }

    bodyEl.innerHTML = render.renderBody({
      titleId: 'solicitacao-detail-title',
      title: detail.title,
      deNome: detail.doadorNome,
      badges: badges,
      noteLabel: detail.observacoes ? 'Sua mensagem' : null,
      noteText: detail.observacoes,
      factsLabel: 'Informações',
      facts: facts,
      items: detail.itens,
      itemsAriaLabel: 'Itens do pacote',
    });

    var actionsHtml = '';

    if (detail.isPendente) {
      actionsHtml +=
        '<form action="/solicitacoes/' + render.escapeHtml(detail.id) + '/cancelar" method="POST" class="solicitacao-detail-modal__form">' +
          '<button type="submit" class="feedback-modal__btn feedback-modal__btn--primary">Cancelar solicitação</button>' +
        '</form>';
    }

    actionsEl.innerHTML = actionsHtml;
    actionsEl.hidden = !actionsHtml;
  }

  function close() {
    if (!overlay) return;

    if (window.AppMotion) {
      window.AppMotion.closeOverlay(overlay, { bodyClass: 'feedback-modal-open' });
      return;
    }

    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('feedback-modal-open');
  }

  function open(solicitacaoId) {
    var detail = catalog[solicitacaoId];
    if (!detail || !overlay) return;

    renderDetail(detail);
    overlay.classList.remove('is-closing');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('feedback-modal-open');

    var modal = overlay.querySelector('.doacao-detail-modal');
    if (modal) {
      modal.style.animation = 'none';
      void modal.offsetWidth;
      modal.style.animation = '';
    }

    var closeBtn = overlay.querySelector('[data-solicitacao-detail-close]');
    if (closeBtn) closeBtn.focus();
  }

  function shouldIgnoreClick(target) {
    return Boolean(
      target.closest('a, button, input, select, textarea, label, form, .home-request__actions')
    );
  }

  function bindModal() {
    if (!overlay) return;

    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-solicitacao-detail-close]')) {
        event.preventDefault();
        close();
        return;
      }

      if (event.target === overlay && overlay.classList.contains('is-open')) {
        close();
        return;
      }

      if (shouldIgnoreClick(event.target)) return;

      var row = event.target.closest('[data-solicitacao-id]');
      if (!row || !page.contains(row) || row.classList.contains('is-filter-hidden')) return;

      var solicitacaoId = row.getAttribute('data-solicitacao-id');
      if (!solicitacaoId || !catalog[solicitacaoId]) return;

      event.preventDefault();
      open(solicitacaoId);
    });

    document.addEventListener('keydown', function (event) {
      if (overlay && overlay.classList.contains('is-open') && event.key === 'Escape') {
        close();
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') return;

      var row = event.target.closest('[data-solicitacao-id]');
      if (!row || !page.contains(row) || shouldIgnoreClick(event.target) || row.classList.contains('is-filter-hidden')) return;

      if (event.key === ' ') event.preventDefault();
      var solicitacaoId = row.getAttribute('data-solicitacao-id');
      if (solicitacaoId && catalog[solicitacaoId]) open(solicitacaoId);
    });
  }

  function init() {
    overlay = document.getElementById('solicitacao-detail-overlay');
    bodyEl = document.getElementById('solicitacao-detail-body');
    actionsEl = document.getElementById('solicitacao-detail-actions');

    loadCatalog();
    bindFilters();
    updateFilterView();

    if (!overlay || !bodyEl || !actionsEl || !R() || Object.keys(catalog).length === 0) return;
    bindModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
