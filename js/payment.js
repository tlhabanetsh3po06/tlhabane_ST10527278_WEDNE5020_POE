/* ==========================================================================
   payment.js - Cart review, cost calculation and checkout for payment.html.

   Cost rules (set in products.js):
   - Shelf prices include 15% VAT, so VAT is shown as part of the total.
   - Collection is free. Delivery costs a flat fee unless the order reaches
     the free delivery amount.
   This is a demonstration checkout: no payment is taken and card details are
   validated in the browser only. They are never stored or sent anywhere.
   ========================================================================== */
(function () {
  'use strict';

  const PAS = window.PAS;
  const V = PAS.validation;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('payment-form');
    if (!form) { return; }

    const cartPanel = document.getElementById('cart-panel');
    const cartList = document.getElementById('cart-list');
    const emptyMessage = document.getElementById('cart-empty');
    const checkout = document.getElementById('checkout-area');
    const confirmation = document.getElementById('order-confirmation');
    const status = document.getElementById('payment-status');
    const placeOrder = document.getElementById('place-order');

    const out = {
      subtotal: document.getElementById('total-subtotal'),
      delivery: document.getElementById('total-delivery'),
      vat: document.getElementById('total-vat'),
      total: document.getElementById('total-grand'),
      deliveryNote: document.getElementById('delivery-note')
    };

    V.attach(form);

    function deliveryMethod() {
      const checked = form.querySelector('input[name="fulfilment"]:checked');
      return checked ? checked.value : 'collection';
    }

    function paymentMethod() {
      const checked = form.querySelector('input[name="paymentMethod"]:checked');
      return checked ? checked.value : '';
    }

    /* ---------- Cart rendering ---------- */
    function renderCart() {
      const totals = PAS.cart.totals(deliveryMethod());
      const hasItems = totals.lines.length > 0;

      emptyMessage.hidden = hasItems;
      checkout.hidden = !hasItems;
      cartList.replaceChildren();

      totals.lines.forEach(function (line) {
        const product = line.product;
        const item = el('li', 'cart-item');
        item.dataset.id = product.id;

        const image = el('img', 'cart-item__image');
        image.src = product.image;
        image.alt = product.alt;
        image.width = 72;
        image.height = 72;

        const info = el('div');
        info.append(
          el('p', 'cart-item__name', product.name),
          el('p', 'text-muted', PAS.formatPrice(product.price) + ' each')
        );

        const controls = el('div', 'cart-item__controls');
        const qty = el('div', 'qty');
        const minus = el('button', 'qty__button', '-');
        minus.type = 'button';
        minus.dataset.action = 'decrease';
        minus.setAttribute('aria-label', 'Decrease quantity of ' + product.name);
        const value = el('span', 'qty__value', String(line.qty));
        value.setAttribute('aria-live', 'polite');
        const plus = el('button', 'qty__button', '+');
        plus.type = 'button';
        plus.dataset.action = 'increase';
        plus.setAttribute('aria-label', 'Increase quantity of ' + product.name);
        qty.append(minus, value, plus);

        const lineTotal = el('span', 'line-total', PAS.formatPrice(line.lineTotal, true));
        const remove = el('button', 'btn btn--outline btn--small', 'Remove');
        remove.type = 'button';
        remove.dataset.action = 'remove';
        remove.setAttribute('aria-label', 'Remove ' + product.name + ' from cart');
        controls.append(qty, lineTotal, remove);

        item.append(image, info, controls);
        cartList.appendChild(item);
      });

      out.subtotal.textContent = PAS.formatPrice(totals.subtotal, true);
      out.delivery.textContent = totals.delivery === 0 && deliveryMethod() === 'delivery' ? 'Free' : PAS.formatPrice(totals.delivery, true);
      out.vat.textContent = PAS.formatPrice(totals.vat, true);
      out.total.textContent = PAS.formatPrice(totals.total, true);

      if (deliveryMethod() === 'delivery') {
        const remaining = PAS.config.freeDeliveryFrom - totals.subtotal;
        out.deliveryNote.textContent = remaining > 0
          ? 'Add ' + PAS.formatPrice(remaining, true) + ' more to get free delivery.'
          : 'Your order qualifies for free delivery.';
      } else {
        out.deliveryNote.textContent = 'Collect from Silverton Industrial Park at no charge.';
      }
    }

    cartList.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) { return; }
      const id = button.closest('.cart-item').dataset.id;
      const current = PAS.cart.items().find(function (item) { return item.id === id; });
      if (!current) { return; }
      if (button.dataset.action === 'increase') { PAS.cart.setQty(id, current.qty + 1); }
      if (button.dataset.action === 'decrease') { PAS.cart.setQty(id, current.qty - 1); }
      if (button.dataset.action === 'remove') { PAS.cart.remove(id); }
    });

    document.addEventListener('pas:cart-changed', renderCart);

    /* ---------- Show only the fields that apply ---------- */
    function syncSections() {
      const delivery = deliveryMethod() === 'delivery';
      const card = paymentMethod() === 'card';

      const addressGroup = document.getElementById('address-fields');
      addressGroup.hidden = !delivery;
      addressGroup.querySelectorAll('input').forEach(function (input) {
        input.disabled = !delivery;
        input.required = delivery;
      });

      const cardGroup = document.getElementById('card-fields');
      cardGroup.hidden = !card;
      cardGroup.querySelectorAll('input').forEach(function (input) {
        input.disabled = !card;
        input.required = card;
      });

      /* Cash is only possible when collecting */
      const cash = form.querySelector('input[name="paymentMethod"][value="cash"]');
      cash.disabled = delivery;
      if (delivery && cash.checked) { cash.checked = false; }
      document.getElementById('cash-choice').hidden = delivery;

      document.getElementById('eft-info').hidden = paymentMethod() !== 'eft';
      document.getElementById('cash-info').hidden = paymentMethod() !== 'cash';
    }

    form.addEventListener('change', function (event) {
      if (event.target.name === 'fulfilment' || event.target.name === 'paymentMethod') {
        syncSections();
        renderCart();
      }
    });

    /* ---------- Friendly input formatting ---------- */
    form.elements.cardNumber.addEventListener('input', function (event) {
      const digits = event.target.value.replace(/\D/g, '').slice(0, 19);
      event.target.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });

    form.elements.cardExpiry.addEventListener('input', function (event) {
      let digits = event.target.value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) { digits = digits.slice(0, 2) + '/' + digits.slice(2); }
      event.target.value = digits;
    });

    form.elements.cardCvv.addEventListener('input', function (event) {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
    });

    form.elements.postalCode.addEventListener('input', function (event) {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
    });

    /* ---------- Place the order ---------- */
    function orderReference() {
      const now = new Date();
      const pad = function (n) { return String(n).padStart(2, '0'); };
      const stamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate());
      return 'PAS-' + stamp + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    }

    function showConfirmation(totals, method, fulfilment, name) {
      confirmation.replaceChildren();
      confirmation.appendChild(el('h2', null, 'Thank you, ' + name.split(' ')[0]));
      confirmation.appendChild(el('p', null, 'Your order reference is'));
      confirmation.appendChild(el('p', 'order-reference', orderReference()));

      const list = el('ul', 'plain-list');
      totals.lines.forEach(function (line) {
        list.appendChild(el('li', null, line.qty + ' x ' + line.product.name + ': ' + PAS.formatPrice(line.lineTotal, true)));
      });
      confirmation.appendChild(list);
      confirmation.appendChild(el('p', 'lead', 'Total ' + (method === 'cash' ? 'to pay on collection' : 'paid') + ': ' + PAS.formatPrice(totals.total, true) + ' (includes VAT of ' + PAS.formatPrice(totals.vat, true) + ')'));

      const next = {
        card: 'Demonstration only: no card payment was taken.',
        eft: 'Use your order reference as the EFT payment reference once banking details are supplied.',
        cash: 'Pay in store when you collect your parts.'
      };
      confirmation.appendChild(el('p', null, next[method]));
      confirmation.appendChild(el('p', null, fulfilment === 'delivery' ? 'We will confirm your delivery day by email or phone.' : 'Collect from Silverton Industrial Park during business hours.'));

      const back = el('a', 'btn', 'Continue shopping');
      back.href = 'parts.html';
      confirmation.appendChild(back);
      confirmation.hidden = false;
      cartPanel.hidden = true;
      checkout.hidden = true;
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'start' });
      confirmation.setAttribute('tabindex', '-1');
      confirmation.focus();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      status.hidden = true;

      if (PAS.cart.count() === 0) {
        status.hidden = false;
        status.className = 'form-status form-status--error';
        status.textContent = 'Your cart is empty. Add parts before paying.';
        return;
      }
      if (!V.validateForm(form)) {
        status.hidden = false;
        status.className = 'form-status form-status--error';
        status.textContent = 'Please fix the highlighted fields and try again.';
        return;
      }

      const fulfilment = deliveryMethod();
      const method = paymentMethod();
      const totals = PAS.cart.totals(fulfilment);
      const name = form.elements.fullName.value.trim();

      placeOrder.disabled = true;
      showConfirmation(totals, method, fulfilment, name);

      /* Clear sensitive fields and the cart. Nothing is stored. */
      form.reset();
      PAS.cart.clear();
      syncSections();
      placeOrder.disabled = false;
    });

    syncSections();
    renderCart();
  });
})();
