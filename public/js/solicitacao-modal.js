/**
 * Modal de nova solicitação (receptor).
 */
(function SolicitacaoModalModule() {
  'use strict';

  var overlay = null;
  var form = null;
  var summaryEl = null;
  var errorsEl = null;
  var doacaoIdInput = null;
  var quantidadeInput = null;
  var observacoesInput = null;
  var submitBtn = null;
  var catalog = {};

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadCatalog() {
    var script = document.getElementById('doacoes-detalhe-data');
    if (!script) return;
    try {
      catalog = JSON.parse(script.textContent || '{}');
    } catch (err) {
      catalog = {};
      console.error('[solicitacao-modal] JSON inválido:', err);
    }
  }

  function getScrollWrap() {
    return document.querySelector('[data-solicitacao-modal-scroll]');
  }

  function updateScrollFades() {
    var wrap = getScrollWrap();
    if (!wrap) return;

    var body = wrap.querySelector('.doacao-modal__body');
    if (!body) return;

    var scrollable = body.scrollHeight > body.clientHeight + 1;
    wrap.classList.toggle('is-scrollable', scrollable);

    if (!scrollable) {
      wrap.classList.remove('is-scrolled', 'at-bottom');
      return;
    }

    var atTop = body.scrollTop <= 2;
    var atBottom = body.scrollHeight - body.scrollTop - body.clientHeight <= 2;

    wrap.classList.toggle('is-scrolled', !atTop);
    wrap.classList.toggle('at-bottom', atBottom);
  }

  function bindScrollFades() {
    var wrap = getScrollWrap();
    if (!wrap) return;

    var body = wrap.querySelector('.doacao-modal__body');
    if (!body || body.dataset.scrollFadeBound === 'true') return;

    body.dataset.scrollFadeBound = 'true';
    body.addEventListener('scroll', updateScrollFades, { passive: true });
    window.addEventListener('resize', updateScrollFades);
  }

  function clearErrors() {
    if (!errorsEl) return;
    errorsEl.hidden = true;
    errorsEl.innerHTML = '';
  }

  function showErrors(messages) {
    if (!errorsEl || !messages.length) return;

    errorsEl.innerHTML =
      '<p class="auth-alert__title">Corrija os campos abaixo:</p>' +
      '<ul class="auth-alert__list">' +
      messages.map(function (msg) {
        return '<li>' + escapeHtml(msg) + '</li>';
      }).join('') +
      '</ul>';
    errorsEl.hidden = false;
  }

  function renderSummary(detail) {
    if (!summaryEl) return;

    var itensHtml = (detail.itens || [])
      .map(function (item) {
        return (
          '<li class="solicitacao-modal__summary-item">' +
            '<span class="solicitacao-modal__summary-name">' + escapeHtml(item.nome) + '</span>' +
            '<span class="solicitacao-modal__summary-sub">' +
              escapeHtml(item.categoriaLabel) + ' · ' + item.quantidade + ' un · Val. ' + escapeHtml(item.validadeLabel) +
            '</span>' +
          '</li>'
        );
      })
      .join('');

    var metaHtml = detail.doadorNome
      ? '<p class="solicitacao-modal__summary-meta">Doador: ' + escapeHtml(detail.doadorNome) + '</p>'
      : '';

    summaryEl.innerHTML =
      '<p class="solicitacao-modal__summary-title">' + escapeHtml(detail.title) + '</p>' +
      metaHtml +
      '<ul class="solicitacao-modal__summary-list" aria-label="Itens do pacote">' + itensHtml + '</ul>';

    summaryEl.hidden = false;
  }

  function resetForm() {
    if (quantidadeInput) quantidadeInput.value = '1';
    if (observacoesInput) observacoesInput.value = '';
    clearErrors();
  }

  function open(doacaoId) {
    var detail = catalog[doacaoId];
    if (!detail || !overlay) return;

    if (window.DoacaoDetailModal && typeof window.DoacaoDetailModal.close === 'function') {
      window.DoacaoDetailModal.close();
    }

    resetForm();

    if (doacaoIdInput) doacaoIdInput.value = doacaoId;
    renderSummary(detail);

    overlay.hidden = false;
    overlay.classList.remove('is-closing');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('feedback-modal-open');

    var modal = overlay.querySelector('.feedback-modal');
    if (modal) {
      modal.style.animation = 'none';
      void modal.offsetWidth;
      modal.style.animation = '';
    }

    if (quantidadeInput) quantidadeInput.focus();

    bindScrollFades();
    requestAnimationFrame(updateScrollFades);
  }

  function close() {
    if (!overlay || !overlay.classList.contains('is-open')) return;

    function onClosed() {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.hidden = true;
      if (summaryEl) {
        summaryEl.hidden = true;
        summaryEl.innerHTML = '';
      }
      if (!document.querySelector('.feedback-modal-overlay.is-open')) {
        document.body.classList.remove('feedback-modal-open');
      }
    }

    if (window.AppMotion) {
      window.AppMotion.closeOverlay(overlay, {
        bodyClass: 'feedback-modal-open',
        onClosed: onClosed,
      });
      return;
    }

    overlay.classList.remove('is-open');
    onClosed();
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? 'Enviando...' : 'Enviar solicitação';
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!doacaoIdInput) return;

    clearErrors();
    setSubmitting(true);

    var payload = {
      doacaoId: doacaoIdInput.value,
      quantidade: quantidadeInput ? parseInt(quantidadeInput.value, 10) : 1,
      observacoes: observacoesInput ? observacoesInput.value.trim() : '',
    };

    fetch('/solicitacoes/nova', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          close();
          if (window.DoacaoDetailModal && typeof window.DoacaoDetailModal.close === 'function') {
            window.DoacaoDetailModal.close();
          }
          window.location.href = '/doacoes?solicitacao=ok';
          return;
        }

        var messages = (result.data && result.data.errors)
          ? result.data.errors.map(function (e) { return e.message; })
          : [(result.data && result.data.message) || 'Não foi possível enviar a solicitação.'];
        showErrors(messages);
      })
      .catch(function () {
        showErrors(['Erro de conexão. Tente novamente.']);
      })
      .finally(function () {
        setSubmitting(false);
      });
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-solicitacao-modal-close]')) {
        event.preventDefault();
        close();
        return;
      }

      if (overlay && event.target === overlay && overlay.classList.contains('is-open')) {
        close();
        return;
      }

      var trigger = event.target.closest('[data-solicitacao-open]');
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();

      var doacaoId = trigger.getAttribute('data-solicitacao-open');
      if (doacaoId) open(doacaoId);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && overlay && overlay.classList.contains('is-open')) {
        close();
      }
    });

    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  }

  function init() {
    overlay = document.querySelector('[data-solicitacao-modal]');
    form = document.getElementById('solicitacaoForm');
    summaryEl = document.querySelector('[data-solicitacao-summary]');
    errorsEl = document.querySelector('[data-solicitacao-errors]');
    doacaoIdInput = document.querySelector('[data-solicitacao-doacao-id]');
    quantidadeInput = document.querySelector('[data-solicitacao-quantidade]');
    observacoesInput = document.querySelector('[data-solicitacao-observacoes]');
    submitBtn = document.querySelector('[data-solicitacao-submit]');

    if (!overlay || !form) return;

    loadCatalog();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SolicitacaoModal = { open: open, close: close };
})();
