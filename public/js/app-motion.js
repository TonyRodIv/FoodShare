(function AppMotionModule() {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function closeOverlay(overlay, options) {
    if (!overlay) return;

    var opts = options || {};
    var bodyClass = opts.bodyClass;
    var panelSelector = opts.panelSelector || '.feedback-modal, .app-dropdown__panel';
    var onClosed = opts.onClosed || function () {};

    if (REDUCED || !overlay.classList.contains('is-open')) {
      overlay.classList.remove('is-open', 'is-closing');
      if (bodyClass) document.body.classList.remove(bodyClass);
      onClosed();
      return;
    }

    overlay.classList.add('is-closing');
    overlay.classList.remove('is-open');

    var panel = overlay.querySelector(panelSelector);
    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      overlay.classList.remove('is-closing');
      if (bodyClass) document.body.classList.remove(bodyClass);
      onClosed();
    }

    if (panel) {
      panel.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, 320);
    } else {
      finish();
    }
  }

  function initPageEntrance() {
    if (REDUCED) return;

    var main = document.querySelector('.app-main');
    if (!main) return;

    requestAnimationFrame(function () {
      main.classList.add('app-main--mounted');
    });
  }

  function initPressRipple() {
    if (REDUCED) return;

    document.addEventListener('click', function (event) {
      var target = event.target.closest('[data-press]');
      if (!target) return;
      target.classList.remove('is-pressed');
      void target.offsetWidth;
      target.classList.add('is-pressed');
      setTimeout(function () {
        target.classList.remove('is-pressed');
      }, 180);
    });
  }

  function init() {
    initPageEntrance();
    initPressRipple();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AppMotion = {
    closeOverlay: closeOverlay,
  };
})();
