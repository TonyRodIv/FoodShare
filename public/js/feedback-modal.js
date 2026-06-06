/**
 * Modal de feedback reutilizável (erros, avisos, confirmações).
 */
(function FeedbackModalModule() {
  'use strict';

  function getOpenOverlay() {
    return document.querySelector('.feedback-modal-overlay.is-open');
  }

  function close() {
    var overlay = getOpenOverlay();
    if (!overlay) return;

    if (window.AppMotion) {
      window.AppMotion.closeOverlay(overlay, {
        bodyClass: 'feedback-modal-open',
      });
      return;
    }

    overlay.classList.remove('is-open');
    document.body.classList.remove('feedback-modal-open');
  }

  function open(overlay) {
    if (!overlay) return;

    overlay.classList.remove('is-closing');
    overlay.classList.add('is-open');
    document.body.classList.add('feedback-modal-open');

    var modal = overlay.querySelector('.feedback-modal');
    if (modal) {
      modal.style.animation = 'none';
      void modal.offsetWidth;
      modal.style.animation = '';
    }

    var primaryBtn = overlay.querySelector('[data-feedback-modal-close]');
    if (primaryBtn) primaryBtn.focus();
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-feedback-modal-close]')) {
        event.preventDefault();
        close();
      }
    });

    document.addEventListener('click', function (event) {
      var overlay = event.target.closest('.feedback-modal-overlay');
      if (overlay && event.target === overlay && overlay.classList.contains('is-open')) {
        close();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });
  }

  function initAutoOpen() {
    var overlay = document.querySelector('.feedback-modal-overlay.is-open');
    if (overlay) open(overlay);
  }

  function init() {
    bindEvents();
    initAutoOpen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.FeedbackModal = {
    open: open,
    close: close,
  };
})();
