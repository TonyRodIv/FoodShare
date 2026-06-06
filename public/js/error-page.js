(function () {
  'use strict';

  var page = document.querySelector('.error-page');
  if (!page) return;

  var iconEl = page.querySelector('.error-page__icon--symbol');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateIcon() {
    if (!iconEl || reduced) return;

    iconEl.classList.remove('is-entering');
    void iconEl.offsetWidth;
    iconEl.classList.add('is-entering');

    function onEnd() {
      iconEl.classList.remove('is-entering');
      iconEl.removeEventListener('animationend', onEnd);
    }

    iconEl.addEventListener('animationend', onEnd);
  }

  animateIcon();

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) animateIcon();
  });
})();
