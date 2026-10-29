/* ==========================================================================
   gallery.js - Image gallery with a keyboard friendly lightbox.
   Thumbnails are <button class="gallery__button"> elements that carry
   data-full (image path) and data-caption (text under the large image).
   ========================================================================== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const buttons = Array.from(document.querySelectorAll('.gallery__button'));
    if (!buttons.length) { return; }

    let current = 0;
    let opener = null;

    /* Build the lightbox once and reuse it */
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');

    const figure = document.createElement('figure');
    figure.className = 'lightbox__figure';
    const image = document.createElement('img');
    image.className = 'lightbox__image';
    const caption = document.createElement('figcaption');
    caption.className = 'lightbox__caption';
    figure.append(image, caption);

    function control(className, label, text) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lightbox__control ' + className;
      button.textContent = text;
      button.setAttribute('aria-label', label);
      return button;
    }
    const closeButton = control('lightbox__close', 'Close image viewer', 'Close');
    const prevButton = control('lightbox__prev', 'Previous image', 'Previous');
    const nextButton = control('lightbox__next', 'Next image', 'Next');
    box.append(closeButton, prevButton, figure, nextButton);
    document.body.appendChild(box);

    function show(index) {
      current = (index + buttons.length) % buttons.length;
      const source = buttons[current];
      image.src = source.dataset.full;
      image.alt = source.querySelector('img').alt;
      caption.textContent = source.dataset.caption + ' (' + (current + 1) + ' of ' + buttons.length + ')';
    }

    function open(index, trigger) {
      opener = trigger;
      show(index);
      document.body.classList.add('no-scroll');
      box.classList.add('is-open');
      closeButton.focus();
    }

    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      if (opener) { opener.focus(); }
    }

    buttons.forEach(function (button, index) {
      button.addEventListener('click', function () { open(index, button); });
    });
    closeButton.addEventListener('click', close);
    prevButton.addEventListener('click', function () { show(current - 1); });
    nextButton.addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (event) { if (event.target === box) { close(); } });

    document.addEventListener('keydown', function (event) {
      if (!box.classList.contains('is-open')) { return; }
      if (event.key === 'Escape') { close(); }
      if (event.key === 'ArrowLeft') { show(current - 1); }
      if (event.key === 'ArrowRight') { show(current + 1); }
      if (event.key === 'Tab') {
        const focusable = [closeButton, prevButton, nextButton];
        const index = focusable.indexOf(document.activeElement);
        event.preventDefault();
        const next = event.shiftKey ? (index - 1 + focusable.length) % focusable.length : (index + 1) % focusable.length;
        focusable[next].focus();
      }
    });
  });
})();
