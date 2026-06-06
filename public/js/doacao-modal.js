(function DoacaoModalModule() {
  'use strict';

  var overlay = null;
  var itemCount = 0;

  function getOverlay() {
    if (!overlay) overlay = document.querySelector('[data-doacao-modal]');
    return overlay;
  }

  function getScrollWrap() {
    return document.querySelector('[data-doacao-modal-scroll]');
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

  function open() {
    var el = getOverlay();
    if (!el) return;

    el.hidden = false;
    el.classList.remove('is-closing');
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('feedback-modal-open');

    var modal = el.querySelector('.feedback-modal');
    if (modal) {
      modal.style.animation = 'none';
      void modal.offsetWidth;
      modal.style.animation = '';
    }

    var firstInput = el.querySelector('.auth-field__input, .auth-field__select');
    if (firstInput) firstInput.focus();

    bindScrollFades();
    requestAnimationFrame(updateScrollFades);
  }

  function close() {
    var el = getOverlay();
    if (!el || !el.classList.contains('is-open')) return;

    function onClosed() {
      el.setAttribute('aria-hidden', 'true');
      el.hidden = true;
      if (!document.querySelector('.feedback-modal-overlay.is-open')) {
        document.body.classList.remove('feedback-modal-open');
      }
    }

    if (window.AppMotion) {
      window.AppMotion.closeOverlay(el, {
        bodyClass: 'feedback-modal-open',
        onClosed: onClosed,
      });
      return;
    }

    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    el.hidden = true;
    document.body.classList.remove('feedback-modal-open');
  }

  function getContainer() {
    return document.getElementById('itensContainer');
  }

  function getTemplate() {
    return document.getElementById('doacaoItemTemplate');
  }

  function bindRemove(btn, itemDiv) {
    btn.addEventListener('click', function () {
      itemDiv.style.animation = 'feedbackModalOut 180ms var(--ease-out) forwards';
      setTimeout(function () {
        itemDiv.remove();
        recalcularIndices();
        requestAnimationFrame(updateScrollFades);
      }, 170);
    });
  }

  function recalcularIndices() {
    var container = getContainer();
    if (!container) return;

    var itens = container.querySelectorAll('.doacao-modal__item');
    itemCount = 0;
    itens.forEach(function (itemDiv, index) {
      itemDiv.querySelectorAll('[data-name]').forEach(function (input) {
        input.name = 'itens[' + index + '][' + input.dataset.name + ']';
      });
      var btnRemover = itemDiv.querySelector('.btnRemoverItem');
      if (btnRemover) {
        btnRemover.style.display = index === 0 && itens.length === 1 ? 'none' : 'flex';
      }
      itemCount++;
    });
  }

  function adicionarItem(data) {
    var template = getTemplate();
    var container = getContainer();
    if (!template || !container) return;

    var clone = template.content.cloneNode(true);
    var itemDiv = clone.querySelector('.doacao-modal__item');
    var btnRemover = itemDiv.querySelector('.btnRemoverItem');

    itemDiv.classList.add('doacao-modal__item--enter');

    itemDiv.querySelectorAll('[data-name]').forEach(function (input) {
      input.name = 'itens[' + itemCount + '][' + input.dataset.name + ']';
      if (data && data[input.dataset.name]) {
        input.value = data[input.dataset.name];
      }
    });

    bindRemove(btnRemover, itemDiv);
    container.appendChild(clone);
    itemCount++;
    recalcularIndices();

    if (window.CustomSelect) {
      itemDiv.querySelectorAll('select[data-custom-select]').forEach(function (select) {
        window.CustomSelect.init(select);
      });
    }

    requestAnimationFrame(updateScrollFades);
  }

  function populateFromOld() {
    var script = document.getElementById('doacao-modal-old');
    var container = getContainer();
    if (!script || !container) return;

    var old = {};
    try {
      old = JSON.parse(script.textContent || '{}');
    } catch (e) {
      old = {};
    }

    var itens = old.itens;
    if (itens && !Array.isArray(itens)) {
      itens = Object.keys(itens)
        .sort(function (a, b) { return Number(a) - Number(b); })
        .map(function (key) { return itens[key]; });
    }

    container.innerHTML = '';
    itemCount = 0;

    if (!itens || itens.length === 0) {
      adicionarItem();
      return;
    }

    itens.forEach(function (item) {
      adicionarItem(item);
    });
  }

  function initCustomSelects() {
    if (!window.CustomSelect) return;
    var form = document.getElementById('doacaoForm');
    if (!form) return;
    form.querySelectorAll('select[data-custom-select]').forEach(function (select) {
      window.CustomSelect.init(select);
    });
  }

  function initItems() {
    var container = getContainer();
    if (!container) return;
    if (container.children.length === 0) populateFromOld();
    initCustomSelects();
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-doacao-modal-open]')) {
        event.preventDefault();
        initItems();
        open();
      }
    });

    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-doacao-modal-close]')) {
        event.preventDefault();
        close();
      }
    });

    document.addEventListener('click', function (event) {
      var el = getOverlay();
      if (el && event.target === el && el.classList.contains('is-open')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        var el = getOverlay();
        if (el && el.classList.contains('is-open')) close();
      }
    });

    var btnAdd = document.getElementById('btnAdicionarItem');
    if (btnAdd) {
      btnAdd.addEventListener('click', function () {
        adicionarItem();
      });
    }
  }

  function initAutoOpen() {
    var el = getOverlay();
    if (!el) return;

    var params = new URLSearchParams(window.location.search);
    if (params.get('nova') === '1' || el.classList.contains('is-open')) {
      initItems();
      open();
      if (params.get('nova') === '1') {
        var url = new URL(window.location.href);
        url.searchParams.delete('nova');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  }

  function init() {
    bindEvents();
    bindScrollFades();
    initAutoOpen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DoacaoModal = { open: open, close: close };
})();