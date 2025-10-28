(() => {
  'use strict';

  // Data
  const CARS = [
    { id:'accent', name:'Hyundai Accent', image:'img/ACCENT.jpg', pricePerDay:45, type:'Sedan', seats:5, doors:4, transmission:'Automatic' },
    { id:'clio4', name:'Renault Clio 4',  image:'img/CLIO4.jpg', pricePerDay:40, type:'Hatchback', seats:5, doors:4, transmission:'Manual' },
    { id:'q3',    name:'Audi Q3',         image:'img/Q3.jpg',    pricePerDay:90, type:'SUV', seats:5, doors:4, transmission:'Automatic' },
    { id:'q8',    name:'Audi Q8',         image:'img/Q8.jpg',    pricePerDay:160,type:'SUV', seats:5, doors:4, transmission:'Automatic' },
    { id:'tucson',name:'Hyundai Tucson',  image:'img/TUCSON.jpg',pricePerDay:75, type:'SUV', seats:5, doors:4, transmission:'Automatic' }
  ];

  // Utils
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Currency: convert base EUR prices to MAD
  const CURRENCY = {
    EUR_TO_MAD: 10.8,
    toMAD(eur){ return Math.round(eur * this.EUR_TO_MAD); },
    formatMAD(mad){ return new Intl.NumberFormat('en-MA', { style:'currency', currency:'MAD', maximumFractionDigits:0 }).format(mad); }
  };

  const focusableSelectors = [
    'a[href]','area[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function trapFocus(container) {
    const focusEls = () => $$(focusableSelectors, container).filter(el => el.offsetParent !== null || container === el);
    function onKeydown(e){
      if(e.key !== 'Tab') return;
      const els = focusEls();
      if(!els.length) return;
      const first = els[0], last = els[els.length - 1];
      const active = document.activeElement;
      if(e.shiftKey){
        if(active === first || !container.contains(active)){
          last.focus();
          e.preventDefault();
        }
      } else {
        if(active === last){
          first.focus();
          e.preventDefault();
        }
      }
    }
    container.addEventListener('keydown', onKeydown);
    return () => container.removeEventListener('keydown', onKeydown);
  }

  // Debounce
  const debounce = (fn, wait=150) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  };

  // NavMenu
  const NavMenu = (() => {
    let panel, overlay, toggleBtn, restoreFocusTo, untrap;
    function open(){
      panel.hidden = false; overlay.hidden = false;
      requestAnimationFrame(() => { panel.setAttribute('open',''); });
      toggleBtn.setAttribute('aria-expanded','true');
      document.documentElement.style.overflow = 'hidden';
      restoreFocusTo = document.activeElement;
      untrap = trapFocus(panel);
      const first = panel.querySelector(focusableSelectors);
      first && first.focus();
    }
    function close(){
      panel.removeAttribute('open');
      toggleBtn.setAttribute('aria-expanded','false');
      document.documentElement.style.overflow = '';
      setTimeout(() => { panel.hidden = true; overlay.hidden = true; }, 200);
      untrap && untrap();
      restoreFocusTo && restoreFocusTo.focus();
    }
    function init(){
      panel = $('#mobile-panel'); overlay = $('.mobile-overlay'); toggleBtn = $('.nav-toggle');
      if(!panel || !overlay || !toggleBtn) return;
      toggleBtn.addEventListener('click', () => open());
      overlay.addEventListener('click', (e) => { if(e.target.dataset.close === 'panel') close(); });
      panel.addEventListener('click', (e) => { if(e.target && e.target.dataset.close === 'panel') close(); });
      panel.addEventListener('keydown', (e) => { if(e.key === 'Escape') close(); });
      $$('.mobile-list a', panel).forEach(a => a.addEventListener('click', close));
    }
    return { init };
  })();

  // HeroSlider: CSS-driven; ensure reduced motion respect by toggling classes if needed
  const HeroSlider = (() => {
    function init(){ /* CSS handles animation; nothing required */ }
    return { init };
  })();

  // Lightbox
  const Lightbox = (() => {
    let lb, dialog, img, title, specs, price, btnPrev, btnNext, btnBook, backdrop, currentIndex = 0, untrap, restoreFocusTo;
    function render(idx){
      const car = CARS[idx]; if(!car) return;
      img.src = car.image; img.alt = car.name;
      title.textContent = car.name;
      specs.textContent = `${car.type} | ${car.seats} seats | ${car.doors} doors | ${car.transmission}`;
      price.textContent = `${CURRENCY.formatMAD(CURRENCY.toMAD(car.pricePerDay))}/day`;
      btnBook.href = `contact/index.html`;
      btnBook.setAttribute('data-car', car.id);
    }
    function show(idx){
      currentIndex = (idx + CARS.length) % CARS.length;
      if(lb.hidden){
        lb.hidden = false; requestAnimationFrame(() => lb.classList.add('open'));
        document.documentElement.style.overflow = 'hidden';
        render(currentIndex);
        restoreFocusTo = document.activeElement;
        untrap = trapFocus(dialog);
        dialog.focus();
      } else {
        render(currentIndex);
      }
    }
    function hide(){
      lb.classList.remove('open');
      document.documentElement.style.overflow = '';
      setTimeout(() => { lb.hidden = true; }, 150);
      untrap && untrap();
      restoreFocusTo && restoreFocusTo.focus();
    }
    function next(){ show((currentIndex + 1) % CARS.length); }
    function prev(){ show((currentIndex - 1 + CARS.length) % CARS.length); }
    function onKey(e){
      if(lb.hidden) return;
      if(e.key === 'Escape') hide();
      if(e.key === 'ArrowRight') next();
      if(e.key === 'ArrowLeft') prev();
    }
    function init(){
      lb = $('#lightbox'); dialog = $('.lightbox-dialog', lb); img = $('#lightboxImage'); title = $('#lightboxTitle'); specs = $('.car-specs', lb); price = $('.car-price', lb); btnPrev = $('[data-prev]', lb); btnNext = $('[data-next]', lb); btnBook = $('#lightboxBook', lb); backdrop = $('.lightbox-backdrop', lb);
      if(!lb) return;
      dialog.setAttribute('tabindex','-1');
      $('[data-close="lightbox"]', lb).addEventListener('click', hide);
      backdrop.addEventListener('click', hide);
      btnNext.addEventListener('click', next);
      btnPrev.addEventListener('click', prev);
      document.addEventListener('keydown', onKey);
    }
    return { init, show };
  })();

  // Gallery
  const Gallery = (() => {
    function card(car, index){
      const el = document.createElement('article');
      el.className = 'card car-card';
      el.innerHTML = `
        <div class="car-media">
          <img src="${car.image}" alt="${car.name}" loading="lazy" decoding="async" />
        </div>
        <div class="car-body">
          <h3 class="car-name">${car.name}</h3>
          <div class="chips">\n            <span class="chip" aria-label="${car.seats} seats">Seats: ${car.seats}</span>\n            <span class="chip" aria-label="${car.doors} doors">Doors: ${car.doors}</span>\n            <span class="chip" aria-label="${car.transmission}">Trans: ${car.transmission}</span>\n          </div>
          <div class="car-actions">
            <span class="price">${CURRENCY.formatMAD(CURRENCY.toMAD(car.pricePerDay))}/day</span>
            <button class="btn secondary" data-index="${index}">Details / Book</button>
          </div>
        </div>`;
      // Enhanced media UI: price badge and hover CTA; update alt/chips
      (() => {
        const media = el.querySelector('.car-media');
        const img = media && media.querySelector('img');
        if (img) {
          img.alt = `${car.name} - ${car.type}`;
          img.setAttribute('sizes', '(min-width: 900px) 33vw, 100vw');
        }
        if (media) {
          const badge = document.createElement('span');
          badge.className = 'price-badge';
          const priceMAD = CURRENCY.formatMAD(CURRENCY.toMAD(car.pricePerDay));
          badge.textContent = `${priceMAD}/day`;
          badge.setAttribute('aria-label', `${priceMAD} per day`);
          media.appendChild(badge);
          const cta = document.createElement('button');
          cta.className = 'media-cta';
          cta.type = 'button';
          cta.setAttribute('aria-label', `View ${car.name} details`);
          cta.dataset.index = String(index);
          cta.textContent = 'Details / Book';
          media.appendChild(cta);
        }
        const chips = el.querySelector('.chips');
        if (chips) {
          chips.innerHTML = `
            <span class=\"chip\" aria-label=\"${car.seats} seats\">Seats: ${car.seats}</span>
            <span class=\"chip\" aria-label=\"${car.doors} doors\">Doors: ${car.doors}</span>
            <span class=\"chip\" aria-label=\"${car.transmission}\">Trans: ${car.transmission}</span>
          `;
        }
      })();
      el.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if(btn){ Lightbox.show(index); }
        else { Lightbox.show(index); }
      });
      el.addEventListener('keypress', (e) => { if(e.key === 'Enter') Lightbox.show(index); });
      el.setAttribute('tabindex','0');
      return el;
    }
    function render(){
      const grid = $('#fleet-grid');
      grid.innerHTML = '';
      CARS.forEach((car, idx) => {
        const el = card(car, idx);
        el.classList.add('reveal');
        el.style.transitionDelay = `${Math.min(idx * 80, 240)}ms`;
        grid.appendChild(el);
      });
    }
    return { render };
  })();

  // Pricing table + calculator
  const PriceCalculator = (() => {
    const EXTRAS_EUR = { gps:5, seat:5, driver:10 };
    let form, selCar, totalEl;
    function populate(){
      selCar.innerHTML = '<option value="" disabled selected>Select...</option>' + CARS.map(c => {
        const mad = CURRENCY.formatMAD(CURRENCY.toMAD(c.pricePerDay));
        return `<option value="${c.id}">${c.name} (${mad}/day)</option>`;
      }).join('');
    }
    function populateTable(){
      const tbody = $('#pricing-rows');
      tbody.innerHTML = CARS.map(c => {
        const mad = CURRENCY.formatMAD(CURRENCY.toMAD(c.pricePerDay));
        return `
        <tr>
          <th scope="row">${c.name}</th>
          <td>${c.type}</td>
          <td>${c.transmission}</td>
          <td>${mad}</td>
        </tr>`;
      }).join('');
      // Update extras labels to MAD
      const labels = {
        gps: CURRENCY.formatMAD(CURRENCY.toMAD(EXTRAS_EUR.gps)),
        seat: CURRENCY.formatMAD(CURRENCY.toMAD(EXTRAS_EUR.seat)),
        driver: CURRENCY.formatMAD(CURRENCY.toMAD(EXTRAS_EUR.driver))
      };
      Object.entries(labels).forEach(([k,v]) => {
        const el = document.querySelector(`[data-extra-label="${k}"]`);
        if(el) el.textContent = v;
      });
    }
    function getPricePerDay(id){
      const car = CARS.find(c => c.id === id); return car ? car.pricePerDay : 0;
    }
    function calc(){
      const data = new FormData(form);
      const id = data.get('car');
      const days = Math.max(1, parseInt(data.get('days') || '1', 10));
      const baseMAD = CURRENCY.toMAD(getPricePerDay(id)) * days;
      const extrasPerDayEUR = (data.get('gps')?EXTRAS_EUR.gps:0) + (data.get('seat')?EXTRAS_EUR.seat:0) + (data.get('driver')?EXTRAS_EUR.driver:0);
      const extrasMAD = CURRENCY.toMAD(extrasPerDayEUR) * days;
      const total = baseMAD + extrasMAD;
      totalEl.textContent = CURRENCY.formatMAD(total);
    }
    function init(){
      form = $('#price-calculator'); selCar = $('#calc-car'); totalEl = $('#calc-total');
      if(!form) return;
      populate(); populateTable(); calc();
      form.addEventListener('input', calc);
    }
    return { init };
  })();

  // Booking form
  const BookingForm = (() => {
    let form, success, printBtn, sel;
    function validate(){
      let valid = true;
      $$('input, select', form).forEach(el => {
        if(el.hasAttribute('required') && !el.value){ valid = false; el.setAttribute('aria-invalid','true'); }
        else el.removeAttribute('aria-invalid');
      });
      return valid;
    }
    function openMailto(){
      const name = (form.elements['name'] && form.elements['name'].value) || '';
      const phone = (form.elements['phone'] && form.elements['phone'].value) || '';
      const date = (form.elements['date'] && form.elements['date'].value) || '';
      const time = (form.elements['time'] && form.elements['time'].value) || '';
      const days = (form.elements['days'] && form.elements['days'].value) || '';
      const carId = (form.elements['car'] && form.elements['car'].value) || '';
      const car = (carId && (CARS.find(c => c.id === carId)?.name || carId)) || '';
      const subject = `Booking Request: ${car || 'Car'} on ${date}`.trim();
      const lines = [
        'Booking request from BELINA CAR website',
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Pickup Date: ${date}`,
        `Pickup Time: ${time}`,
        `Days: ${days}`,
        `Car: ${car}`,
        '',
        'Please confirm availability and total price. Thank you.'
      ];
      const body = encodeURIComponent(lines.join('\n'));
      const href = `mailto:booking@belinacar.it.com?subject=${encodeURIComponent(subject)}&body=${body}`;
      const a = document.createElement('a');
      a.href = href;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 0);
    }
    function setCarFromLightbox(){
      // If lightbox book clicked with data-car
      document.addEventListener('click', (e) => {
        const a = e.target.closest('#lightboxBook');
        if(a){ const id = a.getAttribute('data-car'); if(id) { sel.value = id; sel.dispatchEvent(new Event('input')); } }
      });
    }
    function populate(){
      sel.innerHTML = '<option value="" disabled selected>Select...</option>' + CARS.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    function init(){
      form = $('#booking-form'); success = $('#booking-success'); printBtn = $('#print-btn'); sel = $('#booking-car');
      if(!form) return;
      populate(); setCarFromLightbox();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!validate()) { form.reportValidity && form.reportValidity(); return; }
        openMailto();
        success.hidden = false; success.focus && success.focus();
        success.scrollIntoView({ behavior:'smooth', block:'center' });
      });
      printBtn.addEventListener('click', () => window.print());
    }
    return { init };
  })();

  // Smooth scroll and minor behaviors
  function smoothNav(){
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if(id && id.length > 1){
          const target = document.getElementById(id.slice(1));
          if(target){ e.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); }
        }
      });
    });
  }

  // Stars rating init from data-rating
  function initStars(){
    $$('.stars').forEach(s => {
      const r = parseFloat(s.dataset.rating || '5');
      s.style.setProperty('--rating', r);
      s.setAttribute('aria-label', `${r} out of 5 stars`);
    });
  }

  // Footer year
  function setYear(){ const y=$('#year'); if(y) y.textContent = new Date().getFullYear(); }
  function setPPDate(){ const t=$('#pp-date'); if(t){ const d=new Date(); t.textContent = d.toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'2-digit' }); } }

  // Resize handling (placeholder for future responsive recalcs)
  window.addEventListener('resize', debounce(() => {}, 200));

  // Animated counters for Why Us
  const StatsCounters = (() => {
    let observed = false, io;
    function animate(el){
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const target = parseInt(el.getAttribute('data-target') || '0', 10);
      const suffix = el.getAttribute('data-suffix') || '';
      if(!Number.isFinite(target)) return;
      if(prefersReduced) { el.textContent = String(target) + suffix; return; }
      const start = performance.now();
      const dur = 1200;
      const from = 0;
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(from + (target - from) * eased);
        el.textContent = String(val) + suffix;
        if(t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    function init(){
      if(observed) return; observed = true;
      const nodes = $$('.counter'); if(!nodes.length) return;
      io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if(entry.isIntersecting){ animate(entry.target); io.unobserve(entry.target); }
        });
      }, { threshold: 0.35 });
      nodes.forEach(n => io.observe(n));
    }
    return { init };
  })();

  // Scroll effects: header shrink and reveal animations
  const ScrollEffects = (() => {
    let header, io, hero, heroContent, rAF = 0;
    function onScroll(){
      if(header) header.classList.toggle('scrolled', window.scrollY > 8);
      // very light parallax for hero content
      if(hero && heroContent){
        if(rAF) return; // throttle with rAF
        rAF = requestAnimationFrame(() => {
          rAF = 0;
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if(prefersReduced) { heroContent.style.transform = ''; return; }
          const rect = hero.getBoundingClientRect();
          const viewportH = window.innerHeight || document.documentElement.clientHeight;
          if(rect.bottom <= 0 || rect.top >= viewportH){ heroContent.style.transform = ''; return; }
          const progress = Math.min(Math.max((0 - rect.top) / Math.max(rect.height, 1), 0), 1);
          const shift = Math.round(progress * 24); // max 24px shift
          heroContent.style.transform = `translateY(${shift}px)`;
        });
      }
      // scroll progress bar
      const doc = document.documentElement;
      const max = Math.max(doc.scrollHeight - doc.clientHeight, 1);
      const p = Math.max(0, Math.min(1, window.scrollY / max));
      doc.style.setProperty('--scroll', (p * 100).toFixed(2) + '%');
    }
    function setupReveal(){
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(prefersReduced) return;
      io = new IntersectionObserver(entries => {
        for(const entry of entries){
          if(entry.isIntersecting){
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        }
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    }
    function init(){
      header = document.querySelector('.site-header');
      hero = document.querySelector('.hero');
      heroContent = document.querySelector('.hero-content');
      onScroll();
      window.addEventListener('scroll', onScroll, { passive:true });
      setupReveal();
    }
    return { init };
  })();

  // Page transitions: fade/slide between internal pages
  const PageTransitions = (() => {
    let leaving = false;
    function isInternal(a){
      const href = a.getAttribute('href') || '';
      if(href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
      if(a.target === '_blank' || a.hasAttribute('download') || (a.rel||'').includes('external')) return false;
      // Treat relative links and same-origin http(s) as internal
      try { return new URL(a.href).origin === location.origin; } catch { return !/^https?:\/\//i.test(href); }
    }
    function onClick(e){
      const a = e.target.closest && e.target.closest('a[href]');
      if(!a) return;
      if(!isInternal(a)) return;
      e.preventDefault();
      if(leaving) return;
      leaving = true;
      document.body.classList.add('page-leave');
      const go = () => { location.href = a.href; };
      const onEnd = () => { document.removeEventListener('transitionend', onEnd); go(); };
      document.addEventListener('transitionend', onEnd);
      setTimeout(go, 260); // fallback
    }
    function onLoad(){
      // kick off entry animation if class present
      if(document.body.classList.contains('page-enter')){
        requestAnimationFrame(() => {
          document.body.classList.add('page-enter-active');
          setTimeout(() => {
            document.body.classList.remove('page-enter');
            document.body.classList.remove('page-enter-active');
          }, 380);
        });
      }
    }
    function init(){
      onLoad();
      document.addEventListener('click', onClick, true);
    }
    return { init };
  })();

  // Button ripples (microinteraction)
  function initRipples(){
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(prefersReduced) return;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if(!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left) + 'px';
      const y = (e.clientY - rect.top) + 'px';
      btn.style.setProperty('--x', x);
      btn.style.setProperty('--y', y);
      const span = document.createElement('span');
      span.className = 'ripple';
      btn.appendChild(span);
      span.addEventListener('animationend', () => span.remove());
    });
  }

  // Subtle 3D tilt for car cards (desktop, respects reduced motion)
  function initTiltCards(){
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if(prefersReduced || !finePointer) return;
    const maxTilt = 6; // degrees
    document.querySelectorAll('.car-card').forEach(card => {
      let af = 0;
      function onMove(ev){
        if(af) return; af = requestAnimationFrame(() => {
          af = 0;
          const r = card.getBoundingClientRect();
          const cx = r.left + r.width/2;
          const cy = r.top + r.height/2;
          const dx = (ev.clientX - cx) / (r.width/2);
          const dy = (ev.clientY - cy) / (r.height/2);
          const rx = Math.max(Math.min(-dy * maxTilt, maxTilt), -maxTilt);
          const ry = Math.max(Math.min(dx * maxTilt, maxTilt), -maxTilt);
          card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
      }
      function reset(){ card.style.transform = ''; card.classList.remove('tilting'); }
      card.addEventListener('pointerenter', () => { card.classList.add('tilting'); });
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', reset);
      card.addEventListener('pointerdown', reset);
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    PageTransitions.init();
    NavMenu.init();
    HeroSlider.init();
    Lightbox.init();
    Gallery.render();
    // tag static blocks for reveal
    document.querySelectorAll('.section-header, .pricing-table, .extras, .contact-info, #booking-form, .faq, .reviews-grid .testimonial').forEach(el => el.classList.add('reveal'));
    PriceCalculator.init();
    BookingForm.init();
    smoothNav();
    initStars();
    setYear();
    setPPDate();
    ScrollEffects.init();
    StatsCounters.init();
    initRipples();
    initTiltCards();
  });
})();









