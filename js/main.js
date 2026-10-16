(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* mobile menu */
  var burger = doc.querySelector('.burger'), menu = doc.getElementById('menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.classList.toggle('open', open);
    doc.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) setMenu(false); });
  }

  /* scroll progress line (transform only) */
  var prog = doc.querySelector('.prog'), ticking = false;
  function onScroll() {
    ticking = false;
    var h = doc.documentElement.scrollHeight - window.innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* reveal on scroll */
  var rv = doc.querySelectorAll('.rv-in');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* open / closed status, Melbourne time. Mon-Sat 9:00-18:00 */
  (function () {
    var els = doc.querySelectorAll('#status');
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var wd, hr, mi;
    try {
      var parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var map = {}; parts.forEach(function (p) { map[p.type] = p.value; });
      wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(map.weekday);
      hr = parseInt(map.hour, 10) % 24; mi = parseInt(map.minute, 10);
    } catch (e) { return; }
    if (wd < 0 || isNaN(hr)) return;
    var mins = hr * 60 + mi, open = wd !== 0 && mins >= 540 && mins < 1080, text;
    if (open) text = 'Open now, until 6:00 pm';
    else if (wd !== 0 && mins < 540) text = 'Closed, opens at 9:00 am today';
    else { var next = (wd === 6 || wd === 0) ? 1 : wd + 1; text = 'Closed, opens ' + days[next] + ' at 9:00 am'; }
    els.forEach(function (el) { el.dataset.open = open ? '1' : '0'; el.querySelector('span').textContent = text; });
    doc.querySelectorAll('.hours tr').forEach(function (tr) { if (parseInt(tr.dataset.d, 10) === wd) tr.classList.add('today'); });
  })();

  /* lightbox (work page) */
  var lb = doc.getElementById('lb');
  if (lb) {
    var lim = lb.querySelector('img'), lcap = lb.querySelector('figcaption'), last;
    function close() { lb.classList.remove('open'); doc.body.style.overflow = ''; if (last) last.focus(); }
    doc.querySelectorAll('.gi').forEach(function (b) {
      b.addEventListener('click', function () {
        last = b; lim.src = b.dataset.full; lim.alt = b.querySelector('img').alt; lcap.textContent = b.dataset.cap;
        lb.classList.add('open'); doc.body.style.overflow = 'hidden'; lb.querySelector('button').focus();
      });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('button')) close(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
  }

  /* GSAP moments */
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var hero = doc.querySelector('.hero');
  var spool = doc.querySelector('#spool .imp');

  if (hero && !reduce) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero h1 .l > span', { yPercent: 115, skewY: 6, duration: 0.9, stagger: 0.12 }, 0.05)
      .from('.hero__lines i', { scaleX: 0, duration: 1.3, stagger: 0.15, ease: 'power2.out' }, 0.1)
      .from('.shape--main img', { scale: 1.12, duration: 1.4, ease: 'power2.out' }, 0.1)
      .fromTo('.shape--sub', { clipPath: 'polygon(100% 0,100% 0,100% 100%,100% 100%)' }, { clipPath: 'polygon(14% 0,100% 0,86% 100%,0 100%)', duration: 0.9, clearProps: 'clipPath' }, 0.55)
      .from('.spool', { scale: 0.6, opacity: 0, rotate: -40, duration: 1, ease: 'back.out(1.4)' }, 0.7)
      .from('.hero__sub, .hero__cta, .status', { y: 18, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.6);
  }

  /* turbo spool: idles, spools up with scroll speed */
  if (spool && !reduce) {
    var rot = 0, vel = 0, visible = true;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(hero);
    ScrollTrigger.create({ onUpdate: function (self) { vel = Math.min(1100, vel + Math.abs(self.getVelocity()) * 0.012); } });
    gsap.ticker.add(function (t, dt) {
      if (!visible) return;
      rot += (50 + vel) * dt / 1000; vel *= 0.95;
      spool.setAttribute('transform', 'rotate(' + rot.toFixed(1) + ')');
    });
  }

  /* rating counter */
  var cnt = doc.querySelector('.count');
  if (cnt && !reduce) {
    var o = { v: 0 };
    ScrollTrigger.create({ trigger: cnt, start: 'top 92%', once: true, onEnter: function () {
      gsap.to(o, { v: 5, duration: 1.4, ease: 'power2.out', onUpdate: function () { cnt.textContent = o.v.toFixed(1); } });
    } });
    cnt.textContent = '0.0';
  }

  /* recent jobs: pinned horizontal run on wide screens, native scroll on touch */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    var sec = doc.querySelector('.jobs'); if (!sec) return;
    var track = sec.querySelector('.jobs__track');
    sec.classList.add('pinned');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 60); };
    gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top+=64', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
    return function () { sec.classList.remove('pinned'); gsap.set(track, { clearProps: 'x' }); };
  });
})();
