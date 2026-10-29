/* ==========================================================================
   main.js - Behaviour shared by every page:
   mobile navigation, scroll reveal, tabs, accordion, toast messages
   and the "open now" indicator.
   ========================================================================== */
(function () {
  'use strict';

  const PAS = (window.PAS = window.PAS || {});

  /* ---------- Toast messages (created with DOM methods, never innerHTML) ---------- */
  let toastRegion = null;

  PAS.toast = function (message, linkHref, linkText) {
    if (!toastRegion) {
      toastRegion = document.createElement('div');
      toastRegion.className = 'toast-region';
      toastRegion.setAttribute('role', 'status');
      toastRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastRegion);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.appendChild(document.createTextNode(message));
    if (linkHref && linkText) {
      toast.appendChild(document.createTextNode(' '));
      const link = document.createElement('a');
      link.href = linkHref;
      link.textContent = linkText;
      toast.appendChild(link);
    }
    toastRegion.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add('is-leaving');
      window.setTimeout(function () { toast.remove(); }, 350);
    }, 3500);
  };

  /* ---------- Mobile navigation ---------- */
  function initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) { return; }

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) { setOpen(false); }
    });
  }

  /* ---------- Scroll reveal: elements below the fold fade in as they appear ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length || !('IntersectionObserver' in window)) { return; }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    items.forEach(function (item) {
      if (item.getBoundingClientRect().top > window.innerHeight) {
        item.classList.add('is-pending');
        observer.observe(item);
      }
    });
  }

  /* ---------- Tabs (WAI-ARIA pattern with arrow key support) ---------- */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
      const panels = Array.from(group.querySelectorAll('[role="tabpanel"]'));

      function select(tab, moveFocus) {
        tabs.forEach(function (item) {
          const active = item === tab;
          item.setAttribute('aria-selected', String(active));
          item.tabIndex = active ? 0 : -1;
        });
        panels.forEach(function (panel) {
          panel.hidden = panel.id !== tab.getAttribute('aria-controls');
        });
        if (moveFocus) { tab.focus(); }
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () { select(tab, false); });
        tab.addEventListener('keydown', function (event) {
          let target = null;
          if (event.key === 'ArrowRight') { target = tabs[(index + 1) % tabs.length]; }
          if (event.key === 'ArrowLeft') { target = tabs[(index - 1 + tabs.length) % tabs.length]; }
          if (event.key === 'Home') { target = tabs[0]; }
          if (event.key === 'End') { target = tabs[tabs.length - 1]; }
          if (target) { event.preventDefault(); select(target, true); }
        });
      });
    });
  }

  /* ---------- Accordion ---------- */
  function initAccordion() {
    document.querySelectorAll('.accordion__trigger').forEach(function (trigger) {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) { return; }

      trigger.addEventListener('click', function () {
        const open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));
        panel.classList.toggle('is-open', !open);
        panel.style.maxHeight = open ? '0px' : panel.scrollHeight + 'px';
      });
    });
    window.addEventListener('resize', function () {
      document.querySelectorAll('.accordion__panel.is-open').forEach(function (panel) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      });
    });
  }

  /* ---------- "Open now" indicator using South African time ---------- */
  function initOpenStatus() {
    const targets = document.querySelectorAll('[data-open-status]');
    if (!targets.length) { return; }

    /* Opening hours as minutes from midnight. 0 = Sunday. Public holidays are not detected. */
    const hours = {
      0: [9 * 60, 13 * 60],
      1: [8 * 60, 17 * 60 + 30], 2: [8 * 60, 17 * 60 + 30], 3: [8 * 60, 17 * 60 + 30],
      4: [8 * 60, 17 * 60 + 30], 5: [8 * 60, 17 * 60 + 30],
      6: [8 * 60, 14 * 60]
    };
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    let open = false;
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Johannesburg', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      const lookup = {};
      parts.forEach(function (part) { lookup[part.type] = part.value; });
      const minutes = (parseInt(lookup.hour, 10) % 24) * 60 + parseInt(lookup.minute, 10);
      const range = hours[days[lookup.weekday]];
      open = Boolean(range) && minutes >= range[0] && minutes < range[1];
    } catch (error) {
      return;   // Intl not available: leave the static hours list only
    }

    targets.forEach(function (target) {
      target.textContent = open ? 'Open now' : 'Closed now';
      target.classList.toggle('status-pill--open', open);
      target.hidden = false;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initReveal();
    initTabs();
    initAccordion();
    initOpenStatus();
  });
})();
