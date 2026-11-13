/* Efectos del portafolio de Agustín, traídos a esta página: la constelación 3D del fondo, el campo
   ASCII que se enciende cerca del puntero, los títulos que entran palabra por palabra, los textos que
   se escriben, las tarjetas en cascada, la barra de progreso y los botones que se dejan atraer.
   Va en el <head>: marca los elementos antes de que se vean. Con movimiento reducido no anima. */
(function () {
  var d = document, html = d.documentElement;
  var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ACC = [255, 92, 53], accCss = 'rgb(' + ACC.join(',') + ')';
  var claro = function () { return !html.classList.contains('dark'); };
  var dpr = Math.min(2, window.devicePixelRatio || 1);

  /* ---------- Constelación: puntos en 3D que se recorren al bajar por la página ---------- */
  function constelacion(cv) {
    var ctx = cv.getContext('2d'), w = 0, h = 0, mx = 0, my = 0, p = 0, vis = true, id = 0;
    var DEPTH = 15, NEAR = 0.25, FAR = 7, TRAVEL = 24;
    var pts = []; for (var i = 0; i < 300; i++) pts.push({ x: (Math.random() * 2 - 1) * 1.9, y: (Math.random() * 2 - 1) * 1.9, z: Math.random() * DEPTH, r: 0.55 + Math.random() * 0.9 });
    var t = 0, smoothP = 0, last = 0, FRAME = 1000 / 30, alfa = 0.6;
    function byZ(a, b) { return a.z - b.z; }
    function tam() { w = window.innerWidth; h = window.innerHeight; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (still) draw(0); }
    function draw(now) {
      if (!still) { if (!vis) { id = 0; return; } id = requestAnimationFrame(draw); if (now - last < FRAME - 1) return; }
      var k = last ? Math.min(now - last, 100) / 16.667 : 1; last = now;
      var alto = html.scrollHeight - window.innerHeight; p = alto > 0 ? window.scrollY / alto : 0;
      var light = claro();
      ctx.clearRect(0, 0, w, h);
      smoothP = still ? p : smoothP + (p - smoothP) * (1 - Math.pow(0.92, k));
      var camZ = smoothP * TRAVEL + t * 0.05;
      var twist = smoothP * 1.5 + t * 0.02 + mx * 0.35;
      var R = Math.min(w, h) * 0.78, f = 1.35, cx = w * 0.5 + mx * 42, cy = h * 0.5 + my * 30, ct = Math.cos(twist), st = Math.sin(twist);
      var scr = [];
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i], pz = pt.z - camZ;
        while (pz < NEAR) { pt.z += DEPTH; pz = pt.z - camZ; }
        while (pz > DEPTH + NEAR) { pt.z -= DEPTH; pz = pt.z - camZ; }
        if (pz < NEAR || pz > FAR) continue;
        var rx = pt.x * ct - pt.y * st, ry = pt.x * st + pt.y * ct, s = f / pz;
        var depthT = 1 - (pz - NEAR) / (FAR - NEAR), a = depthT; if (pz < 0.8) a *= Math.max(0, pz / 0.8);
        scr.push({ x: cx + rx * s * R, y: cy + ry * s * R, z: pz, a: a, d: depthT, r: pt.r });
      }
      scr.sort(byZ);
      var thr = R * 0.17, thr2 = thr * thr, la = (light ? 0.34 : 0.52) * alfa;
      ctx.lineWidth = 1; ctx.strokeStyle = accCss; ctx.fillStyle = accCss;
      for (var i = 0; i < scr.length; i++) {
        var A = scr[i];
        for (var j = i + 1; j < scr.length; j++) {
          var B = scr[j]; if (B.z - A.z > 1.6) break;
          var dx = A.x - B.x, dy = A.y - B.y, dd = dx * dx + dy * dy; if (dd > thr2) continue;
          var al = (1 - Math.sqrt(dd) / thr) * Math.min(A.a, B.a) * la; if (al < 0.012) continue;
          ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        }
      }
      for (var i = 0; i < scr.length; i++) { var A = scr[i]; ctx.globalAlpha = A.a * (light ? 0.55 : 0.85) * alfa; ctx.beginPath(); ctx.arc(A.x, A.y, A.r * (0.5 + A.d * 2.6), 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = 1;
      t += 0.016 * k;
    }
    window.addEventListener('resize', tam);
    if (!still) window.addEventListener('pointermove', function (e) { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; }, { passive: true });
    d.addEventListener('visibilitychange', function () { vis = !d.hidden; if (vis && !id && !still) { last = 0; id = requestAnimationFrame(draw); } });
    tam(); if (!still) id = requestAnimationFrame(draw);
  }

  /* ---------- Campo ASCII: ondas de caracteres que se encienden cerca del puntero ---------- */
  function ascii(cv) {
    var ctx = cv.getContext('2d'), ramp = ' .·:-=+*#%@', cell = window.innerWidth < 760 ? 20 : 16;
    var w = 0, h = 0, cols = 0, rows = 0, mx = -999, my = -999, t = 0, last = 0, FRAME = 1000 / 30;
    var colS = [], rowS = [], diagS = [], vis = true, id = 0, alfa = 0.6, FUENTE = "'JetBrains Mono',monospace";
    function tam() { var host = cv.parentElement; w = host.clientWidth; h = host.clientHeight; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cols = Math.ceil(w / cell); rows = Math.ceil(h / cell); ctx.font = cell + 'px ' + FUENTE; ctx.textBaseline = 'top'; if (still) draw(0); }
    function draw(now) {
      if (!vis) { id = 0; return; }
      if (!still) { id = requestAnimationFrame(draw); if (now - last < FRAME - 1) return; }
      var k = last ? Math.min(now - last, 100) / 16.667 : 1; last = now;
      var light = claro(), baseCss = light ? 'rgb(20,18,15)' : 'rgb(236,234,228)', baseA = light ? 0.06 : 0.09, baseM = light ? 0.14 : 0.20;
      ctx.clearRect(0, 0, w, h);
      var cx, cy, top = ramp.length - 1;
      for (cx = 0; cx < cols; cx++) colS[cx] = Math.sin(cx * cell * 0.018 + t * 0.6);
      for (cy = 0; cy < rows; cy++) rowS[cy] = Math.sin(cy * cell * 0.026 - t * 0.45);
      for (cx = 0; cx < cols + rows; cx++) diagS[cx] = Math.sin(cx * cell * 0.013 + t * 0.9);
      var mode = 0; ctx.fillStyle = baseCss;
      for (cy = 0; cy < rows; cy++) {
        var y = cy * cell, dy = y - my, dy2 = dy * dy, rs = rowS[cy];
        for (cx = 0; cx < cols; cx++) {
          var x = cx * cell, v = (colS[cx] + rs + diagS[cx + cy] + 3) / 6;
          var dx = x - mx, dd = dx * dx + dy2, infl = dd < 40000 ? 1 - Math.sqrt(dd) / 200 : 0;
          var val = Math.min(1, v * (0.7 + infl * 0.9) + infl * 0.35), idx = Math.floor(val * top);
          if (idx === 0) continue;
          if (infl > 0.12) { if (mode !== 1) { ctx.fillStyle = accCss; mode = 1; } ctx.globalAlpha = Math.min(0.95, 0.25 + infl * 0.75) * alfa; }
          else { if (mode !== 0) { ctx.fillStyle = baseCss; mode = 0; } ctx.globalAlpha = (baseA + val * baseM) * alfa; }
          ctx.fillText(ramp[idx], x, y);
        }
      }
      ctx.globalAlpha = 1;
      t += 0.008 * k;
    }
    if (!still) window.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
    new IntersectionObserver(function (en) { var was = vis; vis = en[0].isIntersecting; if (vis && !was && !still) { last = 0; id = requestAnimationFrame(draw); } }).observe(cv);
    if ('ResizeObserver' in window) new ResizeObserver(tam).observe(cv.parentElement); else window.addEventListener('resize', tam);
    if (d.fonts && d.fonts.load) d.fonts.load('16px "JetBrains Mono"').then(function () { ctx.font = cell + 'px ' + FUENTE; });
    tam(); if (!still) id = requestAnimationFrame(draw);
  }

  /* ---------- Entradas: palabras, escritura, cascadas ---------- */
  var REGLAS = [
    ['palabras', '.heroTitle,.sectitle,.gracias h3'],
    ['escribe', '.eyebrow,.pill,.flowHead span:last-child,.diagTitle'],
    ['grupo', '.ctas,.stats,.services,.process,.cases,.stack,.faq,.tags'],
    ['bloque', '.flow,.diag'],
    ['sube', '.script,.heroDesc,.secsub,.alt-contact,footer .wrap']
  ];
  var PASO = 85, PASO_HIJO = 70, TOPE = 9, io;

  function palabrasDe(nodo, destino) {
    [].slice.call(nodo.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (pz) {
          if (!pz) return;
          if (/^\s+$/.test(pz)) { destino.appendChild(d.createTextNode(' ')); return; }
          var w = d.createElement('span'), s = d.createElement('span');
          w.className = 'mx-w'; s.textContent = pz; s.style.setProperty('--i', destino.closest('[data-mx]') ? (destino.closest('[data-mx]')._n = (destino.closest('[data-mx]')._n || 0) + 1) : 0);
          w.appendChild(s); destino.appendChild(w);
        });
      } else if (n.nodeType === 1) {
        var copia = n.cloneNode(false); destino.appendChild(copia); palabrasDe(n, copia);
      }
    });
  }
  function partir(el) {
    if (!el.textContent.trim()) return false;
    var tmp = el.cloneNode(true); el.textContent = ''; el.setAttribute('aria-label', tmp.textContent.trim());
    palabrasDe(tmp, el); return true;
  }
  function revelar(el, demora) {
    var tipo = el.getAttribute('data-mx');
    el.style.setProperty('--mx-d', demora + 'ms');
    if (tipo === 'palabras' && !partir(el)) el.setAttribute('data-mx', 'sube');
    if (tipo === 'escribe') {
      el.style.setProperty('--mx-n', Math.max(4, Math.min(60, el.textContent.trim().length)));
      if (getComputedStyle(el.parentElement).textAlign === 'center') el.setAttribute('data-mx-centro', '');
    }
    if (tipo === 'grupo') {
      [].forEach.call(el.children, function (c, j) {
        if (c.hasAttribute('data-mx')) return;
        c.setAttribute('data-mx', 'hijo');
        c.style.setProperty('--mx-d', (demora + Math.min(j, 12) * PASO_HIJO) + 'ms');
        c.setAttribute('data-mx-on', '');
      });
    }
    el.setAttribute('data-mx-on', '');
  }
  function preparar() {
    REGLAS.forEach(function (r) {
      d.querySelectorAll(r[1]).forEach(function (el) {
        if (el.hasAttribute('data-mx') || el.closest('.nav')) return;
        el.setAttribute('data-mx', r[0]); io.observe(el);
      });
    });
    // Flechas de los botones, para que avancen al pasar el mouse.
    d.querySelectorAll('.btn').forEach(function (b) {
      var m = /^(.*?)\s*([→↗])$/.exec(b.textContent.trim());
      if (m && b.children.length === 0) { b.textContent = ''; var a = d.createElement('span'), z = d.createElement('span'); a.textContent = m[1]; z.textContent = m[2]; b.appendChild(a); b.appendChild(z); }
    });
  }

  function alCargar() {
    d.querySelectorAll('canvas.bg3d').forEach(constelacion);
    d.querySelectorAll('canvas.asciiCanvas').forEach(ascii);
    if (still || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (es) {
      var nuevos = es.filter(function (e) { return e.isIntersecting && !e.target.hasAttribute('data-mx-on'); }).map(function (e) { return e.target; });
      nuevos.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      nuevos.forEach(function (el, k) { io.unobserve(el); revelar(el, Math.min(k, TOPE) * PASO); });
    }, { rootMargin: '0px 0px -8% 0px' });
    preparar();

    // Barra de progreso de lectura.
    var barra = d.createElement('div'); barra.className = 'mx-progreso'; barra.setAttribute('aria-hidden', 'true'); d.body.appendChild(barra);
    var pend = false;
    function medir() {
      pend = false; var alto = html.scrollHeight - window.innerHeight, sy = window.scrollY;
      barra.classList.toggle('on', alto > window.innerHeight * 0.6 && sy > 10);
      barra.style.transform = 'scaleX(' + (alto > 0 ? Math.min(1, sy / alto).toFixed(4) : 0) + ')';
    }
    window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(medir); } }, { passive: true });
    medir();

    // Botones que se dejan atraer por el cursor.
    if (window.matchMedia('(hover: hover)').matches) {
      var iman = null;
      d.addEventListener('mousemove', function (e) {
        var b = e.target.closest ? e.target.closest('.btn') : null;
        if (b !== iman) { if (iman) iman.style.removeProperty('translate'); iman = b; }
        if (!b) return;
        var r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px';
      }, { passive: true });
    }
  }

  if (!still && 'IntersectionObserver' in window) html.classList.add('mx');
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', alCargar); else alCargar();
})();
