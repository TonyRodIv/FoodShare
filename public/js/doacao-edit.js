/**
 * Formulário de edição de doação (multi-item)
 */
(function DoacaoEditModule() {
  'use strict';

  var itemCount = 0;

  function getContainer() {
    return document.getElementById('itensContainerEdit');
  }

  function getTemplate() {
    return document.getElementById('doacaoItemTemplateEdit');
  }

  function bindRemove(btn, itemDiv) {
    btn.addEventListener('click', function () {
      itemDiv.remove();
      recalcularIndices();
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
      var btnRemover = itemDiv.querySelector('.btnRemoverItemEdit');
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
    var btnRemover = itemDiv.querySelector('.btnRemoverItemEdit');

    itemDiv.querySelectorAll('[data-name]').forEach(function (input) {
      input.name = 'itens[' + itemCount + '][' + input.dataset.name + ']';
      if (data && data[input.dataset.name] != null) {
        input.value = data[input.dataset.name];
      }
    });

    bindRemove(btnRemover, itemDiv);
    container.appendChild(clone);
    itemCount++;
    recalcularIndices();
  }

  function populateFromSeed() {
    var script = document.getElementById('doacao-edit-old');
    var container = getContainer();
    if (!script || !container) return;

    var seed = {};
    try {
      seed = JSON.parse(script.textContent || '{}');
    } catch (e) {
      seed = {};
    }

    var itens = seed.itens;
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

  function bindEvents() {
    var btnAdd = document.getElementById('btnAdicionarItemEdit');
    if (btnAdd) {
      btnAdd.addEventListener('click', function () {
        adicionarItem();
      });
    }

    var form = document.getElementById('editarDoacaoForm');
    if (form) {
      form.addEventListener('submit', function () {
        var btn = document.getElementById('btnSalvarEdit');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Salvando...';
        }
      });
    }
  }

  function init() {
    populateFromSeed();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
