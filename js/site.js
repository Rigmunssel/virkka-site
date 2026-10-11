(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- navigation ---------- */
  var nav = document.getElementById('nav'), menu = document.getElementById('menu');
  var home = document.body.dataset.page === 'home';
  function onScroll() { nav.classList.toggle('solid', window.scrollY > (home ? window.innerHeight * 0.6 : 8)); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open menu'); }
  menu.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  var links = document.querySelectorAll('.links a');
  links.forEach(function (a) { a.addEventListener('click', closeMenu); });
  if (home && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- reveal on scroll ---------- */
  var items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) items.forEach(function (e) { e.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (e) { io.observe(e); });
  }

  /* ---------- copy email ---------- */
  var copy = document.getElementById('copy');
  if (copy) copy.addEventListener('click', function () {
    var addr = copy.dataset.email;
    (navigator.clipboard ? navigator.clipboard.writeText(addr) : Promise.reject()).then(function () {
      copy.textContent = 'Copied';
    }).catch(function () {
      var r = document.createRange(); r.selectNodeContents(document.getElementById('email'));
      var s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected';
    });
    setTimeout(function () { copy.textContent = 'Copy'; }, 2500);
  });

  /* ---------- contour background ----------
     A smooth 3D noise field is traced into contour lines with marching squares.
     Time is the third noise axis, so the lines drift slowly; on the home page
     the pointer raises the field slightly and the lines bend around it. */
  var perm = new Uint8Array(512);
  (function () {
    var p = [], seed = 1847, i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { seed = (seed * 16807) % 2147483647; var j = seed % (i + 1), t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();
  var GR = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  function corner(t, g, a, b, d) { if (t < 0) return 0; t *= t; return t * t * (g[0] * a + g[1] * b + g[2] * d); }
  function noise(x, y, z) {   // 3D simplex noise
    var F3 = 1 / 3, G3 = 1 / 6, s = (x + y + z) * F3;
    var i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s), t = (i + j + k) * G3;
    var x0 = x - i + t, y0 = y - j + t, z0 = z - k + t, i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    var x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    var x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    var x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
    var ii = i & 255, jj = j & 255, kk = k & 255;
    return 32 * (
      corner(0.6 - x0 * x0 - y0 * y0 - z0 * z0, GR[perm[ii + perm[jj + perm[kk]]] % 12], x0, y0, z0) +
      corner(0.6 - x1 * x1 - y1 * y1 - z1 * z1, GR[perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12], x1, y1, z1) +
      corner(0.6 - x2 * x2 - y2 * y2 - z2 * z2, GR[perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12], x2, y2, z2) +
      corner(0.6 - x3 * x3 - y3 * y3 - z3 * z3, GR[perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12], x3, y3, z3));
  }

  /* one contour drawing per canvas; options come from data attributes and context */
  function Contour(canvas, o) {
    var ctx = canvas.getContext('2d'), W = 0, H = 0, cell = 12, cols = 0, rows = 0, field = null;
    var visible = false, looping = false, t0 = performance.now(), tStill = 0;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0, a: 0, ta: 0 };
    function size() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; if (!W || !H) return;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = W < 700 ? 10 : 12; cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1; field = new Float32Array(cols * rows);
    }
    function draw(now) {
      if (!field) return;
      var t = (o.animate ? (now - t0) / 1000 * 0.03 : tStill) + o.offset, sc = 1 / 380, x, y;
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06; mouse.a += (mouse.ta - mouse.a) * 0.04;
      var R2 = 2 * 170 * 170;
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        var px = x * cell, py = y * cell, dx = px - mouse.x, dy = py - mouse.y;
        field[y * cols + x] = noise(px * sc, py * sc, t) * 0.75 + noise(px * sc * 2.1, py * sc * 2.1, t * 1.6 + 9) * 0.25
                            + 0.5 * mouse.a * Math.exp(-(dx * dx + dy * dy) / R2);
      }
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (var l = 0; l < 14; l++) {
        var iso = -0.9 + l * (1.8 / 13);
        ctx.strokeStyle = l % 4 === 0 ? o.major : o.minor;
        ctx.beginPath();
        for (y = 0; y < rows - 1; y++) for (x = 0; x < cols - 1; x++) {
          var a = field[y * cols + x], b = field[y * cols + x + 1], c = field[(y + 1) * cols + x + 1], d = field[(y + 1) * cols + x];
          var idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var X = x * cell, Y = y * cell;
          var top = [X + cell * (iso - a) / (b - a), Y], right = [X + cell, Y + cell * (iso - b) / (c - b)];
          var bottom = [X + cell * (iso - d) / (c - d), Y + cell], left = [X, Y + cell * (iso - a) / (d - a)];
          var segs;
          switch (idx) {
            case 1: case 14: segs = [left, bottom]; break;
            case 2: case 13: segs = [bottom, right]; break;
            case 3: case 12: segs = [left, right]; break;
            case 4: case 11: segs = [top, right]; break;
            case 5: segs = [left, top, bottom, right]; break;
            case 6: case 9: segs = [top, bottom]; break;
            case 7: case 8: segs = [left, top]; break;
            case 10: segs = [left, bottom, top, right]; break;
          }
          for (var s = 0; s < segs.length; s += 2) { ctx.moveTo(segs[s][0], segs[s][1]); ctx.lineTo(segs[s + 1][0], segs[s + 1][1]); }
        }
        ctx.stroke();
      }
    }
    var hovering = false, last = 0;
    function loop(now) {
      var run = visible && !reduce && (o.animate || hovering || mouse.a > 0.01);
      if (!run) { looping = false; return; }
      if (!o.animate) { tStill += Math.min(now - (last || now), 50) / 1000 * 0.06; last = now; }
      draw(now); requestAnimationFrame(loop);
    }
    function start() { if (!looping && !reduce) { looping = true; last = 0; requestAnimationFrame(loop); } }
    size(); draw(performance.now());
    window.addEventListener('resize', function () { size(); draw(performance.now()); });
    var host = o.host || canvas.parentElement;
    if (o.pointer) {
      host.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect(); mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
        if (mouse.a < 0.01) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
        mouse.ta = e.pointerType === 'mouse' ? 1 : 0; start();
      });
      host.addEventListener('pointerleave', function () { mouse.ta = 0; });
    }
    if (o.hoverDrift) {
      host.addEventListener('pointerenter', function () { hovering = true; start(); });
      host.addEventListener('pointerleave', function () { hovering = false; });
    }
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas);
  }

  document.querySelectorAll('.contour > canvas').forEach(function (c) {
    Contour(c, { offset: Number(c.dataset.offset || 0), animate: true, pointer: home, major: 'rgba(27,34,41,0.17)', minor: 'rgba(27,34,41,0.075)' });
  });
})();
