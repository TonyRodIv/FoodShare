(function SolicitacaoDetailModule() {
  'use strict';

  var catalog = {};

  function render() {
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

  function createListController(options) {
    var activeFilter = 'todos';
    var listEl = document.querySelector(options.listSelector);
    var countEl = options.countSelector ? document.querySelector(options.countSelector) : null;
    var filterEmptyEl = options.filterEmptySelector
      ? document.querySelector(options.filterEmptySelector)
      : null;
    var filterChips = document.querySelectorAll(options.filterChipSelector);

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
        countEl.textContent = visible + (visible === 1 ? options.countOne : options.countMany);
      }

      if (filterEmptyEl) {
        filterEmptyEl.hidden = visible > 0;
      }
    }

    function bindFilters() {
      if (!filterChips.length) return;

      filterChips.forEach(function (chip) {
        chip.addEventListener('click', function (event) {
          event.preventDefault();
          filterChips.forEach(function (c) { c.classList.remove('is-active'); });
          chip.classList.add('is-active');
          activeFilter = chip.getAttribute(options.filterChipAttr) || 'todos';
          updateFilterView();
        });
      });
    }

    return {
      getItems: getItems,
      updateFilterView: updateFilterView,
      bindFilters: bindFilters,
    };
  }

  function createModalController(options) {
    var overlay = document.getElementById('solicitacao-detail-overlay');
    var bodyEl = document.getElementById('solicitacao-detail-body');
    var actionsEl = document.getElementById('solicitacao-detail-actions');

    function renderDetail(detail) {
      var R = render();
      if (!R) return;

      bodyEl.innerHTML = R.renderBody(options.buildBody(detail, R));

      var actionsHtml = options.buildActions(detail, R.escapeHtml);
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

    function isRowInScope(row) {
      if (!options.pageRoot) return true;
      return options.pageRoot.contains(row);
    }

    function bindModal(listController) {
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

        if (event.target.closest(options.ignoreClickSelector)) return;

        var row = event.target.closest('[data-solicitacao-id]');
        if (!row || !isRowInScope(row) || row.classList.contains('is-filter-hidden')) return;

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
        if (!row || !isRowInScope(row) || event.target.closest(options.ignoreClickSelector)) return;
        if (row.classList.contains('is-filter-hidden')) return;

        if (event.key === ' ') event.preventDefault();
        var solicitacaoId = row.getAttribute('data-solicitacao-id');
        if (solicitacaoId && catalog[solicitacaoId]) open(solicitacaoId);
      });
    }

    return { bindModal: bindModal };
  }

  var MODES = {
    minhas: {
      pageRoot: document.querySelector('.solicitacoes-minhas-page'),
      listSelector: '[data-minhas-solicitacoes-list]',
      countSelector: '[data-minhas-solicitacoes-count]',
      filterEmptySelector: '[data-minhas-solicitacoes-filter-empty]',
      filterChipSelector: '[data-minhas-solicitacao-filter]',
      filterChipAttr: 'data-minhas-solicitacao-filter',
      countOne: ' solicitação',
      countMany: ' solicitações',
      ignoreClickSelector: 'a, button, input, select, textarea, label, form, .home-request__actions',
      buildBody: function (detail) {
        var badges = [
          { key: detail.statusKey, label: detail.statusLabel },
          { key: 'neutral', label: detail.criadoLabel },
        ];
        var facts = [];
        if (!detail.isPendente) {
          facts.push({ label: 'Atualizado em', value: detail.atualizadoEm });
        }
        return {
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
        };
      },
      buildActions: function (detail, escapeHtml) {
        if (!detail.isPendente) return '';
        return (
          '<form action="/solicitacoes/' + escapeHtml(detail.id) + '/cancelar" method="POST" class="solicitacao-detail-modal__form">' +
            '<button type="submit" class="feedback-modal__btn feedback-modal__btn--primary">Cancelar solicitação</button>' +
          '</form>'
        );
      },
    },
    recebidas: {
      pageRoot: null,
      listSelector: '[data-solicitacoes-list]',
      countSelector: '[data-solicitacoes-count]',
      filterEmptySelector: '[data-solicitacoes-filter-empty]',
      filterChipSelector: '[data-solicitacao-filter]',
      filterChipAttr: 'data-solicitacao-filter',
      countOne: ' pedido',
      countMany: ' pedidos',
      ignoreClickSelector: 'a, button, input, select, textarea, label, form, .home-table__edit, .home-table__action',
      buildBody: function (detail) {
        var badges = [
          { key: detail.statusKey, label: detail.statusLabel },
          { key: 'neutral', label: detail.criadoLabel },
        ];
        var facts = [{ label: 'Pedido em', value: detail.criadoEm }];
        if (!detail.isPendente) {
          facts.push({ label: 'Atualizado em', value: detail.atualizadoEm });
        }
        if (detail.receptorEmail) {
          facts.push({ label: 'E-mail', value: detail.receptorEmail });
        }
        return {
          titleId: 'solicitacao-detail-title',
          title: detail.title,
          deNome: detail.receptorNome,
          badges: badges,
          noteLabel: detail.observacoes ? 'Mensagem do solicitante' : null,
          noteText: detail.observacoes,
          factsLabel: 'Informações',
          facts: facts,
          items: detail.itens,
          itemsAriaLabel: 'Itens do pacote',
        };
      },
      buildActions: function (detail, escapeHtml) {
        if (!detail.isPendente) return '';
        return (
          '<form action="/solicitacoes/' + escapeHtml(detail.id) + '/recusar" method="POST" class="solicitacao-detail-modal__form">' +
            '<button type="submit" class="feedback-modal__btn feedback-modal__btn--secondary">Recusar</button>' +
          '</form>' +
          '<form action="/solicitacoes/' + escapeHtml(detail.id) + '/aceitar" method="POST" class="solicitacao-detail-modal__form">' +
            '<button type="submit" class="feedback-modal__btn feedback-modal__btn--primary">Aceitar</button>' +
          '</form>'
        );
      },
    },
  };

  function initMode(modeKey) {
    var options = MODES[modeKey];
    if (!options || !document.querySelector(options.listSelector)) return;

    var listController = createListController(options);
    listController.bindFilters();
    listController.updateFilterView();

    if (!render() || Object.keys(catalog).length === 0) return;

    var modalController = createModalController(options);
    modalController.bindModal(listController);
  }

  function init() {
    loadCatalog();
    if (document.querySelector('.solicitacoes-minhas-page')) initMode('minhas');
    if (document.querySelector('[data-solicitacoes-list]')) initMode('recebidas');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
