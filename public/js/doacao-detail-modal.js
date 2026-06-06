/**
 * Modal de detalhes da doação (receptor e doador).
 */
(function DoacaoDetailModalModule() {
  'use strict';

  var overlay = null;
  var bodyEl = null;
  var actionsEl = null;
  var catalog = {};

  function statusPillClass(status) {
    if (status === 'disponivel') return 'ativo';
    if (status === 'reservado') return 'reservado';
    if (status === 'entregue') return 'entregue';
    return 'disponivel';
  }

  function loadCatalog() {
    var script = document.getElementById('doacoes-detalhe-data');
    if (!script) return;
    try {
      catalog = JSON.parse(script.textContent || '{}');
    } catch (err) {
      catalog = {};
      console.error('[doacao-detail] JSON inválido:', err);
    }
  }

  function renderDetail(detail) {
    var render = window.AppDetailModalRender;
    if (!render) return;

    var isReceptorView = Boolean(detail.canSolicitar);
    var badges = [{ key: statusPillClass(detail.status), label: detail.statusLabel }];
    if (isReceptorView && detail.publicadoLabel) {
      badges.push({ key: 'neutral', label: detail.publicadoLabel });
    }

    bodyEl.innerHTML = render.renderBody({
      titleId: 'doacao-detail-title',
      title: detail.title,
      deNome: isReceptorView ? detail.doadorNome : null,
      subtitle: !isReceptorView && detail.publicadoLabel
        ? 'Publicado ' + detail.publicadoLabel
        : null,
      badges: badges,
      noteLabel: detail.observacoes ? 'Observação' : null,
      noteText: detail.observacoes,
      items: detail.itens,
      itemsAriaLabel: 'Itens da doação',
    });

    var actionsHtml = '';

    if (detail.canSolicitar) {
      actionsHtml +=
        '<button type="button" class="feedback-modal__btn feedback-modal__btn--primary" data-solicitacao-open="' + render.escapeHtml(detail.id) + '">Solicitar</button>';
    } else if (detail.editarUrl) {
      actionsHtml +=
        '<a href="' + render.escapeHtml(detail.editarUrl) + '" class="feedback-modal__btn feedback-modal__btn--primary feedback-modal__btn--link">Editar doação</a>';
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

  function open(doacaoId) {
    var detail = catalog[doacaoId];
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

    var closeBtn = overlay.querySelector('[data-doacao-detail-close]');
    if (closeBtn) closeBtn.focus();
  }

  function shouldIgnoreClick(target) {
    return Boolean(
      target.closest('a, button, input, select, textarea, label, form, .home-table__edit, .receptor-food-card .app-btn-primary, [data-solicitacao-open]')
    );
  }

  function bindTriggers() {
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-doacao-detail-close]')) {
        event.preventDefault();
        close();
        return;
      }

      if (event.target === overlay && overlay.classList.contains('is-open')) {
        close();
        return;
      }

      if (shouldIgnoreClick(event.target)) return;

      var card = event.target.closest('[data-doacao-id]');
      if (!card) return;

      var doacaoId = card.getAttribute('data-doacao-id');
      if (!doacaoId || !catalog[doacaoId]) return;

      event.preventDefault();
      open(doacaoId);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();

      if (event.key === 'Enter' || event.key === ' ') {
        var card = event.target.closest('[data-doacao-id]');
        if (!card || shouldIgnoreClick(event.target)) return;
        if (event.key === ' ') event.preventDefault();
        var doacaoId = card.getAttribute('data-doacao-id');
        if (doacaoId && catalog[doacaoId]) open(doacaoId);
      }
    });
  }

  function init() {
    overlay = document.getElementById('doacao-detail-overlay');
    bodyEl = document.getElementById('doacao-detail-body');
    actionsEl = document.getElementById('doacao-detail-actions');
    if (!overlay || !bodyEl || !actionsEl || !window.AppDetailModalRender) return;

    loadCatalog();
    if (Object.keys(catalog).length === 0) return;

    bindTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DoacaoDetailModal = { open: open, close: close };
})();
