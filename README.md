# Pretoria Auto Spares Hub Pty Ltd

Website for a family-owned car parts supplier in Silverton, Pretoria.

- **Student number:** ST10527278
- **Module:** WEDE5020 Portfolio of Evidence
- **Current stage:** Part 3 - Enhancing Functionality and SEO
- **Live site:** add the Netlify link here after deployment
- **Repository:** add the GitHub link here

---

## 1. About the website

Pretoria Auto Spares Hub sells genuine and aftermarket car parts to mechanics, taxi associations, Uber and Bolt drivers and private car owners. The site lets visitors browse and search parts, enquire about prices and availability, contact the business, find the shop on a map and pay for an order.

The site is plain HTML, CSS and JavaScript. There is no build step and no framework.

## 2. Pages

| Page | File | Purpose |
| --- | --- | --- |
| Home | `index.html` | Business summary, opening hours with an "open now" indicator, popular parts, category links |
| Products/Services | `products-services.html` | Tabs for products and services, parts gallery with lightbox |
| Parts | `parts.html` | Product listings loaded with JavaScript, with search, filter and sort, quick view and add to cart |
| About Us | `about-us.html` | Business story and target audience |
| Enquiry | `enquiry.html` | Validated enquiry form that returns a cost and availability response and submits with AJAX |
| Contact | `contact.html` | Contact details, validated message form compiled into an email, interactive map, FAQ accordion |
| Cart and Payment | `payment.html` | Cart with quantity controls, cost of each item, delivery, VAT, total and a validated payment form |
| Not found | `404.html` | Friendly error page (Netlify serves this automatically) |

## 3. Part 3 requirements and where they are done

### 2.1 Interactive elements
| Requirement | Implementation |
| --- | --- |
| Accordions, tabs or modals | Tabs on `products-services.html`, accordion (FAQ) on `contact.html`, quick view modal on `parts.html`. Written in `js/main.js` and `js/parts.js` using plain JavaScript with ARIA attributes and keyboard support. |
| Interactive map | Leaflet with OpenStreetMap tiles on `contact.html` (`js/map.js`). Includes a marker and popup, reset and zoom buttons and a directions link. If the map cannot load, the address is shown instead. |
| Animations and transitions | CSS transitions on buttons, cards, tabs, accordion, modal and lightbox. Page load animation on the hero, scroll reveal (`js/main.js`) and a bump animation on the cart counter. All motion is switched off for visitors who set "reduce motion". |
| Advanced DOM manipulation | Product cards, cart rows, quote tables, toasts, the modal and the lightbox are created with `createElement`, `append`, `replaceChildren` and `DocumentFragment`. Event delegation is used on product grids and the cart. No user input is inserted with `innerHTML`. |
| Gallery with lightbox | `products-services.html` and `js/gallery.js`. Next, previous and close buttons, arrow keys, Escape, and focus returns to the thumbnail. |

### 2.2 Dynamic content
| Requirement | Implementation |
| --- | --- |
| Load product listings with JavaScript | The catalogue lives in `js/products.js`. `js/parts.js` builds the cards on `parts.html` and the featured parts on `index.html`. |
| Search, filter and sort | Live search (name, category, description and keywords), category filter, and sort by name or price on `parts.html`. Links such as `parts.html?category=Electrical` open a filtered view. |

### 3.1 On-page SEO
- **Keyword research:** see section 5.
- **Title tags and meta descriptions:** every page has a unique title and description written around the keywords.
- **Header tags:** one `h1` per page, with `h2` and `h3` used in order.
- **Image optimisation:** descriptive file names (for example `brake-pads.jpg`), meaningful `alt` text, `width` and `height` attributes, lazy loading, and large images resized.
- **URL structure:** lowercase, hyphenated names such as `products-services.html` and `about-us.html`.
- **Internal linking:** header and footer navigation on every page, plus links in the page content (category links, calls to action, FAQ answers).
- **Mobile friendliness:** mobile first CSS, viewport meta tag, hamburger menu, and layouts checked at 375px, 768px and 1280px widths.
- **Extras:** canonical links, Open Graph tags, `lang="en-ZA"`, and schema.org `AutoPartsStore` structured data on the home and contact pages.

### 3.2 Off-page SEO (plan)
These activities happen outside the code, so they are listed as the plan for the business.
- **Backlinks:** ask the local taxi associations and workshops the business supplies to link to the site, list the business on South African business directories, and link to the site from the Instagram profile.
- **Social media:** keep the Instagram account linked in the footer and contact page, and share new parts and delivery offers there with a link back to `parts.html`.
- **Local SEO:** the address, phone number and opening hours match on every page and in the structured data. Next step is to claim a Google Business Profile for the Silverton address using the same details.

