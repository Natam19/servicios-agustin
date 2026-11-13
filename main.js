(function () {
  var root = document.documentElement;

  // tema claro / oscuro
  var tema = document.getElementById('tema');
  function pintarIcono() { tema.textContent = root.classList.contains('dark') ? '☀' : '☾'; }
  pintarIcono();
  tema.addEventListener('click', function () {
    root.classList.toggle('dark');
    localStorage.setItem('tema', root.classList.contains('dark') ? 'dark' : 'light');
    pintarIcono();
  });

  // menú en celular
  var links = document.getElementById('links');
  document.getElementById('menu').addEventListener('click', function () { links.classList.toggle('open'); });
  links.addEventListener('click', function (e) { if (e.target.tagName === 'A') links.classList.remove('open'); });

  // aparición al hacer scroll
  var io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // cifras que cuentan
  function contar(el) {
    var n = +el.dataset.n, pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = null;
    function paso(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1), v = Math.round(n * (1 - Math.pow(1 - p, 3)));
      el.textContent = pre + v.toLocaleString('es-CO') + suf;
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  var ioN = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { if (e.isIntersecting) { contar(e.target); ioN.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('.num[data-n]').forEach(function (el) { ioN.observe(el); });

  // flujo del hero, paso a paso
  var pasos = document.querySelectorAll('#flow .step'), i = 0;
  function avanzar() {
    if (i < pasos.length) { pasos[i].classList.add('on'); i++; setTimeout(avanzar, 700); }
    else setTimeout(function () { pasos.forEach(function (s) { s.classList.remove('on'); }); i = 0; setTimeout(avanzar, 600); }, 3200);
  }
  setTimeout(avanzar, 500);

  // preguntas
  document.querySelectorAll('.q button').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = b.parentElement, a = q.querySelector('.a'), abierta = q.classList.toggle('open');
      a.style.maxHeight = abierta ? a.scrollHeight + 'px' : '0';
    });
  });

  // diagnóstico paso a paso
  // A dónde llegan las respuestas: un webhook (por ejemplo de n8n). Mientras esté vacío, el formulario solo muestra el "gracias".
  var WEBHOOK_DIAGNOSTICO = '';
  var form = document.getElementById('diag');
  if (form) {
    var etapas = form.querySelectorAll('.paso'), total = etapas.length, actual = 0;
    var err = document.getElementById('err'), btnAtras = document.getElementById('atras'), btnSig = document.getElementById('siguiente');
    document.getElementById('pasoT').textContent = total;

    form.querySelectorAll('.opts').forEach(function (grupo) {
      grupo.addEventListener('click', function (e) {
        if (e.target.tagName !== 'BUTTON') return;
        if (grupo.dataset.tipo === 'uno') grupo.querySelectorAll('button').forEach(function (b) { if (b !== e.target) b.classList.remove('on'); });
        e.target.classList.toggle('on');
        err.textContent = '';
      });
    });

    function mostrar(i) {
      etapas.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      document.getElementById('pasoN').textContent = i + 1;
      document.getElementById('barra').style.width = ((i + 1) / total * 100) + '%';
      btnAtras.style.visibility = i === 0 ? 'hidden' : 'visible';
      btnSig.textContent = i === total - 1 ? 'Enviar diagnóstico →' : 'Siguiente →';
      err.textContent = '';
    }

    function elegidos(paso, nombre) {
      return Array.prototype.map.call(paso.querySelectorAll('.opts[data-name="' + nombre + '"] button.on'), function (b) { return b.textContent; });
    }

    function valido(i) {
      var p = etapas[i];
      var vacios = Array.prototype.filter.call(p.querySelectorAll('[required]'), function (c) { return c.type === 'checkbox' ? !c.checked : !c.value.trim(); });
      if (vacios.length) return vacios[0].type === 'checkbox' ? 'Falta autorizar el tratamiento de datos.' : 'Completa los campos para seguir.';
      var unos = p.querySelectorAll('.opts[data-tipo="uno"]');
      for (var k = 0; k < unos.length; k++) if (!unos[k].querySelector('button.on')) return 'Elige una opción para seguir.';
      var tel = p.querySelector('[name=whatsapp]');
      if (tel && tel.value.replace(/\D/g, '').length < 7) return 'Revisa el número de WhatsApp.';
      return '';
    }

    function datos() {
      var d = { enviado: new Date().toISOString() };
      form.querySelectorAll('input[name], textarea[name]').forEach(function (c) { d[c.name] = c.type === 'checkbox' ? c.checked : c.value.trim(); });
      form.querySelectorAll('.opts').forEach(function (g) { var v = elegidos(form, g.dataset.name); d[g.dataset.name] = g.dataset.tipo === 'uno' ? (v[0] || '') : v; });
      return d;
    }

    function terminar() {
      etapas.forEach(function (p) { p.classList.remove('on'); });
      document.getElementById('diagNav').style.display = 'none';
      document.querySelector('.diagStep').style.visibility = 'hidden';
      document.getElementById('barra').style.width = '100%';
      document.getElementById('gracias').classList.add('on');
      err.textContent = '';
    }

    btnAtras.addEventListener('click', function () { if (actual > 0) mostrar(--actual); });
    btnSig.addEventListener('click', function () {
      var m = valido(actual);
      if (m) { err.textContent = m; return; }
      if (actual < total - 1) { mostrar(++actual); return; }
      btnSig.disabled = true; btnSig.textContent = 'Enviando...';
      var payload = datos();
      if (!WEBHOOK_DIAGNOSTICO) { terminar(); return; }
      fetch(WEBHOOK_DIAGNOSTICO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); terminar(); })
        .catch(function () { btnSig.disabled = false; btnSig.textContent = 'Enviar diagnóstico →'; err.textContent = 'No se pudo enviar. Intenta de nuevo o escríbeme por LinkedIn.'; });
    });
    mostrar(0);
  }
})();
