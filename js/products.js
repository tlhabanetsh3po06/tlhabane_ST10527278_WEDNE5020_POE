/* ==========================================================================
   products.js - Shared site settings and the product catalogue.
   Loaded before every other script. Edit prices, stock and settings here.
   ========================================================================== */
(function () {
  'use strict';

  const PAS = (window.PAS = window.PAS || {});

  /* Site-wide settings used by the shop, enquiry form and payment page */
  PAS.config = {
    businessName: 'Pretoria Auto Spares Hub Pty Ltd',
    contactEmail: 'tlhabanetshepo04@gmail.com',          // recipient used by contact.html
    enquiryEndpoint: 'https://formsubmit.co/ajax/tlhabanetshepo04@gmail.com', // AJAX endpoint for enquiry.html
    vatRate: 0.15,                // South African VAT; shelf prices already include VAT
    deliveryFee: 99,              // flat delivery fee in rand
    freeDeliveryFrom: 1500,       // delivery is free when the order total reaches this amount
    maxQuantityPerItem: 20,
    sameDayCutoffHour: 12,        // same day delivery for orders placed before 12:00
    sameDayAreas: ['Pretoria', 'Centurion', 'Mamelodi']
  };

  /* Product catalogue. "stock" is sample data for the project. */
  PAS.products = [
    {
      id: 'oil-filter',
      name: 'Oil Filter',
      category: 'Engine Parts',
      price: 299,
      stock: 24,
      image: 'images/oil-filter.jpg',
      width: 800,
      height: 540,
      alt: 'Spin-on oil filter for a petrol or diesel engine',
      description: 'Removes dirt and metal particles from engine oil so the engine stays protected between services.',
      keywords: 'service filter engine oil',
      featured: true
    },
    {
      id: 'brake-pads',
      name: 'Brake Pads',
      category: 'Brakes & Suspension',
      price: 850,
      stock: 12,
      image: 'images/brake-pads.jpg',
      width: 447,
      height: 447,
      alt: 'Set of brake pads for disc brakes',
      description: 'Friction pads that grip the brake disc to slow and stop the vehicle safely.',
      keywords: 'braking stopping disc safety',
      featured: true
    },
    {
      id: 'car-battery',
      name: 'Car Battery',
      category: 'Electrical',
      price: 1999,
      stock: 6,
      image: 'images/car-battery.jpg',
      width: 300,
      height: 238,
      alt: '12 volt car battery',
      description: 'A 12 volt battery that starts the engine and powers the electrical system.',
      keywords: 'starter power 12v electrical',
      featured: true
    },
    {
      id: 'headlight-assembly',
      name: 'Headlight Assembly',
      category: 'Body & Exterior',
      price: 1200,
      stock: 5,
      image: 'images/headlight-assembly.jpg',
      width: 554,
      height: 554,
      alt: 'Complete headlight assembly',
      description: 'Complete headlight unit for clear night driving. Confirm fitment for your model before ordering.',
      keywords: 'light lamp night body exterior',
      featured: false
    },
    {
      id: 'shock-absorber',
      name: 'Shock Absorber',
      category: 'Brakes & Suspension',
      price: 950,
      stock: 9,
      image: 'images/shock-absorber.jpg',
      width: 408,
      height: 490,
      alt: 'Shock absorber for a car suspension',
      description: 'Controls bounce and keeps the tyres in contact with the road for a stable, comfortable ride.',
      keywords: 'suspension ride damper',
      featured: false
    },
    {
      id: 'spark-plug',
      name: 'Spark Plug',
      category: 'Engine Parts',
      price: 10,
      stock: 80,
      image: 'images/spark-plug.webp',
      width: 800,
      height: 800,
      alt: 'Spark plug for a petrol engine',
      description: 'Ignites the fuel and air mixture in a petrol engine. Priced per plug.',
      keywords: 'ignition petrol engine tune up',
      featured: false
    }
  ];

  /* Look up one product by id */
  PAS.getProduct = function (id) {
    return PAS.products.find(function (p) { return p.id === id; }) || null;
  };

  /* Format a number as South African rand: R299, R1 999 or R1 999.50.
     Done by hand so the result is the same in every browser and language setting. */
  PAS.formatPrice = function (amount, forceCents) {
    const value = Number(amount) || 0;
    const showCents = forceCents || Math.round(value * 100) % 100 !== 0;
    const fixed = value.toFixed(showCents ? 2 : 0);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return 'R' + parts.join('.');
  };

  /* Short stock label shared by the catalogue and modal */
  PAS.stockInfo = function (product) {
    if (product.stock <= 0) { return { text: 'Out of stock', level: 'out' }; }
    if (product.stock <= 10) { return { text: 'Low stock: ' + product.stock + ' left', level: 'low' }; }
    return { text: 'In stock', level: 'ok' };
  };
})();
