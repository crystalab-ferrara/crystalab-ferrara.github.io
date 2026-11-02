// Crystal Lab Ferrara: navigation state, mobile menu, home carousel, publication search, research index.
(function () {
  // "Skip to content" moves focus to the main content in place (on the 404 page a <base> would otherwise send it home)
  var skip = document.querySelector('.skip');
  var main = document.getElementById('main');
  if (skip && main) skip.addEventListener('click', function (e) {
    e.preventDefault(); main.setAttribute('tabindex', '-1'); main.focus(); main.scrollIntoView();
  });

  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('solid', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    var btn = nav.querySelector('.menu-btn');
    var icons = {
      open: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    };
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      if (!btn) return;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
      btn.innerHTML = open ? icons.close : icons.open;
    };
    if (btn) btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    // Escape closes the phone menu and hands focus back to its button; choosing a link or tapping outside closes it too
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); if (btn) btn.focus(); }
    });
    document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false); });
    [].forEach.call(nav.querySelectorAll('.nav-links a'), function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  // Home carousel: crossfade every 6 s, dots, pause; stops when reduced motion is requested.
  var hero = document.querySelector('.hero');
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll('.slide'));
    var lines = [].slice.call(hero.querySelectorAll('.hero-lines li'));
    var dots = [].slice.call(hero.querySelectorAll('.dots button'));
    var caption = hero.querySelector('.hero-caption');
    var pause = hero.querySelector('.pause');
    var i = 0, timer = null, userPaused = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // slides after the first ship their image addresses in data-*; fill them in when a slide is about to be shown
    var load = function (k) {
      var s = slides[k % slides.length];
      [].forEach.call(s.querySelectorAll('[data-srcset]'), function (el) { el.srcset = el.getAttribute('data-srcset'); el.removeAttribute('data-srcset'); });
      [].forEach.call(s.querySelectorAll('[data-src]'), function (el) { el.src = el.getAttribute('data-src'); el.removeAttribute('data-src'); });
    };
    var show = function (n) {
      i = (n + slides.length) % slides.length;
      load(i); load(i + 1);
      slides.forEach(function (s, k) {
        s.classList.toggle('on', k === i);
        if (k === i) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
      });
      // the line that goes with this photo; hidden lines leave the tab order and the accessibility tree
      lines.forEach(function (l, k) {
        l.classList.toggle('on', k === i);
        if (k === i) l.removeAttribute('aria-hidden'); else l.setAttribute('aria-hidden', 'true');
        var a = l.querySelector('a'); if (a) { if (k === i) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); }
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (caption) caption.textContent = slides[i].getAttribute('data-caption') || '';
    };
    var setIcon = function (paused) {
      if (!pause) return;
      pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      pause.innerHTML = paused
        ? '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor"/></svg>';
    };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    // a keyboard visitor inside the header holds the slide, so a focused link never disappears under the focus;
    // mouse clicks on the dots or the pause button leave no visible focus and do not hold it
    var focusHold = function () {
      var el = document.activeElement;
      return !!el && el !== document.body && hero.contains(el) && el.matches(':focus-visible');
    };
    var play = function () { stop(); timer = setInterval(function () { if (!focusHold()) show(i + 1); }, 6000); };

    // Particle network over the photos (particles.js): drifting points, a few in beam orange,
    // linked by thin lines when close; lines reach for the pointer. Still when reduced motion is requested.
    var pJS = null;
    if (window.particlesJS && document.getElementById('particles')) {
      window.particlesJS('particles', {
        particles: {
          number: { value: 90, density: { enable: true, value_area: 900 } },
          color: { value: ['#ffffff', '#ffffff', '#ffffff', '#f39a2e'] },
          shape: { type: 'circle' },
          opacity: { value: 0.8, random: true },
          size: { value: 2.8, random: true },
          line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.36, width: 1 },
          move: { enable: !reduce, speed: 0.7, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
          detect_on: 'window',
          events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: false }, resize: true },
          modes: { grab: { distance: 190, line_linked: { opacity: 0.55 } } }
        },
        retina_detect: true
      });
      pJS = window.pJSDom && window.pJSDom.length ? window.pJSDom[window.pJSDom.length - 1].pJS : null;
    }
    // particles.js ends its draw loop by itself once move.enable is false; drawing again restarts it
    var particlesOn = true, heroVisible = true;
    var syncParticles = function () {
      if (!pJS || reduce) return;
      var want = !userPaused && heroVisible && !document.hidden;
      // cancel any frame still queued, so a quick off/on never leaves two draw loops running
      if (want && !particlesOn) { pJS.particles.move.enable = true; cancelAnimationFrame(pJS.fn.drawAnimFrame); pJS.fn.vendors.draw(); }
      if (!want && particlesOn) pJS.particles.move.enable = false;
      particlesOn = want;
    };
    // one state for everything that moves: the user's pause or reduced motion
    var sync = function () {
      setIcon(userPaused || reduce);
      if (userPaused || reduce) stop(); else if (!timer) play();
      syncParticles();
    };
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); if (timer) play(); }); });
    if (pause) pause.addEventListener('click', function () { userPaused = !userPaused; sync(); });
    document.addEventListener('visibilitychange', syncParticles);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; syncParticles(); }).observe(hero);
    show(0);
    sync();
  }

  // Collaborations map: select a lab (click, tap, Enter or Space) to show what we do there in the card next to the map.
  var labmap = document.querySelector('.labmap');
  if (labmap) {
    var labs = [].slice.call(labmap.querySelectorAll('.lab'));
    var card = labmap.querySelector('.lab-card');
    var pick = function (g) {
      labs.forEach(function (l) { l.classList.toggle('on', l === g); if (l === g) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
      var logo = card.querySelector('.lab-logo'); logo.src = g.getAttribute('data-logo'); logo.hidden = false;
      card.querySelector('.lab-name').textContent = g.getAttribute('data-name');
      card.querySelector('.lab-city').textContent = '· ' + g.getAttribute('data-city');
      card.querySelector('.lab-cat').textContent = g.getAttribute('data-cat');
      card.querySelector('.lab-text').textContent = g.getAttribute('data-text');
      // on narrow screens the card sits under the map: bring it into view
      if (window.innerWidth <= 900) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    labs.forEach(function (g) {
      g.addEventListener('click', function () { pick(g); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g); } });
    });
    // the row of names under the map (shown on phones, where the dots are too close to tap) picks the same lab
    var pickers = [].slice.call(document.querySelectorAll('.map-picker button'));
    pickers.forEach(function (b) {
      b.addEventListener('click', function () {
        var g = labs.filter(function (l) { return l.getAttribute('data-name') === b.getAttribute('data-name') && l.getAttribute('data-city') === b.getAttribute('data-city'); })[0];
        if (!g) return;
        pick(g);
        pickers.forEach(function (o) { if (o === b) o.setAttribute('aria-current', 'true'); else o.removeAttribute('aria-current'); });
      });
    });
  }

  // Research index: highlight the line in view.
  var toc = document.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = {};
    [].forEach.call(toc.querySelectorAll('a'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && links[e.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('on'); links[k].removeAttribute('aria-current'); });
          links[e.target.id].classList.add('on'); links[e.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    [].forEach.call(document.querySelectorAll('.line-item'), function (el) { io.observe(el); });
  }

  // Publications: live filter over title, authors and journal, and by research line; both live in the address (?q=, ?line=) so they can be shared.
  var q = document.getElementById('pub-search');
  if (q) {
    var items = [].slice.call(document.querySelectorAll('.pubs li'));
    var blocks = [].slice.call(document.querySelectorAll('.year-block'));
    var yearLinks = [].slice.call(document.querySelectorAll('.years a'));
    var count = document.querySelector('.count');
    var empty = document.querySelector('.empty');
    var tools = document.querySelector('.pub-tools');
    var lineSel = document.getElementById('pub-line');
    var total = items.length;
    // NFKD also turns sub- and superscripts (Al₂O₃, μ⁺) into plain characters, so typing "al2o3" finds them
    var norm = function (s) { return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); };
    // data-a holds the full author list and data-r the full journal name, so "et al." authors and unabbreviated journals are found too
    items.forEach(function (li) { li._t = norm(li.textContent + ' ' + (li.getAttribute('data-a') || '') + ' ' + (li.getAttribute('data-r') || '')); });
    // common short forms also match the words written out in titles and journal names
    var ALIAS = {
      lhc: ['lhc', 'large hadron collider'], sps: ['sps', 'super proton synchrotron'], nim: ['nucl. instrum', 'nuclear instruments'],
      prl: ['physical review letters', 'phys. rev. lett'], prab: ['physical review accelerators', 'phys. rev. accel'],
      epjc: ['european physical journal c'], jinst: ['journal of instrumentation'], g4: ['geant4']
    };
    var run = function () {
      var words = norm(q.value).split(/\s+/).filter(Boolean);
      var line = lineSel ? lineSel.value : '';
      var shown = 0;
      items.forEach(function (li) {
        // data-l lists the paper's research lines, separated by spaces
        var ok = (!line || (' ' + (li.getAttribute('data-l') || '') + ' ').indexOf(' ' + line + ' ') !== -1) &&
          words.every(function (w) { return (ALIAS[w] || [w]).some(function (a) { return li._t.indexOf(a) !== -1; }); });
        li.hidden = !ok; if (ok) shown++;
      });
      blocks.forEach(function (b, k) {
        var n = b.querySelectorAll('li:not([hidden])').length;
        b.hidden = n === 0;
        var sm = b.querySelector('h2 small'); if (sm) sm.textContent = n + (n === 1 ? ' paper' : ' papers');
        // a year with nothing left to show drops out of the year index too
        var link = yearLinks.filter(function (a) { return a.getAttribute('href') === '#' + b.id; })[0];
        if (link) link.hidden = n === 0;
      });
      count.textContent = words.length || line ? shown + ' of ' + total + ' papers' : total + ' papers';
      empty.hidden = shown !== 0;
      var url = new URL(location.href);
      if (q.value.trim()) url.searchParams.set('q', q.value.trim()); else url.searchParams.delete('q');
      if (line) url.searchParams.set('line', line); else url.searchParams.delete('line');
      // a filter replaces any year anchor, so a shared link does not jump to a year the filter may hide
      if (q.value.trim() || line) url.hash = '';
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    };
    q.addEventListener('input', run);
    if (lineSel) lineSel.addEventListener('change', run);
    var clear = document.querySelector('.clear-search');
    if (clear) clear.addEventListener('click', function () { q.value = ''; if (lineSel) lineSel.value = ''; run(); q.focus(); });
    var params = new URLSearchParams(location.search);
    var start = params.get('q'), startLine = params.get('line');
    // only a line that exists in the menu is taken from the address
    if (startLine && lineSel && [].some.call(lineSel.options, function (o) { return o.value === startLine; })) lineSel.value = startLine;
    if (start) q.value = start;
    if (start || (lineSel && lineSel.value)) run();
    // the sticky search bar's height decides where a year lands when its link is followed
    var setTools = function () { document.documentElement.style.setProperty('--tools-h', tools.offsetHeight + 'px'); };
    setTools(); window.addEventListener('resize', setTools);
    // the year in view is marked in the index: the band that decides starts just below the nav and the sticky bar
    var markYear = function (id) { yearLinks.forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); };
    yearLinks.forEach(function (a) { a.addEventListener('click', function () { markYear(a.getAttribute('href').slice(1)); }); });
    // current year = the last visible block whose top has passed the bottom of the sticky bar
    var ticking = false;
    var fromScroll = function () {
      ticking = false;
      var line = (nav ? nav.offsetHeight : 0) + tools.offsetHeight + 32, cur = null;
      blocks.forEach(function (b) { if (!b.hidden && b.getBoundingClientRect().top <= line) cur = b; });
      if (cur) markYear(cur.id);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; setTimeout(fromScroll, 80); } }, { passive: true });
    fromScroll();
  }
})();
