(function () {
  'use strict';

  var LIMITS = {
    nome: 80,
    email: 254,
    senha: 72,
    telefone: 15,
  };

  var HINT_MESSAGES = {
    nome: 'Máximo de 80 caracteres.',
    email: 'Máximo de 254 caracteres.',
    senha: 'Máximo de 72 caracteres.',
    telefone: 'Número completo.',
  };

  var HINT_HIDE_MS = 3500;

  function formatPhone(value) {
    var digits = String(value).replace(/\D/g, '').slice(0, 11);

    if (!digits) return '';
    if (digits.length <= 2) return '(' + digits;
    if (digits.length <= 6) {
      return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    }
    if (digits.length <= 10) {
      return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
    }
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
  }

  function getLimitHint(input) {
    var id = input.id + '-limit-hint';
    var hint = document.getElementById(id);

    if (hint) return hint;

    hint = document.createElement('span');
    hint.id = id;
    hint.className = 'auth-field__hint auth-field__hint--limit';
    hint.setAttribute('aria-live', 'polite');
    hint.hidden = true;
    input.parentNode.appendChild(hint);

    return hint;
  }

  function showLimitHint(input) {
    var hint = getLimitHint(input);
    var message = HINT_MESSAGES[input.id] || 'Limite atingido.';

    hint.textContent = message;
    hint.hidden = false;

    clearTimeout(hint._hideTimer);
    hint._hideTimer = setTimeout(function () {
      hint.hidden = true;
    }, HINT_HIDE_MS);
  }

  function hideLimitHint(input) {
    var hint = document.getElementById(input.id + '-limit-hint');
    if (!hint) return;

    hint.hidden = true;
    clearTimeout(hint._hideTimer);
  }

  function isPrintableKey(event) {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  }

  function bindMaxLength(input, max) {
    if (!input || !max) return;

    input.setAttribute('maxlength', String(max));

    input.addEventListener('keydown', function (event) {
      if (input.value.length >= max && isPrintableKey(event)) {
        showLimitHint(input);
      }
    });

    input.addEventListener('paste', function () {
      requestAnimationFrame(function () {
        if (input.value.length > max) {
          input.value = input.value.slice(0, max);
          showLimitHint(input);
          return;
        }

        if (input.value.length >= max) {
          showLimitHint(input);
        }
      });
    });

    input.addEventListener('input', function () {
      if (input.value.length > max) {
        input.value = input.value.slice(0, max);
        showLimitHint(input);
        return;
      }

      if (input.value.length < max) {
        hideLimitHint(input);
      }
    });
  }

  function bindPhoneMask(input) {
    if (!input) return;

    var hidden = document.getElementById('telefone-value');
    var max = LIMITS.telefone;

    input.setAttribute('maxlength', String(max));
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('autocomplete', 'tel');

    function syncHidden() {
      if (hidden) {
        hidden.value = input.value.replace(/\D/g, '');
      }
    }

    function update() {
      var formatted = formatPhone(input.value);
      if (input.value !== formatted) {
        input.value = formatted;
      }
      syncHidden();
    }

    input.addEventListener('keydown', function (event) {
      if (input.value.length >= max && isPrintableKey(event)) {
        showLimitHint(input);
      }
    });

    input.addEventListener('input', function () {
      update();

      if (input.value.length < max) {
        hideLimitHint(input);
      }
    });

    input.addEventListener('paste', function () {
      requestAnimationFrame(function () {
        var hadExtra = input.value.replace(/\D/g, '').length > 11;
        update();
        if (hadExtra || input.value.length >= max) {
          showLimitHint(input);
        }
      });
    });

    if (hidden && hidden.value) {
      input.value = formatPhone(hidden.value);
    } else if (input.value) {
      update();
    } else {
      syncHidden();
    }
  }

  function initAuthFormInputs() {
    bindMaxLength(document.getElementById('nome'), LIMITS.nome);
    bindMaxLength(document.getElementById('email'), LIMITS.email);
    bindMaxLength(document.getElementById('senha'), LIMITS.senha);
    bindPhoneMask(document.getElementById('telefone'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthFormInputs);
  } else {
    initAuthFormInputs();
  }
})();
