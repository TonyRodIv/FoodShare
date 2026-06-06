/**
 * Menus do header — notificações e perfil
 */
(function AppHeaderModule() {
  'use strict';

  var openDropdown = null;

  function getDropdown(id) {
    return document.getElementById(id);
  }

  function getToggles(name) {
    return document.querySelectorAll('[data-' + name + '-toggle]');
  }

  function positionPanel(dropdown, trigger) {
    var panel = dropdown.querySelector('.app-dropdown__panel');
    if (!panel) return;

    var rect = trigger.getBoundingClientRect();
    var panelWidth = panel.offsetWidth || 360;
    var left = rect.right - panelWidth;
    var top = rect.bottom + 8;

    if (left < 16) left = 16;
    if (left + panelWidth > window.innerWidth - 16) {
      left = window.innerWidth - panelWidth - 16;
    }

    var maxTop = window.innerHeight - panel.offsetHeight - 16;
    if (top > maxTop) top = Math.max(16, maxTop);

    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
  }

  function setExpanded(toggles, expanded) {
    toggles.forEach(function (btn) {
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  function closeDropdown() {
    if (!openDropdown) return;

    var dropdown = openDropdown;
    var id = dropdown.id;
    var toggleName = id === 'notifications-dropdown' ? 'notifications' : 'profile';
    setExpanded(getToggles(toggleName), false);

    function finish() {
      dropdown.classList.remove('is-open', 'is-closing');
      dropdown.hidden = true;
      if (openDropdown === dropdown) openDropdown = null;
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dropdown.classList.add('is-closing');
      dropdown.classList.remove('is-open');
      setTimeout(finish, 200);
      return;
    }

    finish();
  }

  function openDropdownMenu(dropdown, trigger, toggleName) {
    if (openDropdown && openDropdown !== dropdown) closeDropdown();

    dropdown.hidden = false;
    dropdown.classList.remove('is-closing', 'is-open');
    openDropdown = dropdown;

    setExpanded(getToggles(toggleName), true);
    positionPanel(dropdown, trigger);

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      dropdown.classList.add('is-open');
      return;
    }

    /* Dois frames para o navegador pintar o estado fechado antes da animação */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (openDropdown === dropdown) {
          dropdown.classList.add('is-open');
        }
      });
    });
  }

  function toggleDropdown(dropdownId, toggleName, trigger) {
    var dropdown = getDropdown(dropdownId);
    if (!dropdown) return;

    if (openDropdown === dropdown) {
      closeDropdown();
      return;
    }

    openDropdownMenu(dropdown, trigger, toggleName);
  }

  function bindToggles(toggleName, dropdownId) {
    getToggles(toggleName).forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleDropdown(dropdownId, toggleName, btn);
      });
    });
  }

  function bindPlaceholderLinks() {
    document.querySelectorAll('[data-placeholder-link]').forEach(function (el) {
      el.addEventListener('click', function (event) {
        event.preventDefault();
        closeDropdown();
      });
    });
  }

  function bindGlobalClose() {
    document.addEventListener('click', function () {
      closeDropdown();
    });

    document.querySelectorAll('.app-dropdown__panel').forEach(function (panel) {
      panel.addEventListener('click', function (event) {
        event.stopPropagation();
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeDropdown();
    });

    window.addEventListener('resize', function () {
      if (openDropdown) closeDropdown();
    });
  }

  function init() {
    bindToggles('notifications', 'notifications-dropdown');
    bindToggles('profile', 'profile-dropdown');
    bindPlaceholderLinks();
    bindGlobalClose();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