### 3.3 Additional requests
| Requirement | Implementation |
| --- | --- |
| robots.txt | `robots.txt` allows crawling and points to the sitemap. `payment.html` and `404.html` use `noindex`. |
| sitemap.xml | `sitemap.xml` lists the public pages. |
| Page speed | Images resized (the logo went from about 220 KB to 65 KB, the spark plug photo from 245 KB to 52 KB), lazy loading, `defer` on every script, no large libraries, cache headers in `netlify.toml`. |
| Security | Content Security Policy on every page, security headers in `netlify.toml`, `rel="noopener noreferrer"` on external links, output written with `textContent`, honeypot field on the enquiry form, and card details never stored or sent. |

### 4.1 Forms and validation
| Requirement | Implementation |
| --- | --- |
| `enquiry.html` form | Full name, email, South African phone number, enquiry type, part, quantity, vehicle, delivery or collection, delivery area, date, reply method and message. After validation the page shows a response with the part cost, delivery fee, availability and delivery notes. |
| `contact.html` form | Name, email, optional phone, type of message, reply method and a full message. After validation the details are compiled into an email preview and a Send email button opens the visitor's email app addressed to the recipient set in `js/products.js` (`PAS.config.contactEmail`). |
| Form elements | `input`, `select`, `textarea`, radio buttons, and date and number inputs. |
| HTML5 validation | `required`, `type`, `min`, `max`, `step`, `minlength`, `maxlength` and `pattern` attributes. |
| Specific formats | South African phone numbers, dates not in the past, vehicle year range, quantity range, card number (Luhn check), card expiry and four digit postal code. |
| Form submission | The `action` attribute is set on every form (`mailto:` for contact, FormSubmit for enquiry). |
| Client-side validation and error handling | `js/validation.js` checks fields on blur and on submit, shows a message under each field, marks the field with `aria-invalid`, and moves focus to the first problem. |
| AJAX form submission | `enquiry.html` sends the enquiry with `fetch` (see `js/forms.js`) to the FormSubmit AJAX endpoint without reloading the page, and shows a sending, success or failure message. |

### Payment page
`payment.html` and `js/payment.js` calculate the cost of every item:
- Line total = price x quantity, with plus, minus and remove buttons.
- Shelf prices include 15% VAT, so the VAT portion is shown inside the total.
- Collection is free. Delivery is a flat R99 and free once the order reaches R1 500 (both set in `js/products.js`).
- Cash is only offered when collecting.
- Card number, expiry and security code are validated in the browser. This is a demonstration checkout: no payment is taken and nothing is stored.
- The cart is kept in `localStorage` as product ids and quantities only.

## 4. Project structure

```
pretoria-auto-spares-hub/
|-- index.html
|-- products-services.html
|-- parts.html
|-- about-us.html
|-- enquiry.html
|-- contact.html
|-- payment.html
|-- 404.html
|-- robots.txt
|-- sitemap.xml
|-- netlify.toml
|-- README.md
|-- css/
|   `-- style.css          (one stylesheet, 19 numbered sections, see its contents list)
|-- js/
|   |-- products.js        (settings and product catalogue)
|   |-- cart.js            (cart storage and totals)
|   |-- main.js            (navigation, tabs, accordion, reveal, toast, open now)
|   |-- parts.js           (product cards, search, filter, sort, quick view)
|   |-- gallery.js         (gallery and lightbox)
|   |-- map.js             (Leaflet map)
|   |-- validation.js      (shared form validation)
|   |-- forms.js           (contact and enquiry forms)
|   `-- payment.js         (cart review and checkout)
`-- images/                (logos, product photos, backgrounds)
```

## 5. Keywords used

| Keyword | Where it appears |
| --- | --- |
| auto spares Pretoria | Home title, headings and description |
| car parts Pretoria | Products/Services and Parts titles and headings |
| brake pads, car battery, oil filter | Parts page, image names and alt text |
| Silverton auto parts | Contact page, footer and structured data |
| same day delivery Pretoria | Home page, FAQ and enquiry page |
| taxi spares, bakkie parts | Products/Services page |
| trade accounts for mechanics | Home page, FAQ and enquiry page |

## 6. Running and deploying

**Run locally:** open the folder in VS Code and start Live Server on `index.html`, or run `python -m http.server` in the folder and open `http://localhost:8000`.

**Deploy on Netlify (free):**
1. Push the project to GitHub.
2. In Netlify choose Add new site, then Import an existing project, and pick the repository.
3. Leave the build command empty and set the publish directory to `.`.
4. After the site is live, replace the placeholder address `https://pretoria-auto-spares-hub.netlify.app` with the real one in `sitemap.xml`, `robots.txt` and the `canonical` and `og:` tags (search the project for the placeholder).
5. Submit the sitemap in Google Search Console.

**Enquiry form email:** the first enquiry sent from the live site makes FormSubmit email the owner a one-time activation link. After that, enquiries arrive by email.

