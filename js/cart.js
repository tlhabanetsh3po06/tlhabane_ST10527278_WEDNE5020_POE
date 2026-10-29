/* ==========================================================================
   cart.js - Shopping cart stored in the browser (localStorage).
   Provides PAS.cart used by parts.js and payment.js.
   Only product ids and quantities are stored. No personal data.
   ========================================================================== */
(function () {
  'use strict';

  const PAS = (window.PAS = window.PAS || {});
  const STORAGE_KEY = 'pasCart';
  let memoryCart = [];   // used if localStorage is blocked

  function cleanItems(items) {
    if (!Array.isArray(items)) { return []; }
    return items.filter(function (item) {
      return item && PAS.getProduct(item.id) && Number.isInteger(item.qty) && item.qty > 0;
    });
  }

  function read() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return cleanItems(raw ? JSON.parse(raw) : []);
    } catch (error) {
      return cleanItems(memoryCart);
    }
  }

  function write(items) {
    memoryCart = items;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) { /* storage blocked: memory copy is used instead */ }
    document.dispatchEvent(new CustomEvent('pas:cart-changed'));
  }

  function limitFor(product) {
    return Math.max(0, Math.min(PAS.config.maxQuantityPerItem, product.stock));
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  PAS.cart = {
    items: read,

    count: function () {
      return read().reduce(function (sum, item) { return sum + item.qty; }, 0);
    },

    add: function (id, qty) {
      const product = PAS.getProduct(id);
      if (!product || limitFor(product) === 0) { return false; }
      const items = read();
      const existing = items.find(function (item) { return item.id === id; });
      const wanted = (existing ? existing.qty : 0) + (qty || 1);
      const next = Math.min(wanted, limitFor(product));
      if (existing) { existing.qty = next; } else { items.push({ id: id, qty: next }); }
      write(items);
      return wanted <= limitFor(product);
    },

    setQty: function (id, qty) {
      const product = PAS.getProduct(id);
      if (!product) { return; }
      const items = read();
      const existing = items.find(function (item) { return item.id === id; });
      if (!existing) { return; }
      if (qty <= 0) {
        write(items.filter(function (item) { return item.id !== id; }));
        return;
      }
      existing.qty = Math.min(Math.floor(qty), limitFor(product));
      write(items);
    },

    remove: function (id) {
      write(read().filter(function (item) { return item.id !== id; }));
    },

    clear: function () { write([]); },

    /* Work out line totals, delivery, VAT and the grand total.
       method is "collection" or "delivery". Prices include VAT. */
    totals: function (method) {
      const lines = read().map(function (item) {
        const product = PAS.getProduct(item.id);
        return { product: product, qty: item.qty, lineTotal: round(product.price * item.qty) };
      });
      const subtotal = round(lines.reduce(function (sum, line) { return sum + line.lineTotal; }, 0));
      const qualifiesFree = subtotal >= PAS.config.freeDeliveryFrom;
      const delivery = method === 'delivery' && subtotal > 0 && !qualifiesFree ? PAS.config.deliveryFee : 0;
      const total = round(subtotal + delivery);
      const vat = round(total * PAS.config.vatRate / (1 + PAS.config.vatRate));
      return { lines: lines, subtotal: subtotal, delivery: delivery, total: total, vat: vat, excludingVat: round(total - vat) };
    }
  };

  /* Keep every "Cart (n)" badge in the navigation up to date */
  function updateBadges(animate) {
    const count = PAS.cart.count();
    document.querySelectorAll('.cart-count').forEach(function (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
      if (animate) {
        badge.classList.remove('is-bump');
        void badge.offsetWidth;   // restart the animation
        badge.classList.add('is-bump');
      }
    });
  }

  document.addEventListener('pas:cart-changed', function () { updateBadges(true); });
  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY) { updateBadges(false); }
  });
  document.addEventListener('DOMContentLoaded', function () { updateBadges(false); });
})();
