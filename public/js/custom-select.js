(function CustomSelectModule() {
  'use strict';

  function getSelectedOption(select) {
    return select.options[select.selectedIndex] || null;
  }

  function getPlaceholderOption(select) {
    return Array.from(select.options).find(function (opt) {
      return opt.value === '' || (opt.disabled && opt.textContent.trim());
    }) || null;
  }

  function syncTriggerValue(select, valueEl) {
    const selected = getSelectedOption(select);
    const placeholder = getPlaceholderOption(select);

    if (!selected || (selected.value === '' && placeholder)) {
      valueEl.textContent = placeholder ? placeholder.textContent : 'Selecione seu perfil';
      valueEl.classList.add('is-placeholder');
      return;
    }

    valueEl.textContent = selected.textContent;
    valueEl.classList.remove('is-placeholder');
  }

  function syncOptionStates(select, list) {
    const selectedValue = select.value;
    list.querySelectorAll('.custom-select__option').forEach(function (item) {
      const isSelected = item.dataset.value === selectedValue;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function closeSelect(root, trigger, list) {
    root.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    list.querySelectorAll('.custom-select__option.is-focused').forEach(function (item) {
      item.classList.remove('is-focused');
    });
  }

  function openSelect(root, trigger, list) {
    root.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    const selected = list.querySelector('.custom-select__option.is-selected');
    const first = list.querySelector('.custom-select__option');
    const focusTarget = selected || first;
    if (focusTarget) {
      focusTarget.classList.add('is-focused');
      trigger.setAttribute('aria-activedescendant', focusTarget.id);
    }
  }

  function focusOption(list, trigger, option) {
    list.querySelectorAll('.custom-select__option.is-focused').forEach(function (item) {
      item.classList.remove('is-focused');
    });
    if (!option) return;
    option.classList.add('is-focused');
    trigger.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }

  function selectOption(select, root, trigger, list, valueEl, option) {
    select.value = option.dataset.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    syncTriggerValue(select, valueEl);
    syncOptionStates(select, list);
    closeSelect(root, trigger, list);
    trigger.focus();
  }

  function initCustomSelect(select) {
    if (select.dataset.customSelectInit === 'true') return;
    select.dataset.customSelectInit = 'true';

    const root = document.createElement('div');
    root.className = 'custom-select';
    if (select.classList.contains('auth-field__input--error')) {
      root.classList.add('custom-select--error');
    }

    select.parentNode.insertBefore(root, select);
    root.appendChild(select);

    select.classList.add('custom-select__native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select__trigger auth-field__input';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    if (select.id) {
      trigger.id = select.id;
      select.removeAttribute('id');
    }

    if (select.getAttribute('aria-invalid') === 'true') {
      trigger.setAttribute('aria-invalid', 'true');
      select.removeAttribute('aria-invalid');
    }

    const describedBy = select.getAttribute('aria-describedby');
    if (describedBy) {
      trigger.setAttribute('aria-describedby', describedBy);
      select.removeAttribute('aria-describedby');
    }

    const valueEl = document.createElement('span');
    valueEl.className = 'custom-select__value';

    const chevron = document.createElement('span');
    chevron.className = 'custom-select__chevron';
    chevron.setAttribute('aria-hidden', 'true');

    trigger.appendChild(valueEl);
    trigger.appendChild(chevron);

    const list = document.createElement('ul');
    list.className = 'custom-select__list';
    list.setAttribute('role', 'listbox');

    const listId = (trigger.id || 'custom-select') + '-list';
    list.id = listId;
    trigger.setAttribute('aria-controls', listId);

    Array.from(select.options).forEach(function (opt, index) {
      if (opt.value === '' && opt.disabled) return;

      const item = document.createElement('li');
      item.className = 'custom-select__option';
      item.setAttribute('role', 'option');
      item.dataset.value = opt.value;
      item.id = listId + '-opt-' + index;
      item.textContent = opt.textContent;
      list.appendChild(item);
    });

    root.insertBefore(trigger, select);
    root.insertBefore(list, select);

    syncTriggerValue(select, valueEl);
    syncOptionStates(select, list);

    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      if (root.classList.contains('is-open')) {
        closeSelect(root, trigger, list);
      } else {
        openSelect(root, trigger, list);
      }
    });

    list.addEventListener('click', function (event) {
      event.stopPropagation();
      const option = event.target.closest('.custom-select__option');
      if (!option) return;
      selectOption(select, root, trigger, list, valueEl, option);
    });

    trigger.addEventListener('keydown', function (event) {
      const options = Array.from(list.querySelectorAll('.custom-select__option'));
      const focusedIndex = options.findIndex(function (item) {
        return item.classList.contains('is-focused');
      });

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!root.classList.contains('is-open')) {
          openSelect(root, trigger, list);
          return;
        }
        const next = options[Math.min(focusedIndex + 1, options.length - 1)];
        focusOption(list, trigger, next);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!root.classList.contains('is-open')) {
          openSelect(root, trigger, list);
          return;
        }
        const prev = options[Math.max(focusedIndex - 1, 0)];
        focusOption(list, trigger, prev);
      }

      if (event.key === 'Enter' || event.key === ' ') {
        if (!root.classList.contains('is-open')) return;
        event.preventDefault();
        const focused = options[focusedIndex];
        if (focused) selectOption(select, root, trigger, list, valueEl, focused);
      }

      if (event.key === 'Escape') {
        if (!root.classList.contains('is-open')) return;
        event.preventDefault();
        closeSelect(root, trigger, list);
      }
    });

    document.addEventListener('click', function (event) {
      if (!root.classList.contains('is-open')) return;
      if (!root.contains(event.target)) {
        closeSelect(root, trigger, list);
      }
    });
  }

  function initAll() {
    document.querySelectorAll('select[data-custom-select]').forEach(initCustomSelect);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.CustomSelect = { init: initCustomSelect, initAll: initAll };
})();