## 7. Changelog

All dates are in 2026. Newest first.

### Part 3 - 29 October

**Added**
- `enquiry.html` with a validated enquiry form, an instant cost and availability response and AJAX submission.
- `payment.html` with a working cart, per-item cost, delivery and VAT calculation, and a validated payment form.
- Product catalogue in `js/products.js` and a working Add to Cart button on every part.
- Search, category filter and sort on the Parts page, plus a quick view modal.
- Tabs on Products/Services, FAQ accordion and interactive map on Contact, gallery with lightbox.
- Contact form that compiles a validated message into an email.
- SEO files: `robots.txt`, `sitemap.xml`, canonical links, Open Graph tags, structured data.
- `404.html`, `netlify.toml` and `.gitignore`.
- Mobile menu, skip link, visible keyboard focus and reduced motion support.

**Changed**
- Rebuilt `css/style.css` into one documented file with a contents list, design tokens (the existing black and orange colours are now variables), mobile first breakpoints and consistent class names.
- Renamed pages to clean URLs: `about_us.html` is now `about-us.html`, `stock.html` is now `products-services.html` and `contacts.html` is now `contact.html`.
- Renamed images to descriptive names: for example `oil_filter.jpg` is now `oil-filter.jpg`, `battery.jpg` is now `car-battery.jpg`, `websiteBackgroung3.jpg` is now `background-dark-gold.jpg` and the WhatsApp logo file is now `pretoria-auto-spares-hub-logo.jpg`.
- Resized and compressed the images for faster loading.
- Home page opening hours now show an open or closed status using South African time.

### Corrections to the Part 1 and Part 2 work

- **Image paths:** changed backslashes (`images\oil_filter.jpg`) to forward slashes. Backslash paths work on Windows but break on Netlify and other web servers.
- **Class names:** replaced `navbar`, `logoText`, `Text`, `btn-parts` and similar mixed-case names with consistent lowercase names (`site-header`, `site-nav`, `hero`, `panel`, `btn`).
- **CSS clean-up:** removed the duplicate `.parts-container` rules and the unused `.location-card` and `.main-title` rules, and moved the inline styles on the logo into the stylesheet.
- **Broken HTML:** fixed the footer `<div class="footer"` tag that was missing its closing `>` on the About Us and Contact pages.
- **Lists:** `<li>` items that sat outside a `<ul>` are now inside proper lists, and the audience list is no longer nested inside a paragraph.
- **Links:** removed the meaningless `alt="wyhd"` attribute from links. Links now use `aria-current` for the current page and descriptive text.
- **Accessibility:** added `lang="en-ZA"`, a skip link, labelled navigation, descriptive image `alt` text and `width` and `height` on images.
- **Spelling:** corrected "sevice", "Mecahnics", "compatability" and "wiperblades", and added spaces after full stops in the tagline.
- **Layout:** one header navigation per page with footer links, instead of the same navigation bar repeated above and below the content.
- **Responsiveness:** replaced the conflicting grid rules with one mobile first set, so the parts grid goes from one column on phones to two on tablets and three on desktops.
- **Page titles:** each page now has its own title instead of the same title on every page.
- **Duplicate files:** removed the second copy of the project that was nested inside the project folder.

## 8. References

The sources below were used for the techniques and libraries in this project.

- Google Search Central (n.d.) *SEO Starter Guide*. Available at: https://developers.google.com/search/docs/fundamentals/seo-starter-guide (Accessed: 29 October 2026).
- Leaflet (n.d.) *Leaflet: an open-source JavaScript library for interactive maps*. Available at: https://leafletjs.com (Accessed: 29 October 2026).
- Netlify (n.d.) *Netlify Docs: file-based configuration and headers*. Available at: https://docs.netlify.com (Accessed: 29 October 2026).
- Mozilla (n.d.) *MDN Web Docs: Client-side form validation*. Available at: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation (Accessed: 29 October 2026).
- Mozilla (n.d.) *MDN Web Docs: Using the Fetch API*. Available at: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch (Accessed: 29 October 2026).
- Mozilla (n.d.) *MDN Web Docs: Content Security Policy (CSP)*. Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP (Accessed: 29 October 2026).
- OpenStreetMap contributors (n.d.) *OpenStreetMap*. Available at: https://www.openstreetmap.org (Accessed: 29 October 2026).
- Schema.org (n.d.) *AutoPartsStore*. Available at: https://schema.org/AutoPartsStore (Accessed: 29 October 2026).
- W3C (n.d.) *WAI-ARIA Authoring Practices Guide: Tabs pattern*. Available at: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ (Accessed: 29 October 2026).
- FormSubmit (n.d.) *FormSubmit documentation*. Available at: https://formsubmit.co (Accessed: 29 October 2026).

Keep the Part 1 and Part 2 references and add the ones above to your final reference list.
