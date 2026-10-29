/* ==========================================================================
   forms.js - Behaviour for contact.html and enquiry.html.

   contact.html : validates the message, compiles it into an email and lets
                  the visitor send it to the address set in PAS.config.contactEmail.
   enquiry.html : validates the enquiry, works out a cost and availability
                  response from the catalogue, then submits the enquiry to the
                  sales team with AJAX (fetch) so the page does not reload.
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

  function setStatus(box, type, message) {
    box.hidden = false;
    box.className = 'form-status form-status--' + type;
    box.textContent = message;
  }

  /* Read a field value, trimmed */
  function val(form, name) {
    const field = form.elements[name];
    return field ? String(field.value).trim() : '';
  }

  function checkedValue(form, name) {
    const checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  /* ========================================================================
     CONTACT FORM  ->  compiled email
     ======================================================================== */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) { return; }

    const preview = document.getElementById('email-preview');
    const previewTo = document.getElementById('preview-to');
    const previewSubject = document.getElementById('preview-subject');
    const previewBody = document.getElementById('preview-body');
    const sendLink = document.getElementById('send-email');
    const editButton = document.getElementById('edit-message');

    V.attach(form);
    V.initCounters(form);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!V.validateForm(form)) { return; }

      const messageType = val(form, 'messageType');
      const name = val(form, 'fullName');
      const phone = val(form, 'phone');
      const subject = messageType + ' - message from ' + name;

      const lines = [
        'Message type: ' + messageType,
        'Name: ' + name,
        'Email: ' + val(form, 'email'),
        'Phone: ' + (phone || 'Not provided'),
        'Preferred reply method: ' + checkedValue(form, 'replyMethod'),
        '',
        'Message:',
        val(form, 'message')
      ];
      const body = lines.join('\n');

      /* mailto links use CRLF line breaks and percent encoding */
      const href = 'mailto:' + PAS.config.contactEmail +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body.replace(/\n/g, '\r\n'));

      previewTo.textContent = PAS.config.contactEmail;
      previewSubject.textContent = subject;
      previewBody.textContent = body;
      sendLink.href = href;
      preview.hidden = false;
      form.hidden = true;
      preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sendLink.focus();
    });

    editButton.addEventListener('click', function () {
      preview.hidden = true;
      form.hidden = false;
      form.elements.message.focus();
    });
  }

  /* ========================================================================
     ENQUIRY FORM  ->  instant response + AJAX submission
     ======================================================================== */
  function initEnquiryForm() {
    const form = document.getElementById('enquiry-form');
    if (!form) { return; }

    const partSelect = form.elements.part;
    const deliveryAreaGroup = document.getElementById('delivery-area-group');
    const result = document.getElementById('enquiry-result');
    const status = document.getElementById('enquiry-status');
    const submit = form.querySelector('button[type="submit"]');

    V.attach(form);
    V.initCounters(form);

    /* Fill the part list from the catalogue */
    PAS.products.forEach(function (product) {
      const option = el('option', null, product.name + ' (' + PAS.formatPrice(product.price) + ')');
      option.value = product.id;
      partSelect.insertBefore(option, partSelect.querySelector('option[value="other"]'));
    });

    /* Allow ?part=oil-filter links */
    const requestedPart = new URLSearchParams(window.location.search).get('part');
    if (requestedPart && PAS.getProduct(requestedPart)) { partSelect.value = requestedPart; }

    /* Dates: not in the past and not more than a year ahead */
    form.elements.requiredBy.min = V.localDate(0);
    form.elements.requiredBy.max = V.localDate(365);
    form.elements.vehicleYear.max = String(new Date().getFullYear() + 1);

    /* The delivery area question only applies to delivery */
    function syncDelivery() {
      const wantsDelivery = checkedValue(form, 'fulfilment') === 'delivery';
      deliveryAreaGroup.hidden = !wantsDelivery;
      form.elements.deliveryArea.disabled = !wantsDelivery;
      form.elements.deliveryArea.required = wantsDelivery;
    }
    form.addEventListener('change', function (event) {
      if (event.target.name === 'fulfilment') { syncDelivery(); }
    });
    syncDelivery();

    /* Work out the cost and availability response from the catalogue */
    function buildResponse() {
      const product = PAS.getProduct(val(form, 'part'));
      const qty = parseInt(val(form, 'quantity'), 10);
      const delivery = checkedValue(form, 'fulfilment') === 'delivery';
      const area = val(form, 'deliveryArea');
      const type = val(form, 'enquiryType');

      const response = { rows: [], notes: [], headline: '' };

      if (product) {
        const lineTotal = product.price * qty;
        const stock = PAS.stockInfo(product);
        response.rows.push([product.name, String(qty), PAS.formatPrice(product.price), PAS.formatPrice(lineTotal)]);

        if (stock.level === 'out') {
          response.headline = product.name + ' is out of stock right now.';
          response.notes.push('Our sales team will confirm when it can be supplied.');
        } else if (qty > product.stock) {
          response.headline = 'We have ' + product.stock + ' of ' + product.name + ' in stock, and you asked for ' + qty + '.';
          response.notes.push('Our sales team will confirm when the remaining ' + (qty - product.stock) + ' can be supplied.');
        } else {
          response.headline = product.name + ' is available. ' + qty + ' requested, ' + product.stock + ' in stock.';
        }

        let total = lineTotal;
        if (delivery) {
          const fee = lineTotal >= PAS.config.freeDeliveryFrom ? 0 : PAS.config.deliveryFee;
          total += fee;
          response.rows.push(['Delivery', '', '', fee === 0 ? 'Free' : PAS.formatPrice(fee)]);
          const sameDayArea = PAS.config.sameDayAreas.indexOf(area) !== -1;
          const beforeCutoff = new Date().getHours() < PAS.config.sameDayCutoffHour;
          if (sameDayArea && beforeCutoff && stock.level !== 'out') {
            response.notes.push('Same day delivery applies to orders for ' + area + ' placed before 12:00.');
          } else if (sameDayArea) {
            response.notes.push('Same day delivery covers ' + area + ' for orders placed before 12:00. Our team will confirm your delivery day.');
          } else {
            response.notes.push('We will confirm the delivery day for ' + (area || 'your area') + '.');
          }
        } else {
          response.notes.push('Collection from Silverton Industrial Park is free.');
        }
        response.total = total;
        response.notes.push('Prices include VAT. Please confirm fitment for your vehicle before buying.');
      } else if (type === 'Trade account') {
        response.headline = 'Trade accounts with monthly billing are available for mechanics and fleet owners.';
        response.notes.push('Our sales team will contact you with the details for your business.');
      } else {
        response.headline = 'Thank you. Your enquiry needs a personal quote.';
        response.notes.push('Our sales team will reply with the price and availability.');
      }
      return response;
    }

    function showResponse(response, name) {
      result.replaceChildren();
      result.appendChild(el('h2', null, 'Your response, ' + name));
      result.appendChild(el('p', 'lead', response.headline));

      if (response.rows.length) {
        const table = el('table', 'quote-table');
        const head = el('thead');
        const headRow = el('tr');
        ['Item', 'Qty', 'Unit price', 'Cost'].forEach(function (text) {
          const th = el('th', null, text);
          th.scope = 'col';
          headRow.appendChild(th);
        });
        head.appendChild(headRow);
        const body = el('tbody');
        response.rows.forEach(function (row) {
          const tr = el('tr');
          row.forEach(function (cell) { tr.appendChild(el('td', null, cell)); });
          body.appendChild(tr);
        });
        const foot = el('tfoot');
        const footRow = el('tr');
        const label = el('th', null, 'Estimated total');
        label.colSpan = 3;
        label.scope = 'row';
        footRow.append(label, el('td', null, PAS.formatPrice(response.total, true)));
        foot.appendChild(footRow);
        table.append(head, body, foot);
        result.appendChild(table);
      }

      const list = el('ul');
      response.notes.forEach(function (note) { list.appendChild(el('li', null, note)); });
      result.appendChild(list);
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* Submit with AJAX so the visitor stays on the page */
    function sendEnquiry(response) {
      const data = new FormData(form);
      data.set('_subject', 'Website enquiry: ' + val(form, 'enquiryType'));
      data.set('_captcha', 'false');
      data.set('estimate', response.headline + (response.total ? ' Estimated total: ' + PAS.formatPrice(response.total, true) : ''));

      const controller = new AbortController();
      const timeout = window.setTimeout(function () { controller.abort(); }, 12000);

      setStatus(status, 'info', 'Sending your enquiry to our sales team...');
      submit.disabled = true;

      return fetch(form.dataset.ajaxAction || PAS.config.enquiryEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
        signal: controller.signal
      }).then(function (reply) {
        if (!reply.ok) { throw new Error('Server replied with status ' + reply.status); }
        return reply.json();
      }).then(function () {
        setStatus(status, 'success', 'Your enquiry was sent to our sales team. We will reply by ' + checkedValue(form, 'replyMethod').toLowerCase() + '.');
        form.reset();
        V.initCounters(form);
        syncDelivery();
      }).catch(function () {
        setStatus(status, 'error', 'We could not send your enquiry just now, but your estimate is shown above. Please call 012 804 5521 or WhatsApp 071 234 5678, or use the contact page.');
      }).finally(function () {
        window.clearTimeout(timeout);
        submit.disabled = false;
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (val(form, '_honey') !== '') { return; }   // hidden spam trap field was filled in
      if (!V.validateForm(form)) { return; }

      const response = buildResponse();
      showResponse(response, val(form, 'fullName').split(' ')[0]);
      sendEnquiry(response);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initContactForm();
    initEnquiryForm();
  });
})();
