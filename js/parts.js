/* ==========================================================================
   parts.js - Builds the product listings from the catalogue in products.js.
   - parts.html: live search, category filter, sorting, quick view modal
   - index.html: featured parts
   Cards are created with DOM methods so product text is never parsed as HTML.
   ========================================================================== */
(function () {
  'use strict';

  const PAS = window.PAS;

  /* ---------- Build one product card ---------- */
  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) { element.className = className; }
    if (text !== undefined) { element.textContent = text; }
    return element;
  }

  function createPartCard(product) {
    const stock = PAS.stockInfo(product);
    const card = createElement('article', 'part-card');
    card.dataset.id = product.id;

    const image = createElement('img', 'part-card__image');
    image.src = product.image;
    image.alt = product.alt;
    image.width = product.width;
    image.height = product.height;
    image.loading = 'lazy';
    image.decoding = 'async';

    const stockLine = createElement('p', 'part-card__stock part-card__stock--' + stock.level, stock.text);

    const actions = createElement('div', 'part-card__actions');
    const view = createElement('button', 'btn btn--outline btn--small', 'Quick view');
    view.type = 'button';
    view.dataset.action = 'quickview';
    view.dataset.id = product.id;
    view.setAttribute('aria-label', 'Quick view of ' + product.name);

    const add = createElement('button', 'btn btn--cart btn--small', stock.level === 'out' ? 'Out of stock' : 'Add to Cart');
    add.type = 'button';
    add.dataset.action = 'add';
    add.dataset.id = product.id;
    add.disabled = stock.level === 'out';
    add.setAttribute('aria-label', 'Add ' + product.name + ' to cart');

    actions.append(view, add);
    card.append(
      image,
      createElement('h3', 'part-card__title', product.name),
      createElement('p', 'part-card__category', product.category),
      stockLine,
      createElement('p', 'price', PAS.formatPrice(product.price)),
      actions
    );
    return card;
  }

  function addToCart(id) {
    const product = PAS.getProduct(id);
    if (!product) { return; }
    const ok = PAS.cart.add(id, 1);
    if (ok) {
      PAS.toast(product.name + ' added to your cart.', 'payment.html', 'View cart');
    } else {
      PAS.toast('Maximum quantity reached for ' + product.name + '.', 'payment.html', 'View cart');
    }
  }

  /* ---------- Quick view modal ---------- */
  const modal = { root: null, opener: null };

  function buildModal() {
    const root = createElement('div', 'modal');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'modal-title');

    const dialog = createElement('div', 'modal__dialog');
    const close = createElement('button', 'btn btn--outline btn--small modal__close', 'Close');
    close.type = 'button';
    close.dataset.action = 'close';

    const image = createElement('img', 'modal__image');
    image.dataset.role = 'image';
    const title = createElement('h2', null, '');
    title.id = 'modal-title';
    title.dataset.role = 'title';

    const meta = createElement('p', 'text-muted');
    meta.dataset.role = 'meta';
    const description = createElement('p');
    description.dataset.role = 'description';
    const price = createElement('p', 'price');
    price.dataset.role = 'price';
    const add = createElement('button', 'btn btn--cart', 'Add to Cart');
    add.type = 'button';
    add.dataset.action = 'modal-add';

    dialog.append(close, image, title, meta, description, price, add);
    root.appendChild(dialog);
    document.body.appendChild(root);

    root.addEventListener('click', function (event) {
      if (event.target === root || event.target.dataset.action === 'close') { closeModal(); }
      if (event.target.dataset.action === 'modal-add') {
        addToCart(root.dataset.id);
        closeModal();
      }
    });

    /* Escape closes the dialog, and Tab stays inside it while it is open */
    document.addEventListener('keydown', function (event) {
      if (!root.classList.contains('is-open')) { return; }
      if (event.key === 'Escape') { closeModal(); return; }
      if (event.key !== 'Tab') { return; }
      const focusable = root.querySelectorAll('button:not([disabled])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!root.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    modal.root = root;
  }

  function openModal(id, opener) {
    const product = PAS.getProduct(id);
    if (!product) { return; }
    if (!modal.root) { buildModal(); }
    const root = modal.root;
    const stock = PAS.stockInfo(product);

    const image = root.querySelector('[data-role="image"]');
    image.src = product.image;
    image.alt = product.alt;
    root.querySelector('[data-role="title"]').textContent = product.name;
    root.querySelector('[data-role="meta"]').textContent = product.category + ' | ' + stock.text;
    root.querySelector('[data-role="description"]').textContent = product.description;
    root.querySelector('[data-role="price"]').textContent = PAS.formatPrice(product.price) + ' incl. VAT';
    const add = root.querySelector('[data-action="modal-add"]');
    add.disabled = stock.level === 'out';
    root.dataset.id = id;

    modal.opener = opener || null;
    document.body.classList.add('no-scroll');
    /* Add the class on the next frame so the open transition plays */
    window.requestAnimationFrame(function () {
      root.classList.add('is-open');
      root.querySelector('[data-action="close"]').focus();
    });
  }

  function closeModal() {
    if (!modal.root) { return; }
    modal.root.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    if (modal.opener) { modal.opener.focus(); }
  }

  /* ---------- Click handling shared by every product grid ---------- */
  function handleGridClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) { return; }
    if (button.dataset.action === 'add') { addToCart(button.dataset.id); }
    if (button.dataset.action === 'quickview') { openModal(button.dataset.id, button); }
  }

  /* ---------- parts.html: search, filter and sort ---------- */
  function initCatalogue() {
    const grid = document.getElementById('parts-grid');
    if (!grid) { return; }

    const searchInput = document.getElementById('part-search');
    const categorySelect = document.getElementById('part-category');
    const sortSelect = document.getElementById('part-sort');
    const resetButton = document.getElementById('part-reset');
    const count = document.getElementById('result-count');

    /* Fill the category list from the catalogue so it can never go out of date */
    Array.from(new Set(PAS.products.map(function (p) { return p.category; }))).sort().forEach(function (name) {
      const option = createElement('option', null, name);
      option.value = name;
      categorySelect.appendChild(option);
    });

    /* Support links such as parts.html?category=Engine%20Parts */
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('category');
    if (requested && Array.from(categorySelect.options).some(function (o) { return o.value === requested; })) {
      categorySelect.value = requested;
    }
    if (params.get('q')) { searchInput.value = params.get('q').slice(0, 60); }

    function render() {
      const query = searchInput.value.trim().toLowerCase();
      const category = categorySelect.value;

      const results = PAS.products.filter(function (p) {
        const haystack = (p.name + ' ' + p.category + ' ' + p.description + ' ' + p.keywords).toLowerCase();
        const matchesQuery = query === '' || query.split(/\s+/).every(function (word) { return haystack.indexOf(word) !== -1; });
        const matchesCategory = category === 'all' || p.category === category;
        return matchesQuery && matchesCategory;
      });

      const sorters = {
        'name-asc': function (a, b) { return a.name.localeCompare(b.name); },
        'price-asc': function (a, b) { return a.price - b.price; },
        'price-desc': function (a, b) { return b.price - a.price; }
      };
      results.sort(sorters[sortSelect.value] || sorters['name-asc']);

      grid.replaceChildren();
      if (results.length === 0) {
        const empty = createElement('div', 'panel empty-state');
        empty.append(
          createElement('h3', null, 'No parts match your search'),
          createElement('p', null, 'Check the spelling, try a shorter word or clear the filters. You can also send us an enquiry for parts not listed here.')
        );
        const link = createElement('a', 'btn', 'Make an enquiry');
        link.href = 'enquiry.html';
        empty.appendChild(link);
        grid.appendChild(empty);
      } else {
        const fragment = document.createDocumentFragment();
        results.forEach(function (product) { fragment.appendChild(createPartCard(product)); });
        grid.appendChild(fragment);
      }
      count.textContent = 'Showing ' + results.length + ' of ' + PAS.products.length + ' parts';
    }

    let timer = null;
    searchInput.addEventListener('input', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(render, 150);
    });
    categorySelect.addEventListener('change', render);
    sortSelect.addEventListener('change', render);
    resetButton.addEventListener('click', function () {
      searchInput.value = '';
      categorySelect.value = 'all';
      sortSelect.value = 'name-asc';
      render();
      searchInput.focus();
    });
    grid.addEventListener('click', handleGridClick);
    render();
  }

  /* ---------- index.html: featured parts ---------- */
  function initFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!grid) { return; }
    PAS.products.filter(function (p) { return p.featured; }).forEach(function (product) {
      grid.appendChild(createPartCard(product));
    });
    grid.addEventListener('click', handleGridClick);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCatalogue();
    initFeatured();
  });
})();
