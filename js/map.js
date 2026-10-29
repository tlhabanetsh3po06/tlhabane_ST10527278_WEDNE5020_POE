/* ==========================================================================
   map.js - Interactive map on contact.html using Leaflet and OpenStreetMap.
   Leaflet is loaded from a CDN in contact.html. If it cannot load (offline or
   blocked), the address and a directions link are shown instead.
   ========================================================================== */
(function () {
  'use strict';

  /* Pin position for Silverton Industrial Park. Change these two numbers to move the pin. */
  const SHOP = { lat: -25.7536, lng: 28.3136, zoom: 15 };

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('map');
    if (!container) { return; }

    if (typeof window.L === 'undefined') {
      const message = document.createElement('p');
      message.className = 'map__fallback';
      message.textContent = 'The interactive map could not be loaded. Visit us at Silverton Industrial Park, 319 Pretoria Rd, Silverton, Pretoria, 0184, or use the directions link below.';
      container.appendChild(message);
      return;
    }

    const map = window.L.map(container, { scrollWheelZoom: false }).setView([SHOP.lat, SHOP.lng], SHOP.zoom);

    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    /* The popup content is built with DOM nodes, not an HTML string */
    const popup = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = 'Pretoria Auto Spares Hub';
    const address = document.createElement('div');
    address.textContent = '319 Pretoria Rd, Silverton, Pretoria, 0184';
    popup.append(name, address);

    window.L.marker([SHOP.lat, SHOP.lng], { title: 'Pretoria Auto Spares Hub' })
      .addTo(map)
      .bindPopup(popup)
      .openPopup();

    /* Scroll wheel zoom is switched on only after the visitor clicks the map,
       so the page can still be scrolled on touch screens and with a mouse wheel. */
    map.once('focus', function () { map.scrollWheelZoom.enable(); });

    const reset = document.getElementById('map-reset');
    const closer = document.getElementById('map-zoom-in');
    if (reset) { reset.addEventListener('click', function () { map.setView([SHOP.lat, SHOP.lng], SHOP.zoom); }); }
    if (closer) { closer.addEventListener('click', function () { map.setView([SHOP.lat, SHOP.lng], 18); }); }
  });
})();
