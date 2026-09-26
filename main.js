/* ULima++ · landing
   1. Tema claro u oscuro, según el sistema o el conmutador.
   2. Versión, peso y fecha del APK, en vivo desde la API pública de GitHub, con respaldo.
   3. Logo animado de la entrada, con una de las tres intros aprobadas elegida al azar.
   4. Scrollytelling en 900 px o más, con el teléfono fijo que cambia de captura al bajar.
   5. Detalles sobre la captura, con velo, lupa, anillo, línea guía y frase, al ritmo del texto
      activo, y las pantallas intermedias de cada paso, que también son capturas reales. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement, win = window;

  /* ---------- Utilidades ---------- */
  function $(id) { return doc.getElementById(id); }
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(x, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return x < a ? a : x > b ? b : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function lerp(a, b, x) { return a + (b - a) * x; }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function inOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function outBack(x, s) { var c = s + 1; return 1 + c * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); }
  function spring(t, w0, z) {
    if (t <= 0) return 0;
    var wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
  }
  function quad(a, c, b, t) { var u = 1 - t; return u * u * a + 2 * u * t * c + t * t * b; }
  function f(v) { return (Math.round(v * 100) / 100).toString(); }
  function attr(el, k, v) { el.setAttribute(k, v); }
  function mix(a, b, t) {
    return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
  }
  function mq(q) { return win.matchMedia ? win.matchMedia(q) : null; }
  function onChange(m, fn) {
    if (!m) return;
    if (m.addEventListener) m.addEventListener('change', fn); else if (m.addListener) m.addListener(fn);
  }
  function now() { return (win.performance && performance.now) ? performance.now() : Date.now(); }

  var mqReduce = mq('(prefers-reduced-motion: reduce)');
  var mqWide = mq('(min-width: 900px)');
  var mqDark = mq('(prefers-color-scheme: dark)');
  var reduce = !!(mqReduce && mqReduce.matches);

  /* ---------- 1. Tema ---------- */
  var TEMA = 'ulimaplus-tema', themeBtn = $('tema');
  var metaTheme = all('meta[name="theme-color"]');
  var SPLASH = [231, 115, 48], HEAD = [255, 102, 0], HEAD_H = 102;
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : !!(mqDark && mqDark.matches);
  }
  function syncTheme() {
    var d = isDark();
    root.classList.toggle('is-dark', d);
    themeBtn.setAttribute('aria-label', d ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    // Con el tema elegido a mano, la barra del navegador sigue a la página y no al sistema.
    var forced = root.hasAttribute('data-theme');
    metaTheme.forEach(function (m) {
      var own = /dark/.test(m.getAttribute('media') || '') ? '#0E0E12' : '#F3F3F6';
      m.setAttribute('content', forced ? (d ? '#0E0E12' : '#F3F3F6') : own);
    });
    // Cabecera de la app en cada tema, medida en las capturas (390 x 844 dp).
    HEAD = d ? [30, 30, 36] : [255, 102, 0];
    HEAD_H = d ? 103.3 : 102;
    requestRender();
  }
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { win.localStorage.setItem(TEMA, next); } catch (e) { /* sin almacenamiento, vale solo para esta visita */ }
    syncTheme();
  });
  onChange(mqDark, function () { if (!root.hasAttribute('data-theme')) syncTheme(); });

  /* ---------- 2. Versión y peso del APK ---------- */
  var API = 'https://api.github.com/repos/meltiruiz/ULima_Frontend_IS2/releases/tags/latest';
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function setMeta(m) {
    if (m.build) all('[data-build]').forEach(function (e) { e.textContent = m.build; });
    if (m.size) all('[data-size]').forEach(function (e) { e.textContent = m.size; });
    if (m.date) all('[data-date]').forEach(function (e) { e.textContent = m.date; });
  }
  // Fecha en la hora de Lima, la de casi todos los alumnos.
  function limaDate(dt) {
    try {
      var parts = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(dt);
      var dd = null, mo = null, yy = null;
      parts.forEach(function (x) {
        if (x.type === 'day') dd = +x.value;
        if (x.type === 'month') mo = +x.value;
        if (x.type === 'year') yy = +x.value;
      });
      if (dd && mo && yy) return dd + ' de ' + MESES[mo - 1] + ' de ' + yy;
    } catch (e) { /* sin zonas horarias, se usa la del visitante */ }
    return dt.getDate() + ' de ' + MESES[dt.getMonth()] + ' de ' + dt.getFullYear();
  }
  function parseRelease(d) {
    var assets = (d && d.assets) || [], apk = null, i, mm;
    for (i = 0; i < assets.length; i++) if (assets[i].name === 'ULimaPlus.apk') apk = assets[i];
    if (!apk || !apk.size) return null;
    var build = null, m = /Build:\s*#?(\d+)/i.exec(d.body || '');
    if (m) build = m[1];
    if (!build) {
      // Sin número en las notas, el build es el archivo numerado que pesa lo mismo que ULimaPlus.apk.
      for (i = 0; i < assets.length; i++) {
        mm = /^ULimaPlus-build-(\d+)\.apk$/.exec(assets[i].name);
        if (mm && assets[i].size === apk.size && (!build || +mm[1] > +build)) build = mm[1];
      }
    }
    var dt = new Date(apk.updated_at || d.published_at);
    return {
      build: build ? 'Build ' + build : null,
      size: (apk.size / 1e6).toFixed(1).replace('.', ',') + ' MB',
      date: isNaN(dt.getTime()) ? null : limaDate(dt)
    };
  }
  function loadMeta() {
    var CK = 'ulimaplus-apk';
    try {
      var c = JSON.parse(win.sessionStorage.getItem(CK) || 'null');
      if (c && c.m && Date.now() - c.t < 600000) { setMeta(c.m); root.setAttribute('data-meta', 'vivo'); return; }
    } catch (e) { /* sin caché */ }
    if (!win.fetch) { root.setAttribute('data-meta', 'respaldo'); return; }
    var ctl = win.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    win.fetch(API, { headers: { Accept: 'application/vnd.github+json' }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        clearTimeout(to);
        var m = parseRelease(d);
        if (!m) throw new Error('El release no trae ULimaPlus.apk');
        setMeta(m);
        root.setAttribute('data-meta', 'vivo');
        try { win.sessionStorage.setItem(CK, JSON.stringify({ t: Date.now(), m: m })); } catch (e) { /* sin caché */ }
      })
      .catch(function () {
        // Si la API falla o limita, quedan los datos de respaldo que ya trae el HTML.
        clearTimeout(to);
        root.setAttribute('data-meta', 'respaldo');
      });
  }

  /* ---------- 3. Logo animado ---------- */
  // Todo en dp de la captura (390 x 844). El logo usa las unidades del SVG institucional,
  // con la estrella centrada en (0, 0) y 354,8 u de radio.
  var R = 354.8, CX = 195, CY = 422, K0 = 90 / R;
  var DIR = [[0, -1], [0.7071, -0.7071], [1, 0], [0.7071, 0.7071], [0, 1], [-0.7071, 0.7071], [-1, 0], [-0.7071, -0.7071]];
  var CENTROID = 229.4;
  var CR_HOME = [[306.8, -133.5], [401.2, -133.5]], CR_A = 36.3, CR_TH = 8.7;
  // Destinos en la cabecera real de la app, que no lleva estrella. La estrella se achica a la
  // altura del texto y se disuelve a su izquierda, y los «++» caen sobre los del texto «ULIMA++».
  var HX = 12, HY = 64.5, KE = 7 / R, CTRL = [60, 200];
  var PP_X = [86.3, 97.3], PP_Y = 64.8, PP_A = 5, PP_TH = 1.4, PP_SK = -10;
  var WM_X = 19, WM_W = 62, WM_STOPS = [14, 24, 31, 47, 62];
  var FS = 29.9, BASE = CY + 71.5, S = 1.3;

  var splash = $('splash'), glass = $('glass');
  var n = {
    panelg: $('sp-panelg'), panel: $('sp-panel'), sweep: $('sp-sweep'), logo: $('sp-logo'), ring: $('sp-ring'),
    glint: $('sp-glint'), band: $('sp-band'), starg: $('sp-starg'), inner: $('sp-inner'),
    code: $('sp-code'), caret: $('sp-caret'), crClip: $('sp-crclipr'),
    holeWm: $('sp-hole-wm'), holePp: $('sp-hole-pp')
  };
  var rhEls = all('.sp-rh', splash);
  var pr = [$('sp-pr0'), $('sp-pr1')];
  var crEls = [$('sp-cr0'), $('sp-cr1')].map(function (g) { var r = g.querySelectorAll('rect'); return { g: g, h: r[0], v: r[1] }; });

  var CW = 0.6 * FS, LEFT = CX - 3.5 * CW;
  function measureCode() {
    try {
      n.code.textContent = 'ULima';
      var c = n.code.getComputedTextLength() / 5;
      if (c > 8 && c < 30) CW = c;
    } catch (e) { /* medida por defecto */ }
    n.code.textContent = '';
    LEFT = CX - 3.5 * CW;
    attr(n.code, 'x', f(LEFT));
  }

  function attached(j, s, op) {
    return { x: s.x + CR_HOME[j][0] * s.k, y: s.y + CR_HOME[j][1] * s.k, a: CR_A * s.k, th: CR_TH * s.k, rot: 0, op: op, tint: 0 };
  }
  function basePose() {
    var P = { x: CX, y: CY, k: K0, rot: 0, inS: 1, rh: [], cr: [], ring: null, glint: -1, pr: [null, null], code: null, clipX: null };
    for (var i = 0; i < 8; i++) P.rh.push({ tx: 0, ty: 0, rot: 0, sc: 1, op: 1 });
    for (var j = 0; j < 2; j++) P.cr.push(attached(j, P, 1));
    return P;
  }

  // A, Ensamble (versión adaptada a la spec). Parte de la estrella completa del splash nativo,
  // los ocho rombos se abren juntos y vuelven a encajar uno a uno en sentido horario; un destello
  // asoma por las rendijas y los «++» saltan como un contador.
  function poseEnsamble(t) {
    var P = basePose(), kick = 0, k, j;
    var po = outCubic(seg(t, 80, 260));
    for (k = 0; k < 8; k++) {
      var r = P.rh[k], start = 260 + 50 * k, dur = 264, p = clamp((t - start) / dur), off, ang, sc, op;
      if (p <= 0) { off = 200 * po; ang = -60 * po; sc = 1 - 0.4 * po; op = 1 - 0.6 * po; }
      else {
        off = 200 * (1 - outBack(p, 1.25)); ang = -60 * (1 - outCubic(p));
        sc = 0.6 + 0.4 * outCubic(p); op = 0.4 + 0.6 * seg(t, start, start + 50);
      }
      r.tx = DIR[k][0] * off; r.ty = DIR[k][1] * off; r.rot = ang; r.sc = sc; r.op = op;
      var x = (t - start - dur * 0.45) / 190;
      if (x > 0 && x < 1) kick += Math.sin(Math.PI * x);
    }
    P.inS = 1 - 0.022 * Math.min(kick, 1.4);
    var g = (t - 720) / 360;
    if (g > 0 && g < 1) P.glint = g;
    var rg = (t - 720) / 540;
    if (rg > 0 && rg < 1) P.ring = { r: lerp(370, 640, outCubic(rg)), w: lerp(16, 3, rg), op: 0.35 * (1 - rg) };
    for (j = 0; j < 2; j++) {
      var T = [860, 930][j], pp = seg(t, T, T + 300), c = P.cr[j];
      if (pp <= 0) { c.op = 0; continue; }
      var pop = outBack(pp, 2.4);
      c.a *= pop; c.th *= pop; c.rot = -90 * (1 - outCubic(pp)); c.op = clamp(pp / 0.12);
      var rt = (t - T - 150) / 300;
      if (rt > 0 && rt < 1) P.pr[j] = { x: c.x, y: c.y, r: lerp(15.6, 39, outCubic(rt)), w: lerp(1.8, 0.4, rt), op: 0.55 * (1 - rt) };
    }
    return P;
  }

  // B, Incremento. La estrella gira 45° con resorte, late como un +1 y el segundo «+» nace del primero.
  function poseIncremento(t) {
    var P = basePose(), i, off = 0;
    P.rot = 45 * spring(t / 1000, 15.708, 0.55);
    var bp = (t - 180) / 380;
    if (bp > 0 && bp < 1) {
      var b = bp < 0.32 ? outCubic(bp / 0.32) : 1 - inOutCubic((bp - 0.32) / 0.68);
      off = 24 * b; P.inS = 1 - 0.05 * b;
    }
    for (i = 0; i < 8; i++) { P.rh[i].tx = DIR[i][0] * off; P.rh[i].ty = DIR[i][1] * off; }
    var rp = (t - 230) / 560;
    if (rp > 0 && rp < 1) P.ring = { r: 250 + 290 * outCubic(rp), w: 12 * (1 - rp) + 1.5, op: 0.42 * Math.pow(1 - rp, 1.6) };
    P.x = CX - 36 * inOutCubic(seg(t, 480, 1060)) * K0;
    var c1 = (t - 480) / 440, c2 = (t - 700) / 420, x1 = 190, s1 = 0.72, x2, s2;
    if (c1 > 0) { var e1 = outBack(Math.min(c1, 1), 1.6); x1 = 190 + (CR_HOME[0][0] - 190) * e1; s1 = 0.72 + 0.28 * e1; }
    x2 = x1; s2 = s1 * 0.8;
    if (c2 > 0) { var e2 = outBack(Math.min(c2, 1), 1.5); x2 = x1 + (CR_HOME[1][0] - CR_HOME[0][0]) * e2; s2 = s1 * (0.8 + 0.2 * e2); }
    var xs = [x1, x2], ss = [s1, s2], on = [c1 > 0, c2 > 0];
    for (var j = 0; j < 2; j++) {
      P.cr[j] = { x: P.x + xs[j] * K0, y: P.y + CR_HOME[j][1] * K0, a: CR_A * K0 * ss[j], th: CR_TH * K0 * ss[j], rot: 0, op: on[j] ? 1 : 0, tint: 0 };
    }
    if (t < 920) P.clipX = P.x + 236 * K0;
    return P;
  }

  // C, Código. Se teclea «ULima» y los «++» saltan del texto a la esquina de la estrella.
  var T_CHAR = [250, 318, 386, 454, 522], T_PLUS = [610, 680], FLY = [780, 830], FLY_D = 380;
  function codeStar(t) {
    var p = outCubic(seg(t, 0, 320));
    var y = lerp(CY, CY - 46 * S, p), k = lerp(K0, K0 * 0.8, p);
    var b = inOutCubic(seg(t, 820, 1210));
    y = lerp(y, CY, b); k = lerp(k, K0, b);
    var kb = seg(t, 1210, 1330);
    if (kb > 0 && kb < 1) k *= 1 + 0.035 * Math.sin(Math.PI * kb);
    return { x: CX, y: y, k: k };
  }
  function poseCodigo(t) {
    var P = basePose(), s = codeStar(t), j;
    P.x = s.x; P.y = s.y; P.k = s.k;
    var rk = seg(t, 1190, 1410);
    if (rk > 0 && rk < 1) P.ring = { r: R * lerp(1.02, 1.5, outCubic(rk)), w: lerp(1.8, 0.4, rk) * S / s.k, op: 0.38 * (1 - rk) };
    var nc = 0, np = 0;
    for (j = 0; j < T_CHAR.length; j++) if (t >= T_CHAR[j]) nc++;
    for (j = 0; j < 2; j++) if (t >= T_PLUS[j]) np++;
    var fade = seg(t, 790, 960);
    P.code = {
      n: nc, op: t >= T_CHAR[0] ? 1 - fade : 0, dy: outCubic(fade) * 8 * S,
      cx: LEFT + (t >= FLY[0] ? 5 : nc + np) * CW + S, cop: seg(t, 160, 240) * (1 - fade)
    };
    for (j = 0; j < 2; j++) {
      var T = T_PLUS[j];
      if (t < T) { P.cr[j].op = 0; continue; }
      var p0 = { x: LEFT + (5.5 + j) * CW, y: BASE - 0.34 * FS }, a0 = 0.25 * FS, th0 = 0.052 * FS;
      var pop = 0.55 + 0.45 * outBack(seg(t, T, T + 110), 1.70158);
      var c = { x: p0.x, y: p0.y, a: a0 * pop, th: th0 * pop, rot: 0, op: seg(t, T, T + 50), tint: 1 };
      var fl = seg(t, FLY[j], FLY[j] + FLY_D);
      if (fl > 0) {
        var e = inOutCubic(fl), tg = attached(j, codeStar(t), 1);
        var cx = tg.x + 26 * S, cy = Math.min(p0.y, tg.y) - 62 * S;
        c.x = quad(p0.x, cx, tg.x, e); c.y = quad(p0.y, cy, tg.y, e);
        c.a = lerp(a0, tg.a, e); c.th = lerp(th0, tg.th, e); c.rot = 90 * e; c.op = 1; c.tint = 1 - e;
      }
      if (fl >= 1) {
        var land = seg(t, FLY[j] + FLY_D, FLY[j] + FLY_D + 150), bump = 1 + 0.12 * Math.sin(Math.PI * land);
        c = attached(j, s, 1);
        c.a *= bump; c.th *= bump;
      }
      P.cr[j] = c;
    }
    return P;
  }

  var VARIANTS = ['ensamble', 'incremento', 'codigo'];
  var POSES = { ensamble: poseEnsamble, incremento: poseIncremento, codigo: poseCodigo };
  var INTRO_END = { ensamble: 1250, incremento: 1150, codigo: 1330 };
  var EXIT_DUR = { ensamble: 530, incremento: 620, codigo: 420 };
  // Instante en que se apaga el último efecto de cada intro. En Ensamble el segundo pulso de los
  // «++» termina en 930 + 150 + 300 = 1380 ms, después de INTRO_END, y el bucle de cuadros sigue
  // hasta entonces para que el anillo no quede congelado a medio desvanecer.
  var FX_END = { ensamble: 1400, incremento: 1230, codigo: 1410 };
  var variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length) % VARIANTS.length];
  try {
    // Para revisar una intro concreta se agrega ?intro=ensamble, ?intro=incremento o ?intro=codigo.
    var forcedIntro = /[?&]intro=(\w+)/.exec(win.location.search);
    if (forcedIntro && POSES[forcedIntro[1]]) variant = forcedIntro[1];
  } catch (e) { /* sin parámetros */ }
  root.setAttribute('data-intro', variant);

  var NATIVE = 450, HOLD = 650, introStart = null;
  function introT(ts) {
    if (reduce) return 1e6;
    if (introStart === null) return 0;
    return Math.max(ts - introStart - NATIVE, 0);
  }

  var WHITE = [255, 255, 255], TINT = [255, 231, 163];
  function drawCross(c, x, y, a, th, rot, sk, op, tint) {
    if (op <= 0.002 || a <= 0.01) { attr(c.g, 'opacity', '0'); return; }
    attr(c.g, 'opacity', f(op));
    attr(c.g, 'fill', tint > 0.01 ? mix(WHITE, TINT, tint) : '#fff');
    attr(c.g, 'transform', 'translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(rot) + ') skewX(' + f(sk) + ')');
    attr(c.h, 'x', f(-a)); attr(c.h, 'y', f(-th)); attr(c.h, 'width', f(2 * a)); attr(c.h, 'height', f(2 * th));
    attr(c.v, 'x', f(-th)); attr(c.v, 'y', f(-a)); attr(c.v, 'width', f(2 * th)); attr(c.v, 'height', f(2 * a));
  }

  function panelPath(h, qp) {
    if (variant === 'ensamble') {
      var bulge = 130 * Math.sin(Math.PI * qp);
      return 'M0 0H390V' + f(h) + 'Q195 ' + f(h + bulge) + ' 0 ' + f(h) + 'Z';
    }
    if (variant === 'incremento') {
      var rr = Math.min(75 * Math.sin(Math.PI * qp), h / 2);
      return 'M0 0H390V' + f(h - rr) + 'Q390 ' + f(h) + ' ' + f(390 - rr) + ' ' + f(h) + 'H' + f(rr) + 'Q0 ' + f(h) + ' 0 ' + f(h - rr) + 'Z';
    }
    return 'M0 0H390V' + f(h) + 'H0Z';
  }

  var mallaScr = null, lastP = -1;
  // Dibuja la intro en el instante de la animación, mezclada con la salida a la cabecera real
  // según p, de 0 (splash completo) a 1 (captura de la malla a la vista).
  function renderFx(ts, p) {
    if (p >= 1) {
      if (lastP < 1) {
        splash.style.display = 'none';
        glass.classList.remove('in-splash');
        if (mallaScr) { mallaScr.style.opacity = ''; mallaScr.style.transform = ''; }
      }
      lastP = p;
      return;
    }
    if (lastP >= 1 || lastP < 0) { splash.style.display = ''; glass.classList.add('in-splash'); }
    lastP = p;

    var t = introT(ts), P = POSES[variant](t), i, j;
    var q = inOutCubic(clamp(p / 0.92)), qp = inOutCubic(clamp(p / 0.9));
    var h = lerp(844, HEAD_H, qp);
    attr(n.panel, 'd', panelPath(h, qp));
    // El color llega al de la cabecera antes de que se abra la ventana de «ULIMA», para que no se note el borde.
    attr(n.panel, 'fill', mix(SPLASH, HEAD, clamp((qp - 0.35) / 0.4)));
    attr(n.panelg, 'opacity', f(1 - seg(p, 0.88, 1)));

    var x = quad(P.x, CTRL[0], HX, q), y = quad(P.y, CTRL[1], HY, q), k = P.k * Math.pow(KE / P.k, q);
    attr(n.logo, 'transform', 'translate(' + f(x) + ' ' + f(y) + ') scale(' + k.toFixed(5) + ')');
    attr(n.logo, 'opacity', f(1 - seg(q, 0.62, 1)));
    attr(n.starg, 'transform', 'rotate(' + f(P.rot) + ')');
    attr(n.inner, 'transform', 'scale(' + lerp(P.inS, 1, q).toFixed(4) + ')');
    for (i = 0; i < 8; i++) {
      var r = P.rh[i], m = 1 - q, ccx = DIR[i][0] * CENTROID, ccy = DIR[i][1] * CENTROID;
      attr(rhEls[i], 'transform', 'rotate(' + f(r.rot * m) + ') translate(' + f(r.tx * m) + ' ' + f(r.ty * m) + ') translate(' + f(ccx) + ' ' + f(ccy) + ') scale(' + lerp(r.sc, 1, q).toFixed(4) + ') translate(' + f(-ccx) + ' ' + f(-ccy) + ')');
      attr(rhEls[i], 'opacity', f(lerp(r.op, 1, q)));
    }

    var fxOut = 1 - clamp(p / 0.3);
    if (P.ring && fxOut > 0) {
      attr(n.ring, 'r', f(P.ring.r)); attr(n.ring, 'stroke-width', f(P.ring.w)); attr(n.ring, 'opacity', f(P.ring.op * fxOut));
    } else attr(n.ring, 'opacity', '0');
    if (P.glint >= 0 && fxOut > 0) {
      var mm = lerp(-560, 560, P.glint), env = Math.sin(Math.PI * P.glint) * fxOut;
      attr(n.band, 'transform', 'translate(' + f(mm * 0.7071) + ' ' + f(-mm * 0.7071) + ') rotate(-45)');
      attr(n.glint, 'opacity', f(env));
      attr(n.sweep, 'transform', 'translate(' + f(P.x + mm * P.k * 0.7071) + ' ' + f(P.y - mm * P.k * 0.7071) + ') rotate(-45)');
      attr(n.sweep, 'opacity', f(env));
    } else { attr(n.glint, 'opacity', '0'); attr(n.sweep, 'opacity', '0'); }
    for (j = 0; j < 2; j++) {
      var pj = P.pr[j];
      if (pj && fxOut > 0) {
        attr(pr[j], 'cx', f(pj.x)); attr(pr[j], 'cy', f(pj.y)); attr(pr[j], 'r', f(pj.r));
        attr(pr[j], 'stroke-width', f(pj.w)); attr(pr[j], 'opacity', f(pj.op * fxOut));
      } else attr(pr[j], 'opacity', '0');
    }
    attr(n.crClip, 'x', P.clipX != null && p <= 0 ? f(P.clipX) : '-400');

    // Los «++» vuelan a los del texto de la cabecera y se funden con ellos en el último 25 %.
    var ppFade = seg(p, 0.75, 1);
    for (j = 0; j < 2; j++) {
      var c = P.cr[j], qj = inOutCubic(clamp((p - j * 0.04) / 0.96));
      var src = (c.op < 0.01 && qj > 0) ? attached(j, P, 0) : c;
      var cx2 = quad(src.x, src.x, PP_X[j], qj), cy2 = quad(src.y, PP_Y, PP_Y, qj);
      var a = src.a > 0.01 ? src.a * Math.pow(PP_A / src.a, qj) : PP_A * qj;
      var th = src.th > 0.01 ? src.th * Math.pow(PP_TH / src.th, qj) : PP_TH * qj;
      drawCross(crEls[j], cx2, cy2, a, th, (src.rot || 0) * (1 - qj), PP_SK * qj, lerp(src.op, 1, qj) * (1 - ppFade), (src.tint || 0) * (1 - qj));
    }

    if (P.code && P.code.op * fxOut > 0.002) {
      var txt = 'ULima'.slice(0, P.code.n);
      if (n.code.textContent !== txt) n.code.textContent = txt;
      attr(n.code, 'opacity', f(P.code.op * fxOut));
      attr(n.code, 'transform', 'translate(0 ' + f(P.code.dy) + ')');
    } else attr(n.code, 'opacity', '0');
    if (P.code && P.code.cop * fxOut > 0.002) {
      attr(n.caret, 'x', f(P.code.cx)); attr(n.caret, 'y', f(BASE - 23.4 + P.code.dy)); attr(n.caret, 'opacity', f(P.code.cop * fxOut));
    } else attr(n.caret, 'opacity', '0');

    // «ULIMA» aparece de izquierda a derecha por una ventana del panel que deja ver la cabecera
    // de la captura; en Código se teclea letra por letra.
    var wm;
    if (variant === 'codigo') {
      var letters = Math.floor(clamp((p - 0.55) / 0.07, 0, 5.99)) + (p >= 0.55 ? 1 : 0);
      wm = letters > 0 ? WM_STOPS[Math.min(letters, 5) - 1] : 0;
    } else wm = outCubic(seg(p, 0.68, 1)) * WM_W;
    attr(n.holeWm, 'width', f(wm));
    attr(n.holePp, 'fill-opacity', f(ppFade));

    // La pantalla de destino sube 20 dp y aparece como un todo entre el 30 % y el 70 %.
    if (mallaScr) {
      var ob = outCubic(seg(p, 0.3, 0.7));
      mallaScr.style.opacity = f(ob);
      mallaScr.style.transform = 'translateY(' + f(20 * (1 - ob) * L.gw / 390) + 'px)';
    }
  }

  /* ---------- 4. Scrollytelling ---------- */
  var nav = doc.querySelector('.nav'), hero = $('hero'), story = doc.querySelector('.story');
  var stage = $('stage'), rig = $('rig'), phone = $('phone'), cue = $('cue');
  var stepsBox = $('steps'), steps = all('.step'), copies = steps.map(function (s) { return s.querySelector('.copy'); });
  var scrs = {};
  all('.scr', rig).forEach(function (s) { scrs[s.getAttribute('data-scr')] = s; });
  mallaScr = scrs.malla;

  var L = { vh: 0, vw: 0, wide: false, navH: 56, gw: 280, copyMid: [], heroDx: 0 };
  function measure() {
    L.vh = win.innerHeight;
    L.vw = root.clientWidth || win.innerWidth;
    L.wide = !!(mqWide && mqWide.matches);
    syncShots();
    L.navH = nav.offsetHeight;
    L.gw = glass.getBoundingClientRect().width || L.gw;
    var sy = win.pageYOffset;
    // Centro vertical de cada texto en la página. Su transición solo lo mueve en horizontal.
    L.copyMid = copies.map(function (c) {
      if (!c) return null;
      var r = c.getBoundingClientRect();
      return r.top + sy + r.height / 2;
    });
    if (L.wide) {
      // Al inicio el teléfono queda a la derecha del texto de la portada y se centra al bajar.
      var hr = hero.getBoundingClientRect(), pad = parseFloat(getComputedStyle(stage).paddingRight) || 32;
      var pw = phone.getBoundingClientRect().width, target = (hr.right + L.vw - pad) / 2;
      target = Math.min(target, L.vw - pad - pw / 2);
      L.heroDx = Math.max(0, target - L.vw / 2);
    } else L.heroDx = 0;
    measureCode();
  }

  // El paso activo es el del texto más cercano al centro de la zona visible, así el texto que se
  // lee nunca queda atenuado. Mientras el primero no asoma hasta su mitad, sigue la portada.
  function activeIndex(y) {
    var mid = y + L.navH + (L.vh - L.navH) / 2, idx = 0, best = Infinity;
    for (var i = 1; i < steps.length; i++) {
      var m = L.copyMid[i];
      if (m == null) continue;
      if (Math.abs(m - mid) < best) { best = Math.abs(m - mid); idx = i; }
    }
    return idx && L.copyMid[idx] > y + L.vh ? 0 : idx;
  }

  var cur = null, swTimer = 0, dlTimer = 0;
  function startDownload() { clearTimeout(dlTimer); if (scrs.sys1) scrs.sys1.classList.remove('is-dl'); }
  function setScreen(name, install) {
    if (name === cur) return;
    cur = name;
    Object.keys(scrs).forEach(function (k) { scrs[k].classList.toggle('is-on', k === name); });
    // La barra de estado y la de inicio toman el tono que pide la captura de esta pantalla.
    var sc = scrs[name];
    // Un cambio dentro de la misma pantalla, como una pestaña, un botón o una hoja que se abre, entra
    // en su lugar y sin deslizarse (data-cf).
    glass.classList.toggle('cf', !!(sc && sc.hasAttribute('data-cf')));
    glass.setAttribute('data-hb', (sc && sc.getAttribute('data-hb')) || 'cc');
    if (sc && sc.hasAttribute('data-sb')) glass.setAttribute('data-sb', sc.getAttribute('data-sb'));
    else glass.removeAttribute('data-sb');
    stage.classList.toggle('is-install', !!install);
    // En el paso 1 la descarga avanza hasta «Abrir» cuando el recorrido enciende su aviso (o a los
    // 4 s, si no llega), y en el paso 2 el interruptor se enciende solo, salvo con movimiento
    // reducido.
    clearTimeout(swTimer); clearTimeout(dlTimer);
    if (scrs.sys1) {
      if (name === 'sys1' && !reduce) {
        scrs.sys1.classList.add('is-dl');
        dlTimer = setTimeout(startDownload, 4000);
      } else scrs.sys1.classList.remove('is-dl');
    }
    if (scrs.sys2) {
      if (name === 'sys2' && !reduce) {
        scrs.sys2.classList.add('is-off');
        swTimer = setTimeout(function () { scrs.sys2.classList.remove('is-off'); }, 700);
      } else scrs.sys2.classList.remove('is-off');
    }
  }

  /* ---------- 5. Detalles sobre la captura ---------- */
  // Cada paso recorre sus momentos (data-beats) mientras su texto está activo. En cada momento, el
  // resto de la pantalla se oscurece un instante y queda bajo un velo suave, la zona sube en una
  // lupa, apenas en las zonas grandes y hasta 2,6 veces en las chicas, un anillo marca un borde
  // libre de la zona y en el texto se marca la frase que la explica (data-b). Los momentos
  // principales («*») duran más que los de paso. Al terminar, el velo se levanta y quedan la lupa
  // y el anillo sobre la pantalla en color. Con movimiento reducido no hay recorrido y se ven
  // quietas, sin zoom y a la vez, las zonas principales (o la última, si ninguna lo está).
  var SEC = 1100, MAIN = 1700, SWAP = 450, REVEAL = 480, REST = 2400, CALM = 900, RING = 24;

  function nums(s) { return s.trim().split(/\s+/).filter(Boolean).map(Number); }
  // Un momento es «[*][pantalla:] x y ancho alto [radio] [~t|~b|~o|~n][, otra zona] [@x y | @x y
  // ancho alto] [^y ...]».
  function parseBeats(str, home) {
    var out = [];
    (str || '').split('|').forEach(function (b, i) {
      var o = { i: i, scr: home, z: [], mark: null, rev: [], main: false }, m, k, q;
      b = b.trim();
      if (b.charAt(0) === '*') { o.main = true; b = b.slice(1); }
      m = /^\s*([a-z0-9-]+):/.exec(b);
      if (m) { o.scr = m[1]; b = b.slice(m[0].length); }
      k = b.indexOf('^');
      if (k >= 0) { o.rev = nums(b.slice(k + 1)).filter(isFinite); b = b.slice(0, k); }
      k = b.indexOf('@');
      q = k >= 0 ? nums(b.slice(k + 1)) : [];
      if ((q.length === 2 || q.length === 4) && q.every(isFinite)) o.mark = q;
      (k >= 0 ? b.slice(0, k) : b).split(',').forEach(function (r) {
        var h = /~([tbno])/.exec(r), v = nums(r.replace(/~[a-z]/g, ''));
        if ((v.length === 4 || v.length === 5) && v.every(isFinite)) { v.ring = h ? h[1] : ''; o.z.push(v); }
      });
      if (o.z.length) out.push(o);
    });
    return out;
  }
  // Los momentos que se ven a la vez con movimiento reducido, todos en la misma pantalla.
  function mainBeats(beats) {
    var m = beats.filter(function (b) { return b.main; });
    if (!m.length) m = beats.slice(-1);
    var sc = m[m.length - 1].scr;
    return m.filter(function (b) { return b.scr === sc; });
  }

  function pct(v) { return f(v * 100) + '%'; }
  function box(el, x, y, w, h) {
    el.style.left = pct(x / 390); el.style.top = pct(y / 844);
    el.style.width = pct(w / 390); el.style.height = pct(h / 844);
  }
  function radius(z) { return z.length > 4 ? z[4] : 14; }
  function inside(z, x, y) { return x >= z[0] && x <= z[0] + z[2] && y >= z[1] && y <= z[1] + z[3]; }

  // La lupa de una zona crece desde su centro. Una zona grande sube apenas; una chica, como una
  // insignia, un botón o una línea de texto, se amplía hasta que se lee (2,6 veces como mucho). Si la
  // lupa no cabe, se corre lo justo para quedar entre la barra de estado y la de inicio. Con [flat]
  // (movimiento reducido) no hay zoom.
  var LENS_T = 140, LENS_MAX = 2.6, SAFE = [4, 27, 386, 826];
  function lensGeo(z, flat) {
    var w = z[2], h = z[3], m = Math.max(w, h), cx = z[0] + w / 2, cy = z[1] + h / 2, s = 1;
    if (!flat) {
      var n = Math.min(w, h);
      s = Math.max(LENS_T / m, n < 70 ? clamp(46 / n, 1.25, LENS_MAX) : 1, 1 + Math.min(0.07, 12 / m));
      s = Math.max(1, Math.min(s, LENS_MAX, (SAFE[2] - SAFE[0]) / w, (SAFE[3] - SAFE[1]) / h));
    }
    var hw = w * s / 2, hh = h * s / 2, dx = 0, dy = 0;
    if (s > 1) {
      if (cx - hw < SAFE[0]) dx = SAFE[0] - cx + hw; else if (cx + hw > SAFE[2]) dx = SAFE[2] - cx - hw;
      if (cy - hh < SAFE[1]) dy = SAFE[1] - cy + hh; else if (cy + hh > SAFE[3]) dy = SAFE[3] - cy - hh;
    }
    return { z: z, s: s, dx: dx, dy: dy, x0: cx + dx - hw, y0: cy + dy - hh, x1: cx + dx + hw, y1: cy + dy + hh };
  }
  // Un punto de la zona tal como queda en su lupa.
  function onLens(g, x, y) {
    var z = g.z, cx = z[0] + z[2] / 2, cy = z[1] + z[3] / 2;
    return [cx + g.dx + (x - cx) * g.s, cy + g.dy + (y - cy) * g.s, g.s];
  }
  // Centro del anillo. Toca desde afuera, con 5 puntos adentro, el borde de la lupa que mira al
  // texto, a media altura. Si ahí no cabe entero en la pantalla, va al borde de arriba o al de abajo,
  // junto a la esquina que mira al texto. Una zona puede pedir otro borde, ~t arriba o ~b abajo (al
  // medio del borde) u ~o el lado opuesto al texto. Así nunca cae dentro de lo que la zona muestra.
  // Con ~n la zona no lleva anillo.
  var RING_OUT = RING / 2 - 5, RING_M = RING / 2 + 5;
  function ringAt(g, side) {
    var hint = g.z.ring, l = (side === 'l') !== (hint === 'o');
    if (hint === 'n') return null;
    var mid = (g.x0 + g.x1) / 2, ex = hint === 't' || hint === 'b' ? mid : l ? Math.min(g.x0 + RING, mid) : Math.max(g.x1 - RING, mid);
    var sid = [l ? g.x0 - RING_OUT : g.x1 + RING_OUT, (g.y0 + g.y1) / 2];
    var top = [ex, g.y0 - RING_OUT], bot = [ex, g.y1 + RING_OUT];
    var order = hint === 't' ? [top, bot, sid] : hint === 'b' ? [bot, top, sid] : [sid, top, bot];
    for (var i = 0; i < order.length; i++) {
      var p = order[i];
      if (p[0] >= RING_M && p[0] <= 390 - RING_M && p[1] >= 24 + RING_M && p[1] <= 828 - RING_M) return p;
    }
    return [clamp(sid[0], RING_M, 390 - RING_M), sid[1]];
  }

  // El velo cubre la pantalla entera y se recorta con clip-path, con un hueco por zona (hasta tres),
  // así moverlo no desplaza nada en la página. Cada hueco queda 5 puntos adentro de su zona, bajo la
  // lupa, una zona que cabe dentro de otra no abre hueco propio y los huecos que sobran se reducen a
  // un punto para que el paso entre momentos sea continuo.
  var HOLES = 3;
  function dimClip(zs) {
    var hs = zs.filter(function (z, j) {
      return !zs.some(function (o, k) { return k !== j && k < j && inside(o, z[0], z[1]) && inside(o, z[0] + z[2], z[1] + z[3]); });
    }).slice(0, HOLES).map(function (z) {
      // Con esquinas más redondas, como un círculo, el hueco se achica para quedar bajo la lupa.
      var i = Math.min(Math.max(5, 1 + 0.3 * radius(z)), z[2] / 4, z[3] / 4);
      return [z[0] + i, z[1] + i, z[0] + z[2] - i, z[1] + z[3] - i];
    });
    var c = hs[0], mx = (c[0] + c[2]) / 2, my = (c[1] + c[3]) / 2;
    while (hs.length < HOLES) hs.push([mx, my, mx, my]);
    function p(x, y) { return pct(x / 390) + ' ' + pct(y / 844); }
    var d = ['0% 0%', '100% 0%', '100% 100%', '0% 100%', '0% 0%'];
    hs.forEach(function (h) { d.push(p(h[0], h[1]), p(h[0], h[3]), p(h[2], h[3]), p(h[2], h[1]), p(h[0], h[1]), '0% 0%'); });
    return 'polygon(evenodd, ' + d.join(', ') + ')';
  }
  function instant(el, fn) {
    el.style.transition = 'none'; fn(); void el.offsetWidth; el.style.transition = '';
  }

  function makeSpot(g) {
    var hl = doc.createElement('div'), dim = doc.createElement('i');
    hl.className = 'hl'; hl.setAttribute('aria-hidden', 'true');
    dim.className = 'spot'; hl.appendChild(dim);
    g.insertBefore(hl, g.querySelector('.chrome'));
    return { box: hl, glass: g, dim: dim, marks: [], timers: [], lead: null, end: null };
  }
  function later(S, ms, fn) { S.timers.push(setTimeout(fn, ms)); }
  function stopTour(S) { S.timers.forEach(clearTimeout); S.timers = []; }
  function capsOf(src) {
    return Array.prototype.filter.call(src ? src.children : [], function (c) {
      return c.classList && (c.classList.contains('cap') || c.classList.contains('sx'));
    });
  }
  function srcsetOf(c) { return c.getAttribute('srcset') || c.getAttribute('data-srcset'); }
  function srcOf(c) { return c.getAttribute('data-src') || c.getAttribute('src'); }
  // Copia las capturas de una pantalla en [dest]. Una imagen copiada con cloneNode empieza a bajar
  // antes de entrar a la página, y ahí la carga diferida no la frena. Por eso cada imagen se crea
  // vacía y recibe su fuente ya insertada, así la del tema que no se ve (display: none) no se baja.
  // Con [hi], la copia suma la captura de 1170 px del tema activo, sin diferir, y pide el ancho de la
  // lupa ampliada, para que una zona chica ampliada se vea nítida. Va encima de la copia normal, que
  // ya está en caché y se ve mientras la grande llega.
  function copyCaps(caps, dest, hi) {
    var back = [];
    caps.forEach(function (c) {
      var k, set = c.tagName === 'IMG' ? srcsetOf(c) : null;
      if (c.tagName === 'IMG') {
        if (hi && (!/-720\.webp/.test(set || '') || !c.classList.contains(isDark() ? 'cap-oscuro' : 'cap-claro'))) return;
        k = doc.createElement('img');
        k.className = c.className + (hi ? ' hi' : ''); k.alt = '';
        k.setAttribute('loading', hi ? 'eager' : 'lazy'); k.setAttribute('decoding', 'async');
        if (hi) {
          var big = /(\S+)-720\.webp/.exec(set)[1] + '-1170.webp';
          set += ', ' + big + ' 1170w';
          k.setAttribute('sizes', hi);
        } else k.setAttribute('sizes', c.getAttribute('sizes') || '');
        back.push([k, set, srcOf(c)]);
      } else {
        if (hi) return;
        k = c.cloneNode(true);
        k.removeAttribute('role'); k.removeAttribute('aria-label');
      }
      dest.appendChild(k);
    });
    return function () { back.forEach(function (x) { if (x[1]) x[0].setAttribute('srcset', x[1]); if (x[2]) x[0].setAttribute('src', x[2]); }); };
  }

  function dropMarks(S, now) {
    S.marks.forEach(function (l) {
      l.classList.remove('is-on');
      if (now || reduce) { if (l.parentNode) l.parentNode.removeChild(l); }
      else setTimeout(function () { if (l.parentNode) l.parentNode.removeChild(l); }, 420);
    });
    S.marks = [];
    S.lead = null;
  }
  function addMark(S, el, wasOn, now) {
    S.box.appendChild(el);
    S.marks.push(el);
    if (reduce || now) el.classList.add('is-on');
    else later(S, wasOn ? 380 : 200, function () { el.classList.add('is-on'); });
  }
  // La lupa es una copia de la captura recortada a la zona, que sube sobre el resto.
  function addLens(S, g, caps, wasOn, hi, now) {
    var z = g.z, lens = doc.createElement('div'), inner = doc.createElement('div');
    lens.className = 'lens';
    box(lens, z[0], z[1], z[2], z[3]);
    lens.style.setProperty('--s', g.s.toFixed(3));
    lens.style.setProperty('--dx', f(g.dx));
    lens.style.setProperty('--dy', f(g.dy));
    // Las esquinas se ven con el mismo radio con cualquier zoom, y un círculo o una píldora siguen
    // siéndolo.
    var r = radius(z), half = Math.min(z[2], z[3]) / 2;
    lens.style.setProperty('--br', 'calc(var(--u) * ' + f(r >= half - 0.25 ? half : r / g.s) + ')');
    // El halo de una zona baja no pasa de un 40 % de su alto, así no tapa la línea de arriba.
    lens.style.setProperty('--hs', f(Math.min(16, 0.4 * Math.min(z[2], z[3])) / g.s));
    lens.style.setProperty('--iw', pct(390 / z[2]));
    lens.style.setProperty('--ih', pct(844 / z[3]));
    lens.style.setProperty('--ix', pct(-z[0] / z[2]));
    lens.style.setProperty('--iy', pct(-z[1] / z[3]));
    var load = copyCaps(caps, inner);
    var gw = S.glass.getBoundingClientRect().width || L.gw;
    var loadHi = hi && g.s >= 1.3 ? copyCaps(caps, inner, Math.round(gw * g.s) + 'px') : null;
    lens.appendChild(inner);
    addMark(S, lens, wasOn, now);
    load();
    if (loadHi) loadHi();
  }
  function addRing(S, x, y, w, h, pill, wasOn, now) {
    var r = doc.createElement('span');
    r.className = pill ? 'ring pill' : 'ring';
    box(r, x - w / 2, y - h / 2, w, h);
    addMark(S, r, wasOn, now);
  }
  // Los anillos de un momento. Uno en un borde libre de cada lupa, del lado del texto cuando cabe, y
  // otro opcional sobre un elemento chico (@x y) o una píldora que lo rodea con 3 puntos de aire
  // (@x y ancho alto), los dos con el zoom de la lupa que los contiene. La línea guía del escritorio
  // llega al canto del teléfono a la altura del primero.
  function addRings(S, b, gs, side, wasOn, one, now) {
    var done = false;
    gs.forEach(function (g) {
      var p = one && done ? null : ringAt(g, side);
      if (!p) return;
      done = true;
      if (!S.lead) S.lead = { y: p[1] };
      addRing(S, p[0], p[1], RING, RING, false, wasOn, now);
    });
    if (!S.lead) S.lead = { y: (gs[0].y0 + gs[0].y1) / 2 };
    var q = b.mark, g0 = gs[0];
    if (!q) return;
    var cx = q.length === 4 ? q[0] + q[2] / 2 : q[0], cy = q.length === 4 ? q[1] + q[3] / 2 : q[1];
    var at = inside(g0.z, cx, cy) ? onLens(g0, cx, cy) : [cx, cy, 1];
    if (q.length === 4) addRing(S, at[0], at[1], (q[2] + 6) * at[2], (q[3] + 6) * at[2], true, wasOn, now);
    else addRing(S, at[0], at[1], RING + 10, RING + 10, false, wasOn, now);
  }
  function hideSpot(S, now) { S.box.classList.remove('is-on', 'is-rest', 'is-calm'); dropMarks(S, now); }
  function showBeat(S, b, src, side, hi, now) {
    var wasOn = S.box.classList.contains('is-on'), caps = capsOf(src), c = dimClip(b.z);
    if (wasOn && !now && !S.box.classList.contains('is-rest')) S.dim.style.clipPath = c;
    else instant(S.dim, function () { S.dim.style.clipPath = c; });
    S.box.classList.remove('is-rest', 'is-calm');
    S.box.classList.add('is-on');
    dropMarks(S, now);
    var gs = b.z.map(function (z) { return lensGeo(z, false); });
    gs.forEach(function (g) { addLens(S, g, caps, wasOn, hi, now); });
    addRings(S, b, gs, side, wasOn, false, now);
    // Tras el primer instante, el velo se aclara para que la pantalla siga en color.
    if (!now) later(S, CALM, function () { S.box.classList.add('is-calm'); });
  }
  // Las zonas principales a la vez, sin velo, sin zoom y con un solo anillo por momento.
  function showAll(S, list, src, side) {
    S.box.classList.remove('is-on', 'is-calm');
    dropMarks(S, true);
    var caps = capsOf(src), gl = list.map(function (b) { return b.z.map(function (z) { return lensGeo(z, true); }); });
    gl.forEach(function (gs) { gs.forEach(function (g) { addLens(S, g, caps, true); }); });
    list.forEach(function (b, k) { addRings(S, b, gl[k], side, true, true); });
  }
  function phrase(i, ks) {
    if (!copies[i]) return;
    all('.hl-f', copies[i]).forEach(function (el) {
      var own = (el.getAttribute('data-b') || '').split(/\s+/).map(Number);
      el.classList.toggle('is-on', own.some(function (k) { return ks.indexOf(k) >= 0; }));
    });
  }

  // Burbujas que aparecen una tras otra. Una tapa del color del fondo del chat cubre la
  // conversación de la captura entre las alturas de data-rev y se corre hacia abajo hasta cada
  // línea «^y» del momento. No agrega nada, solo deja ver la captura por partes.
  function makeCover(host, spec) {
    var v = nums(spec || '');
    if (v.length !== 2) return null;
    var c = doc.createElement('i');
    c.className = 'rev'; c.setAttribute('aria-hidden', 'true');
    box(c, 0, v[0], 390, v[1] - v[0]);
    host.insertBefore(c, host.querySelector('.chrome'));
    return { el: c, top: v[0], bot: v[1] };
  }
  function setCover(cv, y, now) {
    if (!cv) return;
    var set = function () { cv.el.style.clipPath = 'inset(' + pct(clamp((y - cv.top) / (cv.bot - cv.top))) + ' 0 0 0)'; };
    if (now) instant(cv.el, set); else set();
  }
  function hideBubbles(beats, covers) {
    beats.forEach(function (b) { var cv = covers[b.scr]; if (b.rev.length && cv) setCover(cv, cv.top, true); });
  }
  function showBubbles(covers) { Object.keys(covers).forEach(function (k) { setCover(covers[k], 1e5, true); }); }
  // Las pantallas que tienen captura de 1170 px para las lupas que amplían mucho.
  function hiOf(name) { var sc = scrs[name]; return !!(sc && sc.hasAttribute('data-hi')); }

  // Recorre los momentos uno tras otro. Si un momento cambia de pantalla, primero se apaga el foco
  // sin esperar, entra la pantalla nueva y después se enciende en ella. Al final se levanta el velo.
  // S.end detiene el recorrido y deja su estado final, la última zona con su anillo y sin velo.
  function play(S, beats, o) {
    stopTour(S);
    S.end = null;
    if (!beats.length) return;
    if (reduce) {
      var ms = mainBeats(beats), sc = ms[0].scr;
      o.reveal(null);
      if (sc !== o.scr0) o.setScr(sc);
      showAll(S, ms, o.src(sc), o.side());
      o.phr(ms.map(function (b) { return b.i; }));
      if (o.at) o.at(ms[ms.length - 1]);
      o.beat();
      return;
    }
    var t = o.delay, cur = o.scr0, last = beats[beats.length - 1];
    beats.forEach(function (b) {
      if (b.scr !== cur) {
        later(S, t, function () { hideSpot(S, true); o.beat(); o.setScr(b.scr); });
        t += SWAP; cur = b.scr;
      }
      b.rev.forEach(function (y) { later(S, t, function () { o.reveal(b.scr, y); }); t += REVEAL; });
      later(S, t, function () {
        showBeat(S, b, o.src(b.scr), o.side(), hiOf(b.scr));
        o.phr([b.i]);
        if (o.at) o.at(b);
        o.beat();
      });
      t += b.main ? MAIN : SEC;
    });
    later(S, t - (last.main ? MAIN : SEC) + REST, function () { S.box.classList.add('is-rest'); S.end = null; o.beat(); });
    S.end = function () {
      stopTour(S);
      S.end = null;
      o.setScr(last.scr);
      o.reveal(null);
      showBeat(S, last, o.src(last.scr), o.side(), hiOf(last.scr), true);
      S.box.classList.add('is-rest');
      o.phr([last.i]);
      if (o.at) o.at(last);
      o.beat();
    };
  }
  function noop() {}

  var beatsOf = steps.map(function (s) { return parseBeats(s.getAttribute('data-beats'), s.getAttribute('data-screen')); });
  function sideOf(i) { return steps[i].getAttribute('data-side') || 'r'; }

  // Tapas del teléfono fijo, una por pantalla con data-rev.
  var rigCovers = {};
  Object.keys(scrs).forEach(function (k) {
    var cv = makeCover(scrs[k], scrs[k].getAttribute('data-rev'));
    if (cv) rigCovers[k] = cv;
  });

  // Las pantallas del teléfono fijo, salvo las del primer paso, traen su fuente en data-srcset y
  // data-src, así no bajan todas al abrir la página. Se cargan las de un paso cuando ese paso está
  // cerca de la vista.
  function hydrate(sc) {
    if (!sc || sc.hydrated) return;
    sc.hydrated = true;
    all('img[data-src]', sc).forEach(function (im) {
      if (im.hasAttribute('data-srcset')) im.setAttribute('srcset', im.getAttribute('data-srcset'));
      im.setAttribute('src', im.getAttribute('data-src'));
      im.removeAttribute('data-srcset'); im.removeAttribute('data-src');
    });
  }
  function hydrateNear(i) {
    for (var k = Math.max(1, i - 1); k <= i + 2 && k < steps.length; k++) {
      hydrate(scrs[steps[k].getAttribute('data-screen')]);
      beatsOf[k].forEach(function (b) { hydrate(scrs[b.scr]); });
    }
  }

  // Recorrido del teléfono fijo, con su paso activo, la pantalla que muestra y el anillo de la línea.
  var T = { idx: -1, scr: null, lead: null, spot: null };
  function startRigTour(i) {
    if (!T.spot) T.spot = makeSpot(glass);
    stopTour(T.spot);
    T.spot.end = null;
    if (T.idx > 0) phrase(T.idx, []);
    hideSpot(T.spot, true);
    T.idx = i; T.scr = null; T.lead = null;
    if (i <= 0) return;
    hydrateNear(i);
    var bs = beatsOf[i];
    T.scr = bs.length ? bs[0].scr : steps[i].getAttribute('data-screen');
    if (!reduce) hideBubbles(bs, rigCovers);
    play(T.spot, bs, {
      delay: 300, scr0: T.scr,
      side: function () { return sideOf(i); },
      setScr: function (n) { T.scr = n; requestRender(); },
      src: function (n) { return scrs[n]; },
      reveal: function (n, y) { if (n == null) showBubbles(rigCovers); else setCover(rigCovers[n], y); },
      phr: function (ks) { phrase(i, ks); },
      at: function (b) { if (b.scr === 'sys1' && b.i >= 1) startDownload(); },
      beat: function () { T.lead = T.spot.lead; requestRender(); }
    });
  }

  // Recorridos de las capturas apiladas. Cada figura corre los momentos de su paso al quedar a la
  // vista, y las pantallas de los momentos que no son la suya entran como capas encima.
  var shotTours = [];
  function prepShot(s) {
    if (s.ready) return;
    s.ready = true;
    var chrome = s.glass.querySelector('.chrome');
    s.beats.forEach(function (b) {
      var name = b.scr, r = scrs[name];
      if (name === s.scr || !r || s.layers[name]) return;
      var lay = doc.createElement('div');
      lay.className = 'lay'; lay.setAttribute('aria-hidden', 'true');
      s.glass.insertBefore(lay, chrome);
      copyCaps(capsOf(r), lay)();
      s.layers[name] = lay;
      s.covers[name] = makeCover(lay, r.getAttribute('data-rev'));
    });
    if (scrs[s.scr]) s.covers[s.scr] = makeCover(s.glass, scrs[s.scr].getAttribute('data-rev'));
  }
  function figScreen(s, name) {
    s.cur = name;
    Object.keys(s.layers).forEach(function (k) { s.layers[k].classList.toggle('is-on', k === name); });
    // La barra de estado y la de inicio toman el tono de la pantalla a la vista.
    var r = scrs[name];
    if (!r) return;
    s.glass.setAttribute('data-hb', r.getAttribute('data-hb') || 'cc');
    if (r.hasAttribute('data-sb')) s.glass.setAttribute('data-sb', r.getAttribute('data-sb'));
    else s.glass.removeAttribute('data-sb');
  }
  function firstScreen(s) {
    if (!s.beats.length) return s.scr;
    return reduce ? mainBeats(s.beats)[0].scr : s.beats[0].scr;
  }
  // En el modo apilado el texto va arriba o al lado de la captura, así que el anillo va a la derecha
  // de la zona en el celular y, desde 600 px, del lado del texto.
  function shotSide(s) {
    if (L.vw < 600) return 'r';
    return sideOf(s.i) === 'l' ? 'r' : 'l';
  }
  function playShot(s) {
    prepShot(s);
    if (!s.spot) s.spot = makeSpot(s.glass);
    figScreen(s, firstScreen(s));
    if (!reduce) hideBubbles(s.beats, s.covers);
    play(s.spot, s.beats, {
      delay: 300, scr0: s.cur,
      side: function () { return shotSide(s); },
      setScr: function (n) { figScreen(s, n); },
      src: function (n) { return s.layers[n] || s.glass; },
      reveal: function (n, y) { if (n == null) showBubbles(s.covers); else setCover(s.covers[n], y); },
      phr: function (ks) { phrase(s.i, ks); },
      beat: noop
    });
  }
  // Al salir de la vista, la figura vuelve a la pantalla con la que empieza, así no reaparece en una
  // pantalla intermedia cuando se sube de nuevo hasta ella.
  function stopShot(s) {
    if (!s.spot) return;
    stopTour(s.spot); s.spot.end = null; hideSpot(s.spot, true); phrase(s.i, []);
    if (s.ready) figScreen(s, firstScreen(s));
  }
  var TH = [];
  for (var th = 0; th <= 20; th++) TH.push(th / 20);
  var shotIO = 'IntersectionObserver' in win ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var s = e.target.tour;
      if (!s) return;
      if (e.isIntersecting && e.intersectionRatio > 0.08) {
        s.fig.classList.add('in');
        // Al asomar, la figura ya muestra la pantalla con la que empieza su recorrido.
        if (!L.wide && !s.primed) { s.primed = true; prepShot(s); figScreen(s, firstScreen(s)); }
      }
      // La parte visible se mide contra lo que cabe en la ventana, así una figura más alta que la
      // ventana, como en un celular apaisado, también arranca su recorrido.
      var vh = e.rootBounds ? e.rootBounds.height : L.vh;
      var room = Math.min(e.boundingClientRect.height, vh) || 1;
      var vis = e.isIntersecting && e.intersectionRect.height / room >= 0.6;
      if (vis === s.on) return;
      s.on = vis;
      if (L.wide) return;
      if (vis) playShot(s); else stopShot(s);
    });
  }, { threshold: TH }) : null;
  // Las capas de una figura se arman una pantalla antes de que asome, así sus capturas ya bajaron
  // cuando empieza su recorrido.
  var prepIO = 'IntersectionObserver' in win ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var s = e.target.tour;
      if (s && e.isIntersecting && !L.wide) { prepShot(s); prepIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px 100% 0px' }) : null;
  all('.shot').forEach(function (fig) {
    var st = fig.closest ? fig.closest('.step') : null, i = steps.indexOf(st);
    if (i < 1 || !shotIO) return;
    var s = {
      fig: fig, glass: fig.querySelector('.glass'), i: i, scr: fig.getAttribute('data-scr'), cur: null,
      on: false, spot: null, ready: false, primed: false, layers: {}, covers: {}, beats: beatsOf[i]
    };
    fig.tour = s;
    if (!reduce) fig.classList.add('rv');
    shotTours.push(s);
    shotIO.observe(fig);
    if (prepIO) prepIO.observe(fig);
  });
  var wasWide = null;
  function syncShots() {
    if (wasWide === L.wide) return;
    wasWide = L.wide;
    shotTours.forEach(function (s) { if (L.wide) stopShot(s); else if (s.on) playShot(s); });
  }

  // Pausa del recorrido. Al mover el puntero sobre el texto de un paso, al tocarlo o al llevarle el
  // foco, y en el modo apilado también sobre su captura, el recorrido se detiene y deja su estado
  // final. El desplazamiento solo no cuenta, porque no mueve el puntero.
  function endTour(i) {
    if (L.wide) { if (T.idx === i && T.spot && T.spot.end) T.spot.end(); return; }
    shotTours.forEach(function (s) { if (s.i === i && s.spot && s.spot.end) s.spot.end(); });
  }
  function pauseOn(el, i) {
    if (!el) return;
    var stop = function (e) {
      if (e.type === 'pointermove' && !(e.movementX || e.movementY)) return;
      endTour(i);
    };
    el.addEventListener('pointermove', stop, { passive: true });
    el.addEventListener('pointerdown', stop, { passive: true });
    el.addEventListener('focusin', stop);
  }
  copies.forEach(function (c, i) { if (i > 0) pauseOn(c, i); });
  shotTours.forEach(function (s) { pauseOn(s.fig, s.i); });

  var leader = $('leader'), leadp = $('leadp'), leadc = $('leadc'), leade = $('leade');
  // Caja del texto en reposo, sin el desplazamiento de su transición de entrada.
  function restRect(el) {
    var r = el.getBoundingClientRect(), tx = 0;
    try {
      var tf = getComputedStyle(el).transform, mm = tf && /matrix\(([^)]+)\)/.exec(tf);
      if (mm) tx = parseFloat(mm[1].split(',')[4]) || 0;
    } catch (e) { /* sin transformación */ }
    return { left: r.left - tx, right: r.right - tx, top: r.top, bottom: r.bottom };
  }
  // La línea punteada une el texto activo con el canto del teléfono, a la altura del anillo del
  // momento, y nunca entra al vidrio, así no cruza lo que muestra la captura. Cuando el momento
  // cambia, su punta baja o sube por el canto hasta el anillo nuevo.
  var LD = { on: false, y: 0, ts: 0 };
  function leaderOff() { leader.classList.remove('is-on'); LD.on = false; }
  function updateLeader(idx, p, ts) {
    var lead = T.lead, copy = copies[idx];
    if (!lead || !copy || idx !== T.idx || idx === 0 || p < 1) { leaderOff(); return; }
    var side = sideOf(idx), cr = restRect(copy), gr = glass.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    var pr = phone.getBoundingClientRect();
    var eb = copy.querySelector('.eyebrow'), er = eb ? eb.getBoundingClientRect() : cr, k = gr.width / 390;
    var y0 = er.top + er.height / 2 - sr.top;
    var x0 = side === 'l' ? cr.right + 12 - sr.left : cr.left - 12 - sr.left;
    var tx = side === 'l' ? pr.left - 3 - sr.left : pr.right + 3 - sr.left;
    var ty = gr.top - sr.top + clamp(lead.y, 44, 800) * k;
    if (!(cr.bottom > L.navH + 20 && cr.top < L.vh - 20 && Math.abs(tx - x0) > 18)) { leaderOff(); return; }
    if (!LD.on || reduce) LD.y = ty; else {
      var a = 1 - Math.exp(-clamp(ts - LD.ts, 0, 64) / 90);
      LD.y += (ty - LD.y) * a;
      if (Math.abs(ty - LD.y) > 0.4) requestRender(); else LD.y = ty;
    }
    LD.ts = ts; LD.on = true;
    var mx = (x0 + tx) / 2;
    attr(leadp, 'd', 'M' + f(x0) + ' ' + f(y0) + 'C' + f(mx) + ' ' + f(y0) + ' ' + f(mx) + ' ' + f(LD.y) + ' ' + f(tx) + ' ' + f(LD.y));
    attr(leadc, 'cx', f(x0)); attr(leadc, 'cy', f(y0));
    attr(leade, 'cx', f(tx)); attr(leade, 'cy', f(LD.y));
    leader.classList.add('is-on');
  }

  var S2 = { idx: -1 };
  function splashProgress(ts, y) {
    if (L.wide) {
      var p = clamp(y / (0.5 * L.vh));
      return reduce ? (p > 0.5 ? 1 : 0) : p;
    }
    // En el modo apilado, la salida corre sola al terminar la intro, sin tocar el desplazamiento.
    if (reduce) return 1;
    if (introStart === null) return 0;
    return seg(ts - introStart - NATIVE - INTRO_END[variant] - HOLD, 0, EXIT_DUR[variant]);
  }

  function update(ts) {
    var y = win.pageYOffset, p = splashProgress(ts, y);
    if (L.wide) {
      var e = reduce ? (y > 0.3 * L.vh ? 1 : 0) : inOutCubic(clamp(y / (0.62 * L.vh)));
      rig.style.transform = 'translateX(' + f(L.heroDx * (1 - e)) + 'px)';
      var ho = 1 - clamp((y - 0.08 * L.vh) / (0.34 * L.vh));
      hero.style.opacity = f(ho);
      hero.style.pointerEvents = ho < 0.05 ? 'none' : '';
      root.style.setProperty('--gk', f(lerp(1, 0.45, p)));
      cue.style.opacity = f(1 - clamp(p * 4));
      var idx = activeIndex(y);
      if (idx !== S2.idx) {
        if (S2.idx >= 0 && steps[S2.idx]) steps[S2.idx].classList.remove('is-active');
        steps[idx].classList.add('is-active');
        // Con la portada a la vista, los textos de los pasos todavía no asoman ni atenuados.
        stepsBox.classList.toggle('en-portada', idx === 0);
        S2.idx = idx;
      }
      // Mientras el splash no termina de salir, el teléfono muestra la malla. Después, la pantalla
      // del paso activo, o la que va mostrando su recorrido.
      var want = p >= 1 ? idx : -1;
      if (want !== T.idx) startRigTour(want);
      setScreen(p < 1 ? 'malla' : (T.scr || steps[idx].getAttribute('data-screen')), p >= 1 && steps[idx].hasAttribute('data-install'));
      updateLeader(idx, p, ts);
    } else {
      rig.style.transform = '';
      hero.style.opacity = '';
      hero.style.pointerEvents = '';
      root.style.removeProperty('--gk');
      if (T.idx !== -1) startRigTour(-1);
      setScreen('malla', false);
      leaderOff();
    }
    renderFx(ts, p);
    return p;
  }

  var pending = false;
  function requestRender() { if (!pending) { pending = true; win.requestAnimationFrame(frame); } }
  function frame(ts) {
    pending = false;
    var p = update(ts);
    // Sigue pidiendo cuadros mientras la intro o la salida automática están en curso.
    if (introStart !== null && !reduce) {
      var el = ts - introStart - NATIVE;
      var busy = el < FX_END[variant] || (!L.wide && p < 1);
      if (busy) requestRender();
    }
  }
  function startIntro() { if (introStart === null) { introStart = now(); requestRender(); } }

  /* ---------- Arranque ---------- */
  var remeasure = function () { measure(); requestRender(); };
  win.addEventListener('scroll', requestRender, { passive: true });
  win.addEventListener('resize', remeasure);
  win.addEventListener('load', remeasure);
  if (win.ResizeObserver) new ResizeObserver(remeasure).observe(doc.body);
  onChange(mqWide, remeasure);
  onChange(mqReduce, function () {
    reduce = !!mqReduce.matches; cur = null; lastP = -1;
    // Los recorridos vuelven a empezar con la preferencia nueva.
    T.idx = -2;
    shotTours.forEach(function (s) { s.fig.classList.toggle('rv', !reduce); if (s.on && !L.wide) playShot(s); });
    remeasure();
  });

  syncTheme();
  measure();
  update(now());
  loadMeta();
  root.classList.add('ready');

  if ('IntersectionObserver' in win) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) if (entries[i].isIntersecting) { io.disconnect(); startIntro(); return; }
    }, { threshold: 0.3 });
    io.observe(phone);
  } else startIntro();
})();
