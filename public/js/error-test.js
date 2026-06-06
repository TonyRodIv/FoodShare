(function () {
  var root = document.querySelector('[data-error-test]');
  if (!root) return;

  var toggle = root.querySelector('.error-test__toggle');
  var panel = root.querySelector('.error-test__panel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', function () {
    var open = panel.hasAttribute('hidden');
    panel.toggleAttribute('hidden', !open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', function (event) {
    if (!root.contains(event.target)) {
      panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
