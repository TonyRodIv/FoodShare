(function PageTransitionsModule() {
  'use strict';

  const STORAGE_KEY = 'pageTransitionDirection';
  const DURATION_MS = 320;
  const MOBILE_QUERY = '(max-width: 960px)';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function shouldHandleLink(event, link) {
    if (event.defaultPrevented) return false;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== '_self') return false;
    if (link.hasAttribute('download')) return false;
    if (!link.href || link.origin !== window.location.origin) return false;
    if (!link.dataset.navDirection) return false;
    return true;
  }

  function getTransitionTarget() {
    if (isMobile()) {
      return document.querySelector('.page-transition-root');
    }
    return document.querySelector('.auth-panel__inner');
  }

  function playExit(direction) {
    const target = getTransitionTarget();
    if (!target) return;

    target.classList.remove('page-transition-enter', 'page-transition-enter-active');
    target.classList.add('page-transition-exit', `page-transition-exit--${direction}`);
  }

  function playEnter(direction) {
    const target = getTransitionTarget();
    if (!target) return;

    target.classList.add('page-transition-enter', `page-transition-enter--${direction}`);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        target.classList.add('page-transition-enter-active');
      });
    });
  }

  function navigate(url, direction) {
    sessionStorage.setItem(STORAGE_KEY, direction);
    playExit(direction);
    window.setTimeout(function () {
      window.location.href = url;
    }, DURATION_MS);
  }

  function bindLinks() {
    document.addEventListener('click', function (event) {
      if (!document.body.classList.contains('page-transitions-enabled')) return;
      if (prefersReducedMotion()) return;

      const link = event.target.closest('a[data-nav-direction]');
      if (!link || !shouldHandleLink(event, link)) return;

      event.preventDefault();
      navigate(link.href, link.dataset.navDirection);
    });
  }

  function initEnterAnimation() {
    if (!document.body.classList.contains('page-transitions-enabled')) return;
    if (prefersReducedMotion()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const direction = sessionStorage.getItem(STORAGE_KEY);
    if (!direction) return;

    sessionStorage.removeItem(STORAGE_KEY);
    playEnter(direction);
  }

  function init() {
    bindLinks();
    initEnterAnimation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PageTransitions = {
    DURATION_MS: DURATION_MS,
    MOBILE_QUERY: MOBILE_QUERY,
    navigate: navigate,
    playEnter: playEnter,
    playExit: playExit,
  };
})();
