/* ==========================================================================
   validation.js - Client-side form validation shared by the contact,
   enquiry and payment forms.

   How it works:
   - HTML5 attributes (required, type, min, max, minlength, maxlength, pattern)
     describe each rule in the markup.
   - This script reads those rules, adds extra checks (South African phone
     numbers, dates, card numbers) and shows a clear message under the field.
   - Forms use the "novalidate" attribute so these messages replace the
     browser's default pop-ups.
   ========================================================================== */
(function () {
  'use strict';

  const PAS = (window.PAS = window.PAS || {});

  /* ---------- Individual rules ---------- */
  const rules = {
    /* South African numbers: 0123456789 or +27123456789 (spaces and dashes allowed) */
    saPhone: function (value) {
      return /^(\+27|0)[1-9][0-9]{8}$/.test(value.replace(/[\s-]/g, ''));
    },

    /* Luhn checksum used by all major card numbers */
    luhn: function (value) {
      const digits = value.replace(/\s/g, '');
      if (!/^[0-9]{13,19}$/.test(digits)) { return false; }
      let sum = 0;
      let double = false;
      for (let i = digits.length - 1; i >= 0; i -= 1) {
        let digit = parseInt(digits.charAt(i), 10);
        if (double) { digit *= 2; if (digit > 9) { digit -= 9; } }
        sum += digit;
        double = !double;
      }
      return sum % 10 === 0;
    },

    /* MM/YY, month 01-12, not earlier than the current month */
    cardExpiry: function (value) {
      const match = /^(0[1-9]|1[0-2])\/([0-9]{2})$/.exec(value);
      if (!match) { return false; }
      const now = new Date();
      const year = 2000 + parseInt(match[2], 10);
      const month = parseInt(match[1], 10);
      return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
    },

    /* South African postal codes have four digits */
    postalCode: function (value) { return /^[0-9]{4}$/.test(value); },

    /* Names: letters, spaces, apostrophes, hyphens and full stops only */
    personName: function (value) { return /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F '.\-]*$/.test(value); }
  };

  const customRules = {
    'sa-phone': { test: rules.saPhone, message: 'Enter a South African number such as 012 804 5521 or +27 71 234 5678.' },
    'card-number': { test: rules.luhn, message: 'Enter a valid card number (13 to 19 digits).' },
    'card-expiry': { test: rules.cardExpiry, message: 'Enter a future expiry date as MM/YY.' },
    'postal-code': { test: rules.postalCode, message: 'Enter a four digit postal code.' },
    'person-name': { test: rules.personName, message: 'Use letters, spaces, hyphens and apostrophes only.' }
  };

  /* ---------- Helpers ---------- */
  function labelOf(field) {
    return field.dataset.label || field.name || 'This field';
  }

  function groupOf(field) {
    return field.closest('.form__group');
  }

  function errorElementFor(field) {
    const group = groupOf(field);
    return group ? group.querySelector('.form__error') : null;
  }

  /* Returns an error message for one field, or an empty string if it is valid */
  function messageFor(field) {
    const label = labelOf(field);
    const value = field.type === 'password' ? field.value : field.value.trim();

    if (field.type === 'checkbox') {
      return field.required && !field.checked ? (field.dataset.requiredMessage || 'Please tick this box to continue.') : '';
    }
    if (field.required && value === '') {
      return field.dataset.requiredMessage || label + ' is required.';
    }
    if (value === '') { return ''; }

    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return 'Enter a valid email address such as name@example.com.';
    }
    if (field.minLength > 0 && value.length < field.minLength) {
      return label + ' must be at least ' + field.minLength + ' characters (you have ' + value.length + ').';
    }
    if (field.maxLength > 0 && value.length > field.maxLength) {
      return label + ' must be ' + field.maxLength + ' characters or fewer.';
    }
    if (field.type === 'number') {
      const number = Number(value);
      if (Number.isNaN(number) || !/^-?\d+(\.\d+)?$/.test(value)) { return label + ' must be a number.'; }
      if (field.step !== 'any' && field.step && Number(field.step) % 1 === 0 && number % 1 !== 0) { return label + ' must be a whole number.'; }
      if (field.min !== '' && number < Number(field.min)) { return label + ' must be ' + field.min + ' or more.'; }
      if (field.max !== '' && number > Number(field.max)) { return label + ' must be ' + field.max + ' or less.'; }
    }
    if (field.type === 'date') {
      if (field.min && value < field.min) { return label + ' cannot be in the past.'; }
      if (field.max && value > field.max) { return label + ' is too far in the future.'; }
    }
    if (field.dataset.rule && customRules[field.dataset.rule] && !customRules[field.dataset.rule].test(value)) {
      return field.dataset.ruleMessage || customRules[field.dataset.rule].message;
    }
    if (field.pattern && !new RegExp('^(?:' + field.pattern + ')$').test(value)) {
      return field.dataset.patternMessage || 'Enter a valid ' + label.toLowerCase() + '.';
    }
    return '';
  }

  function showError(field, message) {
    const group = groupOf(field);
    const error = errorElementFor(field);
    if (!group || !error) { return; }
    group.classList.toggle('has-error', message !== '');
    error.textContent = message;
    if (message) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', error.id);
    } else {
      field.removeAttribute('aria-invalid');
    }
  }

  /* Validate a single field and show or clear its message */
  function validateField(field) {
    if (field.disabled || field.closest('[hidden]')) { showError(field, ''); return true; }
    const message = messageFor(field);
    showError(field, message);
    return message === '';
  }

  /* Radio groups: the group is valid when one option is selected */
  function validateRadioGroup(form, name) {
    const radios = Array.from(form.querySelectorAll('input[type="radio"][name="' + name + '"]')).filter(function (r) { return !r.disabled; });
    if (!radios.length) { return true; }
    const group = groupOf(radios[0]);
    const error = group ? group.querySelector('.form__error') : null;
    const valid = radios.some(function (radio) { return radio.checked; });
    if (group && error) {
      group.classList.toggle('has-error', !valid);
      error.textContent = valid ? '' : 'Please choose one option.';
    }
    return valid;
  }

  /* Validate a whole form. Focuses the first problem and returns true when everything is valid. */
  function validateForm(form) {
    let firstInvalid = null;
    const radioNames = new Set();

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      if (field.type === 'hidden' || field.type === 'submit' || field.classList.contains('honeypot')) { return; }
      if (field.closest('.honeypot')) { return; }
      if (field.type === 'radio') { radioNames.add(field.name); return; }
      if (!validateField(field) && !firstInvalid) { firstInvalid = field; }
    });

    radioNames.forEach(function (name) {
      if (!validateRadioGroup(form, name) && !firstInvalid) {
        firstInvalid = form.querySelector('input[type="radio"][name="' + name + '"]');
      }
    });

    if (firstInvalid) { firstInvalid.focus(); }
    return firstInvalid === null;
  }

  /* Check each field as the visitor leaves it, and re-check while fixing an error */
  function attach(form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('focusout', function (event) {
      const field = event.target;
      if (field.matches && field.matches('input:not([type="radio"]):not([type="hidden"]), select, textarea') && !field.closest('.honeypot')) {
        validateField(field);
      }
    });
    form.addEventListener('input', function (event) {
      const field = event.target;
      if (groupOf(field) && groupOf(field).classList.contains('has-error') && field.type !== 'radio') { validateField(field); }
    });
    form.addEventListener('change', function (event) {
      if (event.target.type === 'radio') { validateRadioGroup(form, event.target.name); }
    });
  }

  /* Live character counter for textareas that carry data-counter="id-of-counter" */
  function initCounters(root) {
    (root || document).querySelectorAll('textarea[data-counter]').forEach(function (area) {
      const counter = document.getElementById(area.dataset.counter);
      if (!counter) { return; }
      function update() { counter.textContent = area.value.length + ' / ' + area.maxLength + ' characters'; }
      area.addEventListener('input', update);
      update();
    });
  }

  /* Local date as YYYY-MM-DD (toISOString would shift the day for South Africa) */
  function localDate(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + (offsetDays || 0));
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  PAS.validation = {
    attach: attach,
    validateForm: validateForm,
    validateField: validateField,
    validateRadioGroup: validateRadioGroup,
    initCounters: initCounters,
    localDate: localDate,
    rules: rules
  };
})();
