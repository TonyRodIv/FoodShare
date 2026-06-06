/**
 * Blocos reutilizáveis — layout Figma 90:371 (modal de detalhe).
 */
(function AppDetailModalRenderModule() {
  'use strict';

  var STATUS_BADGE_KEYS = {
    ativo: true,
    disponivel: true,
    entregue: true,
    aprovado: true,
    aceito: true,
    reservado: true,
    pendente: true,
    ultimas: true,
    expirado: true,
    recusado: true,
    cancelado: true,
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderBadge(key, label) {
    var mod = STATUS_BADGE_KEYS[key] ? ' app-detail-modal__badge--' + escapeHtml(key) : ' app-detail-modal__badge--neutral';
    return '<span class="app-detail-modal__badge' + mod + '">' + escapeHtml(label) + '</span>';
  }

  function renderBadges(badges) {
    var list = badges || [];
    if (!list.length) return '';
    return (
      '<div class="app-detail-modal__badges">' +
      list.map(function (badge) {
        return renderBadge(badge.key, badge.label);
      }).join('') +
      '</div>'
    );
  }

  function renderSubtitleDe(nome) {
    if (!nome) return '';
    return '<p class="app-detail-modal__subtitle">De ' + escapeHtml(nome) + '</p>';
  }

  function renderHeader(options) {
    var opts = options || {};
    var titleId = opts.titleId ? ' id="' + escapeHtml(opts.titleId) + '"' : '';

    return (
      '<header class="app-detail-modal__header">' +
        '<h2 class="app-detail-modal__title"' + titleId + '>' + escapeHtml(opts.title || '') + '</h2>' +
        (opts.subtitle ? '<p class="app-detail-modal__subtitle">' + escapeHtml(opts.subtitle) + '</p>' : renderSubtitleDe(opts.deNome)) +
        renderBadges(opts.badges) +
      '</header>'
    );
  }

  function renderMicroTags(tags) {
    var list = tags || [];
    if (!list.length) return '';
    return (
      '<div class="app-meta-tags app-detail-modal__item-tags">' +
      list.map(function (tag) {
        return '<span class="app-meta-tag">' + escapeHtml(tag) + '</span>';
      }).join('') +
      '</div>'
    );
  }

  function itemToMicroTags(item) {
    var tags = [];
    if (item.categoriaLabel) tags.push(item.categoriaLabel);
    if (item.quantidade != null) tags.push(item.quantidade + ' un');
    if (item.validadeLabel) tags.push('Val. ' + item.validadeLabel);
    if (!tags.length && item.subLabel) tags.push(item.subLabel);
    return tags;
  }

  function renderItemsPanel(items, options) {
    var list = items || [];
    if (!list.length) return '';

    var opts = options || {};
    var ariaLabel = opts.ariaLabel || 'Itens do pacote';

    var itemsHtml = list.map(function (item) {
      return (
        '<li class="app-detail-modal__items-row">' +
          '<div class="app-detail-modal__item-info">' +
            '<p class="app-detail-modal__item-name">' + escapeHtml(item.nome) + '</p>' +
            renderMicroTags(itemToMicroTags(item)) +
          '</div>' +
        '</li>'
      );
    }).join('');

    return (
      '<section class="app-detail-modal__items-panel" aria-label="' + escapeHtml(ariaLabel) + '">' +
        '<ul class="app-detail-modal__items-list">' + itemsHtml + '</ul>' +
      '</section>'
    );
  }

  function renderInsetBlock(label, text) {
    if (!text) return '';
    return (
      '<section class="app-detail-modal__inset-block">' +
        '<p class="app-detail-modal__inset-label">' + escapeHtml(label) + '</p>' +
        '<p class="app-detail-modal__inset-text">' + escapeHtml(text) + '</p>' +
      '</section>'
    );
  }

  function renderFactsBlock(label, facts) {
    var list = facts || [];
    if (!list.length) return '';

    var rows = list.map(function (fact) {
      return (
        '<li class="app-detail-modal__info-row">' +
          '<span class="app-detail-modal__info-key">' + escapeHtml(fact.label) + '</span>' +
          '<span class="app-detail-modal__info-val">' + escapeHtml(fact.value) + '</span>' +
        '</li>'
      );
    }).join('');

    return (
      '<section class="app-detail-modal__inset-block app-detail-modal__inset-block--info">' +
        '<p class="app-detail-modal__inset-label">' + escapeHtml(label || 'Informações') + '</p>' +
        '<ul class="app-detail-modal__info-list">' + rows + '</ul>' +
      '</section>'
    );
  }

  function renderBody(options) {
    var opts = options || {};
    var parts = [
      renderHeader({
        titleId: opts.titleId,
        title: opts.title,
        deNome: opts.deNome,
        subtitle: opts.subtitle,
        badges: opts.badges,
      }),
      opts.noteLabel && opts.noteText ? renderInsetBlock(opts.noteLabel, opts.noteText) : '',
      opts.facts && opts.facts.length ? renderFactsBlock(opts.factsLabel, opts.facts) : '',
      renderItemsPanel(opts.items, { ariaLabel: opts.itemsAriaLabel }),
    ].filter(Boolean);

    return '<div class="app-detail-modal__sections">' + parts.join('') + '</div>';
  }

  function renderSections(sections) {
    var parts = (sections || []).filter(Boolean);
    if (!parts.length) return '';
    return '<div class="app-detail-modal__sections">' + parts.join('') + '</div>';
  }

  window.AppDetailModalRender = {
    escapeHtml: escapeHtml,
    renderBadge: renderBadge,
    renderBadges: renderBadges,
    renderSubtitleDe: renderSubtitleDe,
    renderHeader: renderHeader,
    renderItemsPanel: renderItemsPanel,
    renderInsetBlock: renderInsetBlock,
    renderFactsBlock: renderFactsBlock,
    renderBody: renderBody,
    renderSections: renderSections,
  };
})();
