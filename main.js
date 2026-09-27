/* ULima++ · landing
   1. Tema claro u oscuro, según el sistema o el conmutador.
   2. Versión, peso y fecha del APK, en vivo desde la API pública de GitHub, con respaldo.
   3. Logo animado de la entrada, con una de las tres intros aprobadas elegida al azar y distinta de
      la de la visita anterior, y la espera en bucle de cada intro mientras el logo reposa.
   4. Scrollytelling con el teléfono fijo, al centro en la compu y arriba en el celular, que cambia
      de captura al bajar.
   5. Detalles sobre la captura, con velo, lupa, anillo, línea guía y frase, al ritmo del texto
      activo, y las pantallas intermedias de cada paso, que también son capturas reales.
   6. Ulises, posado junto al teléfono, comenta cada paso en su burbuja y vuela en arco de un lugar
      a otro por fuera de la pantalla. En el chat de la sección llega un «67». */
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
  // El teléfono fijo va al centro con 900 px o más de ancho y 560 px o más de alto (wide) y arriba,
  // más chico, en un celular o una tableta en vertical (cmp). Un celular apaisado, bajo, sigue con
  // las capturas apiladas (stack), porque ahí el teléfono fijo no deja lugar al texto.
  var mqWide = mq('(min-width: 900px) and (min-height: 560px)');
  var mqCmp = mq('(max-width: 899px) and (min-height: 500px)');
  function modeNow() { return mqWide && mqWide.matches ? 'wide' : mqCmp && mqCmp.matches ? 'cmp' : 'stack'; }
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
    // Las imágenes dentro de un SVG, como la conversación del 67, bajan solo en el tema activo.
    svgImages();
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
  // Destinos en la cabecera real de la app, medidos en sus capturas. La estrella vuela a la de la
  // cabecera, que mide 26 dp de punta a punta y va 10 dp antes del texto, y los «++» caen sobre los
  // del texto «ULIMA++».
  var HX = 33, HY = 65, KE = 13 / R, CTRL = [60, 200];
  var PP_X = [122.3, 133.3], PP_Y = 64.8, PP_A = 5, PP_TH = 1.4, PP_SK = -10;
  var WM_X = 55, WM_W = 62, WM_STOPS = [14, 24, 31, 47, 62];
  var FS = 29.9, BASE = CY + 71.5, S = 1.3;

  var splash = $('splash'), glass = $('glass');
  var n = {
    panelg: $('sp-panelg'), panel: $('sp-panel'), sweep: $('sp-sweep'), logo: $('sp-logo'), ring: $('sp-ring'),
    glint: $('sp-glint'), band: $('sp-band'), starg: $('sp-starg'), inner: $('sp-inner'),
    code: $('sp-code'), caret: $('sp-caret'), crClip: $('sp-crclipr'),
    holeWm: $('sp-hole-wm'), holePp: $('sp-hole-pp')
  };
  n.wait = $('sp-wait');
  var rhEls = all('.sp-rh', splash);
  var pr = [$('sp-pr0'), $('sp-pr1')];
  // La espera en bucle de cada intro, el movimiento del logo en reposo mientras la página espera.
  // Con movimiento reducido o con las animaciones en pausa no hay espera.
  function waitOn() { return !reduce && !still; }
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

  // Cada pose recibe el instante de la intro [t], el instante de la intro en que empezó la salida
  // [tEx] (Infinity si todavía no empieza) y el avance de la salida [p].

  // A, Ensamble (versión adaptada a la spec). Parte de la estrella completa del splash nativo,
  // los ocho rombos se abren juntos y vuelven a encajar uno a uno en sentido horario; un destello
  // asoma por las rendijas y los «++» saltan como un contador. En la espera, una onda recorre los
  // rombos en sentido horario, como en ensamble-adaptada.html.
  function poseEnsamble(t, tEx, p) {
    var P = basePose(), kick = 0, k, j, wa = 0, ph = 0;
    if (waitOn() && t > 1250) { wa = clamp((t - 1250) / 300) * (1 - clamp((p || 0) * 3)); ph = (t - 1250) / 1100; }
    var po = outCubic(seg(t, 80, 260));
    for (k = 0; k < 8; k++) {
      var r = P.rh[k], start = 260 + 50 * k, dur = 264, p = clamp((t - start) / dur), off, ang, sc, op;
      if (p <= 0) { off = 200 * po; ang = -60 * po; sc = 1 - 0.4 * po; op = 1 - 0.6 * po; }
      else {
        off = 200 * (1 - outBack(p, 1.25)); ang = -60 * (1 - outCubic(p));
        sc = 0.6 + 0.4 * outCubic(p); op = 0.4 + 0.6 * seg(t, start, start + 50);
      }
      if (wa > 0) { var sw = Math.sin(2 * Math.PI * (ph - k / 8)); off += wa * 20 * (sw > 0 ? Math.pow(sw, 6) : 0); }
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
  // En la espera da un tic de 45° cada 1,3 s desde los 1400 ms, con un latido de los rombos y un
  // asentimiento de los «++», como en incremento.html. Un tic ya empezado termina aunque empiece la
  // salida, y la salida no lo espera (RF-SPL-10).
  function poseIncremento(t, tEx) {
    var P = basePose(), i, off = 0, nod = [1, 1];
    P.rot = 45 * spring(t / 1000, 15.708, 0.55);
    var bp = (t - 180) / 380;
    if (bp > 0 && bp < 1) {
      var b = bp < 0.32 ? outCubic(bp / 0.32) : 1 - inOutCubic((bp - 0.32) / 0.68);
      off = 24 * b; P.inS = 1 - 0.05 * b;
    }
    var lim = Math.min(t, tEx == null ? Infinity : tEx);
    if (waitOn() && lim >= 1400) {
      var nt = Math.floor((lim - 1400) / 1300) + 1, q0 = Math.max(0, nt - 2);
      // Los tics viejos ya se asentaron y suman 45° cada uno. Solo los dos últimos se mueven.
      P.rot += 45 * q0;
      for (var q = q0; q < nt; q++) {
        var tt = 1400 + 1300 * q, tp = (t - tt) / 420;
        P.rot += 45 * spring((t - tt) / 1000, 12.566, 0.72);
        if (tp > 0 && tp < 1) { var sb = Math.sin(Math.PI * tp); off += 8 * sb; P.inS -= 0.02 * sb; }
        for (var jn = 0; jn < 2; jn++) {
          var nq = (t - (tt + 60 + 110 * jn)) / 320;
          if (nq > 0 && nq < 1) nod[jn] *= 1 + 0.14 * Math.sin(Math.PI * nq);
        }
      }
      P.rot %= 360;
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
      P.cr[j] = { x: P.x + xs[j] * K0, y: P.y + CR_HOME[j][1] * K0, a: CR_A * K0 * ss[j] * nod[j], th: CR_TH * K0 * ss[j] * nod[j], rot: 0, op: on[j] ? 1 : 0, tint: 0 };
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
  // En la espera, un cursor parpadea junto a los «++» como un programa que espera, como en
  // codigo.html, y se apaga en 120 ms cuando empieza la salida. Mientras la salida no empieza, te
  // es Infinity y el apagado no corre, porque Infinity − Infinity daría NaN y el cursor no se vería.
  function poseCodigo(t, tEx) {
    var P = basePose(), s = codeStar(t), j, te = tEx == null ? Infinity : tEx;
    P.x = s.x; P.y = s.y; P.k = s.k;
    var w = t - 1330;
    if (waitOn() && w > 0 && te > 1330 && t < te + 140) {
      var wop = w < 200 ? w / 200 : 0.5 + 0.5 * Math.cos(2 * Math.PI * (w - 200) / 1060);
      if (te !== Infinity) wop *= 1 - seg(t, te, te + 120);
      P.wait = { x: s.x + (402.5 + 36.4 + 22) * s.k, y: s.y - 133.8 * s.k - 36.4 * s.k * 1.2, h: 36.4 * s.k * 2.4, op: wop };
    }
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
  // Al azar entre las tres, como en la app, y nunca la misma de la visita anterior, que se guarda en
  // el navegador. Sin almacenamiento, el sorteo es entre las tres.
  var INTRO_KEY = 'ulimaplus-intro', prevIntro = null;
  try { prevIntro = win.localStorage.getItem(INTRO_KEY); } catch (e) { /* sin almacenamiento */ }
  var pool = VARIANTS.filter(function (v) { return v !== prevIntro; });
  var variant = pool[Math.floor(Math.random() * pool.length) % pool.length];
  try {
    // Para revisar una intro concreta se agrega ?intro=ensamble, ?intro=incremento o ?intro=codigo.
    var forcedIntro = /[?&]intro=(\w+)/.exec(win.location.search);
    if (forcedIntro && POSES[forcedIntro[1]]) variant = forcedIntro[1];
  } catch (e) { /* sin parámetros */ }
  try { win.localStorage.setItem(INTRO_KEY, variant); } catch (e) { /* vale solo para esta visita */ }
  root.setAttribute('data-intro', variant);

  // NATIVE es el splash nativo quieto antes del primer cuadro animado, 700 ms como en las maquetas.
  var NATIVE = 700, HOLD = 650, introStart = null;
  // Salida del splash a la app. Empieza una sola vez, al bajar o al terminar la intro en el celular,
  // y desde ahí corre por tiempo hasta el final, así nunca queda a medias (EX.t0 es su comienzo).
  var EX = { t0: null };
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

    var tEx = EX.t0 === null || introStart === null ? Infinity : Math.max(EX.t0 - introStart - NATIVE, 0);
    var t = introT(ts), P = POSES[variant](t, tEx, p), i, j;
    var q = inOutCubic(clamp(p / 0.92)), qp = inOutCubic(clamp(p / 0.9));
    var h = lerp(844, HEAD_H, qp);
    attr(n.panel, 'd', panelPath(h, qp));
    // El color llega al de la cabecera antes de que se abra la ventana de «ULIMA», para que no se note el borde.
    attr(n.panel, 'fill', mix(SPLASH, HEAD, clamp((qp - 0.35) / 0.4)));
    attr(n.panelg, 'opacity', f(1 - seg(p, 0.88, 1)));

    var x = quad(P.x, CTRL[0], HX, q), y = quad(P.y, CTRL[1], HY, q), k = P.k * Math.pow(KE / P.k, q);
    // La estrella no se desvanece. Se posa sobre la de la cabecera, que espera debajo, y el panel se
    // funde a su alrededor.
    attr(n.logo, 'transform', 'translate(' + f(x) + ' ' + f(y) + ') scale(' + k.toFixed(5) + ')');
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
    if (P.wait && P.wait.op > 0.002) {
      attr(n.wait, 'x', f(P.wait.x)); attr(n.wait, 'y', f(P.wait.y));
      attr(n.wait, 'height', f(P.wait.h)); attr(n.wait, 'opacity', f(P.wait.op));
    } else attr(n.wait, 'opacity', '0');

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

  // L.mode es wide (teléfono al centro), cmp (teléfono arriba, en el celular) o stack (capturas
  // apiladas). L.rig dice si manda el teléfono fijo, que en wide y en cmp recorre los pasos.
  var L = { vh: 0, vw: 0, mode: 'stack', wide: false, rig: false, navH: 56, gw: 280, copyMid: [], heroDx: 0 };
  function measure() {
    L.vh = win.innerHeight;
    L.vw = root.clientWidth || win.innerWidth;
    L.mode = modeNow();
    L.wide = L.mode === 'wide';
    L.rig = L.mode !== 'stack';
    syncShots();
    L.navH = nav.offsetHeight;
    // Medidas sin transformaciones, así el vaivén del 67 no las altera.
    L.gw = glass.offsetWidth || L.gw;
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
      var pw = phone.offsetWidth, target = (hr.right + L.vw - pad) / 2;
      target = Math.min(target, L.vw - pad - pw / 2);
      L.heroDx = Math.max(0, target - L.vw / 2);
    } else L.heroDx = 0;
    measureCode();
  }

  // El paso activo es el del texto más cercano al centro de la zona visible, así el texto que se
  // lee nunca queda atenuado. Mientras el primero no asoma hasta su mitad, sigue la portada.
  // Con el teléfono arriba (cmp), el texto sube por debajo del teléfono y el paso activo es el
  // último cuyo texto ya pasó la línea de lectura, a un 36 % de la zona libre bajo el teléfono.
  function activeIndex(y) {
    if (L.mode === 'cmp') {
      var sb = stage.getBoundingClientRect().bottom, line = sb + 0.36 * (L.vh - sb), k = 0;
      for (var j = 1; j < steps.length; j++) {
        if (!copies[j]) continue;
        if (copies[j].getBoundingClientRect().top <= line) k = j; else break;
      }
      return k;
    }
    var mid = y + L.navH + (L.vh - L.navH) / 2, idx = 0, best = Infinity;
    for (var i = 1; i < steps.length; i++) {
      var m = L.copyMid[i];
      if (m == null) continue;
      if (Math.abs(m - mid) < best) { best = Math.abs(m - mid); idx = i; }
    }
    return idx && L.copyMid[idx] > y + L.vh ? 0 : idx;
  }

  // Los esquemas de Android arrancan en su estado previo, con la descarga en curso (is-dl) y el
  // permiso apagado (is-off), y pasan al final poco después de que se enciende su momento. La clase
  // va en el vidrio, así también la heredan las copias de la lupa, que muestran el mismo cambio.
  // Con movimiento reducido o con las animaciones en pausa se ven ya en su estado final.
  var PREV = { sys1: ['is-dl', 1], sys2: ['is-off', 0] }, PREV_WAIT = 600;
  function schemeArm(g, name) {
    clearTimeout(g.schemeT);
    Object.keys(PREV).forEach(function (k) { g.classList.toggle(PREV[k][0], k === name && !reduce && !still); });
  }
  function schemeGo(g, b, now) {
    var pv = PREV[b.scr];
    if (!pv || b.i < pv[1]) return;
    clearTimeout(g.schemeT);
    if (now) g.classList.remove(pv[0]);
    else g.schemeT = setTimeout(function () { g.classList.remove(pv[0]); }, PREV_WAIT);
  }

  var cur = null;
  function setScreen(name, install) {
    stage.classList.toggle('is-install', !!install);
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
    // Sobre una captura naranja, las lupas y los anillos van en blanco (data-mk).
    if (sc && sc.hasAttribute('data-mk')) glass.setAttribute('data-mk', sc.getAttribute('data-mk'));
    else glass.removeAttribute('data-mk');
    stage.classList.toggle('is-install', !!install);
    // En el paso 1 la descarga avanza hasta «Abrir» cuando el recorrido enciende su aviso, y en el
    // paso 2 el interruptor se enciende cuando el recorrido llega a él.
    schemeArm(glass, name);
  }

  /* ---------- 5. Detalles sobre la captura ---------- */
  // Cada paso recorre sus momentos (data-beats) mientras su texto está activo. En cada momento, el
  // resto de la pantalla se oscurece un instante y queda bajo un velo suave, la zona sube en una
  // lupa, apenas en las zonas grandes y hasta 2,6 veces en las chicas, un anillo marca un borde
  // libre de la zona y en el texto se marca la frase que la explica (data-b). Los momentos
  // principales («*») duran más que los de paso, que son breves para que lo principal llegue en los
  // primeros dos segundos y medio. Al terminar, el velo se levanta y quedan la lupa y el anillo sobre
  // la pantalla en color. Con movimiento reducido no hay recorrido y se ven quietas, sin zoom y a la
  // vez, las zonas principales (o la última, si ninguna lo está).
  var SEC = 700, MAIN = 1500, SWAP = 250, REVEAL = 250, REST = 2400, CALM = 600, RING = 24;

  // Con el botón «Pausar animaciones» o con Escape, cada recorrido salta a su estado final y los que
  // siguen se muestran ya terminados durante la visita.
  var still = false, QUIETO = 'ulimaplus-quieto';
  try { still = win.sessionStorage.getItem(QUIETO) === '1'; } catch (e) { /* sin almacenamiento */ }

  function nums(s) { return s.trim().split(/\s+/).filter(Boolean).map(Number); }
  // Un momento es «[*][pantalla:] x y ancho alto [radio] [~t|~b|~o|~r|~n] [=zoom][, otra zona] [@x y |
  // @x y ancho alto] [^y ...]».
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
      // El zoom fijo puede traer un segundo valor para el teléfono chico del celular (=2.4:3.2) y
      // un «!» para conservarlo con movimiento reducido, como la lupa del 67, que sin ella no se lee.
      (k >= 0 ? b.slice(0, k) : b).split(',').forEach(function (r) {
        var ZR = /=\s*([\d.]+)(?::([\d.]+))?(!?)/;
        var h = /~([tbnor])/.exec(r), zm = ZR.exec(r), v = nums(r.replace(/~[a-z]/g, '').replace(ZR, ''));
        if ((v.length === 4 || v.length === 5) && v.every(isFinite)) {
          v.ring = h ? h[1] : ''; v.zoom = zm && +zm[1] > 1 ? +zm[1] : 0;
          v.zoomC = zm && zm[2] && +zm[2] > 1 ? +zm[2] : v.zoom; v.keep = !!(zm && zm[3]);
          o.z.push(v);
        }
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
  // insignia, un botón o una línea de texto, se amplía hasta que se lee (2,6 veces como mucho). Una
  // zona puede fijar su zoom (=1.7), como las columnas del mapa, cuyos nombres son chicos aunque la
  // zona sea grande. Si la lupa no cabe, se achica o se corre lo justo para quedar entre la barra de
  // estado y la de inicio. Con [flat] (movimiento reducido) no hay zoom.
  // En un teléfono chico, el de arriba en el celular o una captura apilada de menos de 250 px de
  // ancho (un celular apaisado), la lupa amplía 1,5 veces más, hasta 3,4, siempre dentro de la
  // pantalla, y una zona con dos zooms (=2.4:3.2) usa el segundo.
  var LENS_T = 140, LENS_MAX = 2.6, LENS_FIX = 3.4, SAFE = [4, 27, 386, 826], SMALL_K = 1.5;
  function lensGeo(z, flat, gw) {
    var w = z[2], h = z[3], m = Math.max(w, h), cx = z[0] + w / 2, cy = z[1] + h / 2, s = 1;
    if (!flat || z.keep) {
      var n = Math.min(w, h), small = L.mode === 'cmp' || (L.mode === 'stack' && (gw || 999) < 250);
      var fix = small ? z.zoomC : z.zoom;
      s = fix || Math.max(LENS_T / m, n < 70 ? clamp(46 / n, 1.25, LENS_MAX) : 1, 1 + Math.min(0.07, 12 / m));
      if (small && z.zoomC === z.zoom) s *= SMALL_K;
      s = Math.max(1, Math.min(s, fix || small ? LENS_FIX : LENS_MAX, (SAFE[2] - SAFE[0]) / w, (SAFE[3] - SAFE[1]) / h));
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
  // medio del borde), ~o el lado opuesto al texto o ~r el derecho, en la compu y en el celular, como
  // la lupa del 67, que en los dos solo tiene libre ese lado. Así nunca cae dentro de lo que la zona
  // muestra.
  // Una lupa más baja o más angosta que el anillo, como una insignia sin zoom, lo lleva del todo
  // afuera, con 2 puntos de aire, porque ahí esos 5 puntos taparían sus letras. Con ~n la zona no
  // lleva anillo.
  var RING_OUT = RING / 2 - 5, RING_M = RING / 2 + 5;
  function ringAt(g, side) {
    var hint = g.z.ring, l = hint === 'r' ? false : (side === 'l') !== (hint === 'o');
    if (hint === 'n') return null;
    var out = Math.min(g.x1 - g.x0, g.y1 - g.y0) < RING ? RING / 2 + 2 : RING_OUT;
    var mid = (g.x0 + g.x1) / 2, ex = hint === 't' || hint === 'b' ? mid : l ? Math.min(g.x0 + RING, mid) : Math.max(g.x1 - RING, mid);
    var sid = [l ? g.x0 - out : g.x1 + out, (g.y0 + g.y1) / 2];
    var top = [ex, g.y0 - out], bot = [ex, g.y1 + out];
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
        svgHref(k);
      }
      dest.appendChild(k);
    });
    return function () { back.forEach(function (x) { if (x[1]) x[0].setAttribute('srcset', x[1]); if (x[2]) x[0].setAttribute('src', x[2]); }); };
  }

  function dropMarks(S, now) {
    S.marks.forEach(function (l) {
      if (now || reduce) { l.classList.remove('is-on'); if (l.parentNode) l.parentNode.removeChild(l); }
      else {
        // La lupa y el anillo que salen se apagan en su lugar, sin achicarse, en 0,15 s.
        l.classList.add('is-out');
        setTimeout(function () { if (l.parentNode) l.parentNode.removeChild(l); }, 300);
      }
    });
    S.marks = [];
    S.lead = null;
  }
  // Entre dos momentos, la lupa nueva entra apenas se apaga la anterior, así hasta un momento de paso,
  // de 0,7 s, la muestra entera y con su zoom antes de seguir.
  function addMark(S, el, wasOn, now) {
    S.box.appendChild(el);
    S.marks.push(el);
    if (reduce || now) el.classList.add('is-on');
    else later(S, wasOn ? 160 : 200, function () { el.classList.add('is-on'); });
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
    var gw = S.glass.offsetWidth;
    var gs = b.z.map(function (z) { return lensGeo(z, false, gw); });
    gs.forEach(function (g) { addLens(S, g, caps, wasOn, hi, now); });
    addRings(S, b, gs, side, wasOn, false, now);
    // Tras el primer instante, el velo se aclara para que la pantalla siga en color.
    if (!now) later(S, CALM, function () { S.box.classList.add('is-calm'); });
  }
  // Las zonas principales a la vez, sin velo, sin zoom y con un solo anillo por momento.
  function showAll(S, list, src, side) {
    S.box.classList.remove('is-on', 'is-calm');
    dropMarks(S, true);
    var gw = S.glass.offsetWidth;
    var caps = capsOf(src), gl = list.map(function (b) { return b.z.map(function (z) { return lensGeo(z, true, gw); }); });
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
  // S.end detiene el recorrido y deja su estado final, la última zona con su anillo y sin velo. Con
  // las animaciones en pausa, el recorrido empieza ya en ese estado.
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
      if (o.at) o.at(ms[ms.length - 1], true);
      o.beat();
      return;
    }
    var t = o.delay, cur = o.scr0, last = beats[beats.length - 1];
    S.end = function () {
      stopTour(S);
      S.end = null;
      o.setScr(last.scr);
      o.reveal(null);
      showBeat(S, last, o.src(last.scr), o.side(), hiOf(last.scr), true);
      S.box.classList.add('is-rest');
      o.phr([last.i]);
      if (o.at) o.at(last, true);
      o.beat();
    };
    if (still) { S.end(); return; }
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
    // En reposo el velo se va del todo. Se quita is-calm para que su regla no lo retenga.
    later(S, t - (last.main ? MAIN : SEC) + REST, function () {
      S.box.classList.remove('is-calm');
      S.box.classList.add('is-rest');
      S.end = null;
      o.beat();
    });
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
    svgHref(sc);
  }
  // Una imagen dentro de un SVG baja aunque su tema no se vea, así que cada una recibe su fuente
  // solo cuando su tema está activo.
  function svgHref(el) {
    var want = isDark() ? 'cap-oscuro' : 'cap-claro';
    Array.prototype.forEach.call(el.querySelectorAll('image[data-href]'), function (im) {
      if (im.classList.contains(want) && !im.getAttribute('href')) im.setAttribute('href', im.getAttribute('data-href'));
    });
  }
  function svgImages() {
    if (typeof scrs !== 'object' || !scrs) return;
    Object.keys(scrs).forEach(function (k) { if (scrs[k].hydrated) svgHref(scrs[k]); });
    // También las copias que ya están a la vista, en las lupas y en las capas del modo apilado.
    all('.lens, .lay').forEach(svgHref);
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
    stopTilt(phone);
    U.t67 = false;
    if (i <= 0) return;
    hydrateNear(i);
    var bs = beatsOf[i];
    T.scr = bs.length ? bs[0].scr : steps[i].getAttribute('data-screen');
    if (!reduce) hideBubbles(bs, rigCovers);
    play(T.spot, bs, {
      delay: 300, scr0: T.scr,
      // Con el teléfono arriba, el texto va debajo y el anillo sale a la derecha de la zona.
      side: function () { return L.wide ? sideOf(i) : 'r'; },
      setScr: function (n) { T.scr = n; requestRender(); },
      src: function (n) { return scrs[n]; },
      reveal: function (n, y) { if (n == null) showBubbles(rigCovers); else setCover(rigCovers[n], y); },
      phr: function (ks) { phrase(i, ks); },
      at: function (b, now) { schemeGo(glass, b, now); if (b.scr === 'chat-67') six7(phone, now, true); },
      beat: function () { T.lead = T.spot.lead; requestRender(); }
    });
  }

  // El 67. Un compañero manda «67» en el chat de la sección, el teléfono entero se inclina de un lado
  // a otro durante 2 s, como el truco de la app (−3° · sen(2π · 4 · avance), primero a la izquierda),
  // y Ulises responde «SIX SEVEN!!!». Con movimiento reducido, con las animaciones en pausa o al
  // saltar al estado final no hay vaivén, y si ya había empezado se corta ahí mismo. La burbuja de
  // Ulises trae entonces su comentario del paso y, debajo, la respuesta.
  function stopTilt(el) {
    if (!el) return;
    clearTimeout(el.t67);
    el.classList.remove('t67');
  }
  function six7(el, now, uli) {
    if (uli) { U.t67 = true; U.t67both = !!(now || reduce || still); uliSay(); }
    if (!el) return;
    stopTilt(el);
    if (now || reduce || still) return;
    void el.offsetWidth;
    el.classList.add('t67');
    el.t67 = setTimeout(function () { el.classList.remove('t67'); }, 2100);
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
    var r = scrs[name], swap = !!(s.cur && s.cur !== name && s.layers[s.cur] && s.layers[name]);
    s.cur = name;
    // Entre dos capas, la que sale espera tapada por la que entra, y un cambio en su lugar entra rápido.
    s.glass.classList.toggle('swap', swap);
    s.glass.classList.toggle('cf', !!(r && r.hasAttribute('data-cf')));
    Object.keys(s.layers).forEach(function (k) { s.layers[k].classList.toggle('is-on', k === name); });
    // La barra de estado y la de inicio toman el tono de la pantalla a la vista.
    if (!r) return;
    s.glass.setAttribute('data-hb', r.getAttribute('data-hb') || 'cc');
    if (r.hasAttribute('data-sb')) s.glass.setAttribute('data-sb', r.getAttribute('data-sb'));
    else s.glass.removeAttribute('data-sb');
    if (r.hasAttribute('data-mk')) s.glass.setAttribute('data-mk', r.getAttribute('data-mk'));
    else s.glass.removeAttribute('data-mk');
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
    schemeArm(s.glass, s.scr);
    if (!reduce) hideBubbles(s.beats, s.covers);
    play(s.spot, s.beats, {
      delay: 300, scr0: s.cur,
      side: function () { return shotSide(s); },
      setScr: function (n) { figScreen(s, n); },
      src: function (n) { return s.layers[n] || s.glass; },
      reveal: function (n, y) { if (n == null) showBubbles(s.covers); else setCover(s.covers[n], y); },
      phr: function (ks) { phrase(s.i, ks); },
      at: function (b, now) { schemeGo(s.glass, b, now); if (b.scr === 'chat-67') six7(s.fig, now, false); },
      beat: noop
    });
  }
  // Al salir de la vista, la figura vuelve a la pantalla con la que empieza, así no reaparece en una
  // pantalla intermedia cuando se sube de nuevo hasta ella.
  function stopShot(s) {
    if (!s.spot) return;
    stopTour(s.spot); s.spot.end = null; hideSpot(s.spot, true); phrase(s.i, []); stopTilt(s.fig);
    if (s.ready) figScreen(s, firstScreen(s));
    schemeArm(s.glass, s.scr);
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
        if (!L.rig && !s.primed) { s.primed = true; prepShot(s); figScreen(s, firstScreen(s)); schemeArm(s.glass, s.scr); }
      }
      // La parte visible se mide contra lo que cabe en la ventana, así una figura más alta que la
      // ventana, como en un celular apaisado, también arranca su recorrido.
      var vh = e.rootBounds ? e.rootBounds.height : L.vh;
      var room = Math.min(e.boundingClientRect.height, vh) || 1;
      var vis = e.isIntersecting && e.intersectionRect.height / room >= 0.6;
      if (vis === s.on) return;
      s.on = vis;
      if (L.rig) return;
      if (vis) playShot(s); else stopShot(s);
    });
  }, { threshold: TH }) : null;
  // Las capas de una figura se arman una pantalla antes de que asome, así sus capturas ya bajaron
  // cuando empieza su recorrido.
  var prepIO = 'IntersectionObserver' in win ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var s = e.target.tour;
      if (s && e.isIntersecting && !L.rig) { prepShot(s); prepIO.unobserve(e.target); }
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
  var wasRig = null;
  function syncShots() {
    if (wasRig === L.rig) return;
    wasRig = L.rig;
    shotTours.forEach(function (s) { if (L.rig) stopShot(s); else if (s.on) playShot(s); });
  }

  // Pausa del recorrido. Al hacer clic en el texto de un paso o tocarlo sin arrastrar, o al llevarle
  // el foco, y en el modo apilado también sobre su captura, el recorrido se detiene y deja su estado
  // final. Pasar el mouse no cuenta, porque el cursor suele quedar sobre el texto mientras se lee y
  // cortaría cada paso antes de sus detalles. Desplazar la página tampoco, ni con la rueda ni con el
  // dedo, porque un toque que se vuelve desplazamiento no dispara click.
  function endTour(i) {
    if (L.rig) {
      if (T.idx !== i) return;
      stopTilt(phone);
      if (T.spot && T.spot.end) T.spot.end();
      return;
    }
    shotTours.forEach(function (s) {
      if (s.i !== i) return;
      stopTilt(s.fig);
      if (s.spot && s.spot.end) s.spot.end();
    });
  }
  function pauseOn(el, i) {
    if (!el) return;
    var stop = function () { endTour(i); };
    el.addEventListener('click', stop);
    el.addEventListener('focusin', stop);
  }
  copies.forEach(function (c, i) { if (i > 0) pauseOn(c, i); });
  shotTours.forEach(function (s) { pauseOn(s.fig, s.i); });

  // Botón «Pausar animaciones», en la barra con el teléfono fijo y al comienzo de Funciones con las
  // capturas apiladas. Termina cada recorrido en su estado final, deja quietos los que siguen y
  // apaga lo que late (halos, anillos, resplandor y flecha de la portada). Escape también pausa. Al
  // reanudar, el paso a la vista vuelve a recorrer sus momentos.
  var pauseBtns = all('[data-pausa]');
  // El rótulo, «Pausar» o «Reanudar animaciones», cambia con la clase quieto, que el script del
  // <head> ya pone antes del primer pintado si la pausa quedó guardada.
  function syncPause() {
    root.classList.toggle('quieto', still);
  }
  // Al pausar o reanudar con el botón o con Escape, una región cortés lo dice al lector de pantalla,
  // porque el cambio de rótulo del botón no se anuncia si la pausa llega con Escape.
  var pauseNote = $('pausa-aviso');
  function setStill(v) {
    if (v === still) return;
    still = v;
    try { if (v) win.sessionStorage.setItem(QUIETO, '1'); else win.sessionStorage.removeItem(QUIETO); } catch (e) { /* vale solo para esta página */ }
    syncPause();
    if (pauseNote) pauseNote.textContent = v ? 'Animaciones en pausa.' : 'Animaciones en marcha.';
    if (v) {
      // El vaivén del 67 se corta al instante, en el teléfono fijo y en las capturas apiladas.
      stopTilt(phone);
      shotTours.forEach(function (s) { stopTilt(s.fig); });
      if (T.spot && T.spot.end) T.spot.end();
      shotTours.forEach(function (s) { if (s.spot && s.spot.end) s.spot.end(); });
    } else {
      if (T.idx > 0) T.idx = -2;
      shotTours.forEach(function (s) { if (s.on && !L.rig) playShot(s); });
    }
    uliStill();
    requestRender();
  }
  pauseBtns.forEach(function (b) { b.addEventListener('click', function () { setStill(!still); }); });
  doc.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && !still) setStill(true);
  });
  syncPause();

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

  /* ---------- 6. Ulises ---------- */
  // Ulises va posado junto al teléfono y comenta cada paso en su burbuja. Entre un paso y otro vuela
  // a su lugar nuevo en arco, siempre por fuera de la pantalla del teléfono. Si cambia de lado, sube
  // por su costado, cruza por encima del teléfono y baja por el otro, como en la bienvenida de la
  // app, con aleteo, inclinación según la velocidad y rebote al posarse. En la compu se posa del lado
  // contrario al texto, a otra altura en cada paso, y en la instalación sobre el panel del QR. En el
  // celular se posa en el canto derecho del teléfono, sobre el marco y sin entrar a la pantalla, así
  // nunca tapa lo que muestran las lupas, y su burbuja va en la columna libre de al lado. Con
  // movimiento reducido o con las animaciones en pausa aparece en su lugar, sin volar.
  var uli = $('uli'), uliF = uli.querySelector('.uli-f'), ubub = $('ubub'), ubT = ubub.querySelector('.ub-t'), ubS = ubub.querySelector('.ub-s');
  var qrEl = doc.querySelector('.qrpanel'), qrImg = qrEl && qrEl.querySelector('img'), pauseSt = doc.querySelector('.pausa-st');
  var U = {
    ok: false, mode: null, x: 0, y: 0, s: 64, face: 1, idx: -1, spot: null, fl: null,
    land: -1e9, talk: -1e9, showAt: 1e15, t67: false, t67both: false,
    bub: { on: false, w: 0, h: 0, cand: null }
  };
  var ARRIVE = 250, BUB_DELAY = 220, LAND = 480, TALK = 320;
  var HAS_TRANSLATE = 'translate' in ubub.style;

  // En la portada del celular no está el aviso «Baja y la app se abre» de la compu, así que Ulises
  // invita a bajar (data-uli-c).
  function uliText(i) {
    if (i <= 0) return (!L.wide && hero.getAttribute('data-uli-c')) || hero.getAttribute('data-uli') || '';
    var st = steps[i];
    return (st && st.getAttribute('data-uli')) || '';
  }
  // La respuesta al 67 (data-uli67). Durante el recorrido reemplaza al comentario del paso. Con
  // movimiento reducido, con las animaciones en pausa o al saltar al estado final va debajo del
  // comentario, así los dos se leen.
  function uliShout(i) {
    var st = i > 0 ? steps[i] : null;
    return U.t67 && st && st.hasAttribute('data-uli67') ? st.getAttribute('data-uli67') : '';
  }
  function uliSize() { return Math.round(L.wide ? clamp(L.gw * 0.2, 56, 72) : clamp(L.gw * 0.27, 40, 54)); }
  function rigBox() { return rig.getBoundingClientRect(); }
  function glassBox() { var r = rigBox(); return { left: r.left + 8, top: r.top + 8, right: r.right - 8, bottom: r.bottom - 8 }; }

  // Lugar de cada paso. En el celular alterna tres alturas del canto derecho; en la compu va del lado
  // contrario al texto, a dos alturas que se alternan, y en la instalación salta entre los dos
  // extremos del panel del QR. Dos pasos seguidos nunca comparten lugar.
  function spotOf(i) {
    if (!L.wide) return { key: 'c' + (i % 3), kind: 'side', side: 'r', fy: [0.24, 0.53, 0.8][i % 3] };
    if (i > 0 && steps[i].hasAttribute('data-install') && qrEl) {
      var k = 0;
      for (var j = 1; j < i; j++) if (steps[j].hasAttribute('data-install')) k++;
      return { key: 'q' + (k % 2), kind: 'qr', fx: k % 2 ? 0.74 : 0.26 };
    }
    var side = i === 0 || sideOf(i) === 'l' ? 'r' : 'l';
    var fy = i === 0 ? 0.36 : i % 2 ? 0.3 : 0.56;
    return { key: 'w' + side + fy, kind: 'side', side: side, fy: fy };
  }
  function spotXY(sp) {
    var s = U.s;
    if (sp.kind === 'qr') {
      var Q = qrEl.getBoundingClientRect();
      return { x: Q.left + sp.fx * Q.width, y: Q.top - s * 0.42 };
    }
    // En la compu se posa junto al canto, sin tocar el teléfono. En el celular se apoya en el marco,
    // a 6 px de la pantalla, así ni su respiración ni el rebote la alcanzan.
    var R = rigBox(), gap = L.wide ? 4 : -2;
    return { x: sp.side === 'r' ? R.right + gap + s / 2 : R.left - gap - s / 2, y: R.top + sp.fy * R.height };
  }
  // El otro lugar del mismo tramo, para cuando el paso nuevo cae donde Ulises ya está, como al saltar
  // varios pasos de una vez. Así cada cambio de paso es un vuelo de verdad y no un salto en su sitio.
  function altSpot(sp) {
    var o = {};
    for (var k in sp) o[k] = sp[k];
    if (sp.kind === 'qr') o.fx = sp.fx < 0.5 ? 0.74 : 0.26;
    else if (!L.wide) o.fy = sp.fy < 0.4 ? 0.8 : 0.24;
    else o.fy = sp.fy < 0.45 ? 0.56 : 0.3;
    o.key = sp.key + '*';
    return o;
  }
  // Posado, mira hacia el teléfono.
  function restFace() { return U.spot && U.spot.kind === 'side' && U.spot.side === 'l' ? 1 : -1; }

  function quadPts(A, C, B, N) {
    var out = [];
    for (var k = 0; k <= N; k++) { var t = k / N; out.push({ x: quad(A.x, C.x, B.x, t), y: quad(A.y, C.y, B.y, t) }); }
    return out;
  }
  // Curva de Catmull-Rom por los puntos P, con tangentes escaladas por [ten].
  function crPts(P, ten, N) {
    var out = [];
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      var m1x = (p2.x - p0.x) * ten, m1y = (p2.y - p0.y) * ten, m2x = (p3.x - p1.x) * ten, m2y = (p3.y - p1.y) * ten;
      for (var k = i ? 1 : 0; k <= N; k++) {
        var t = k / N, t2 = t * t, t3 = t2 * t;
        var a = 2 * t3 - 3 * t2 + 1, b = t3 - 2 * t2 + t, c = -2 * t3 + 3 * t2, d = t3 - t2;
        out.push({ x: a * p1.x + b * m1x + c * p2.x + d * m2x, y: a * p1.y + b * m1y + c * p2.y + d * m2y });
      }
    }
    return out;
  }
  function hitsGlass(pts, G, r) {
    for (var k = 0; k < pts.length; k++) {
      var q = pts[k];
      if (q.x + r > G.left - 3 && q.x - r < G.right + 3 && q.y + r > G.top - 3 && q.y - r < G.bottom + 3) return true;
    }
    return false;
  }
  // Camino del vuelo de A a B, en px de la ventana. Del mismo lado, un arco que sube (compu) o que
  // sale hacia afuera (celular). Si cambia de lado, o si el arco rozara la pantalla, sube por su
  // costado hasta pasar el borde de arriba del teléfono, cruza por encima y baja por el otro lado.
  function pathPts(A, B) {
    var G = glassBox(), r = U.s / 2, cx = (G.left + G.right) / 2, minY = r + 4;
    var da = A.x < cx ? -1 : 1, db = B.x < cx ? -1 : 1, pts;
    if (da === db) {
      var C;
      if (L.wide) {
        var lift = Math.max(70, Math.abs(B.x - A.x) * 0.35);
        C = { x: (A.x + B.x) / 2, y: Math.max(minY, Math.min(A.y, B.y) - lift) };
      } else C = { x: Math.min(Math.max(A.x, B.x) + 110, L.vw - r - 2), y: (A.y + B.y) / 2 };
      pts = quadPts(A, C, B, 40);
      if (!hitsGlass(pts, G, r)) return pts;
    }
    var top = Math.max(minY, G.top - r - 10);
    var way = function (P, d) { return { x: d < 0 ? Math.min(P.x, G.left - r) - 14 : Math.max(P.x, G.right + r) + 14, y: top }; };
    var W1 = way(A, da), W2 = way(B, db);
    return da === db ? crPts([A, W1, B], 0.35, 24) : crPts([A, W1, W2, B], 0.35, 24);
  }
  // Punto del camino a una fracción [e] de su largo, con su dirección.
  function along(pts, e) {
    var acc = [0], k;
    for (k = 1; k < pts.length; k++) acc.push(acc[k - 1] + Math.sqrt(Math.pow(pts[k].x - pts[k - 1].x, 2) + Math.pow(pts[k].y - pts[k - 1].y, 2)));
    var tot = acc[acc.length - 1] || 1, d = clamp(e) * tot;
    for (k = 1; k < pts.length - 1 && acc[k] < d; k++);
    var a = pts[k - 1], b = pts[k], u = clamp((d - acc[k - 1]) / ((acc[k] - acc[k - 1]) || 1));
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), dx: b.x - a.x, dy: b.y - a.y, len: tot };
  }
  function inOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }

  function bubHide() { U.bub.on = false; ubub.classList.remove('is-on'); }
  // Anchos que se prueban para la burbuja, según el lugar libre al lado de Ulises. Junto al teléfono
  // se prueba además el hueco entero entre el vidrio y el borde de la ventana, que en una compu angosta
  // puede medir menos de 150 px. Sobre el panel del QR se prueban el hueco a la derecha de Ulises y el
  // de su izquierda, hasta el vidrio, porque en una compu baja no hay lugar encima de él y una burbuja
  // más ancha y más baja cabe a su lado.
  function bubWidths() {
    var p = spotXY(U.spot), s = U.s, G = glassBox();
    if (!L.wide) return [Math.round(Math.max(120, Math.min(250, L.vw - 12 - (rigBox().right + 2))))];
    if (U.spot.kind !== 'qr') {
      var side = U.spot.side === 'r', w0 = [Math.round(Math.max(150, Math.min(250, side ? L.vw - 12 - (p.x - s * 0.35) : p.x + s * 0.35 - 12)))];
      var gap = Math.floor(Math.min(250, side ? L.vw - 8 - (G.right + 8) : G.left - 8 - 8));
      if (gap >= 96 && gap < w0[0]) w0.push(gap);
      return w0;
    }
    var out = s / 2 + 12, ws = [250];
    [L.vw - 8 - (p.x + out), p.x - out - (G.right + 8)].forEach(function (v) {
      v = Math.floor(Math.min(250, v));
      if (v >= 150 && ws.indexOf(v) < 0) ws.push(v);
    });
    return ws;
  }
  function rectOf(el, pad) {
    var r = el.getBoundingClientRect(); pad = pad || 0;
    return { l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad };
  }
  function overlap(a, b) {
    var w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    return w > 0 && h > 0 ? w * h : 0;
  }
  // Mejor lugar para una burbuja de [w] x [h] junto a Ulises. Prueba arriba, abajo y a los lados, hacia
  // el lado libre, y se queda con el primer lugar que cabe en la ventana (en el celular, dentro del
  // escenario) sin pisar nada, o si no con el que menos pisa. La pantalla del teléfono y los módulos
  // del código QR pesan cien veces más que el resto, así que la burbuja nunca los pisa si hay otro
  // lugar, y el margen blanco del código pesa diez veces más que el borde de su panel. También evita
  // el texto activo y el botón de pausa. Con [keep], el lugar elegido antes se mantiene mientras siga
  // libre.
  function bubBest(w, h, keep) {
    var p = spotXY(U.spot), s = U.s, G = glassBox();
    var sr = stage.getBoundingClientRect();
    var lo = { l: 8, r: L.vw - 8, t: L.navH + 6, b: L.wide ? L.vh - 6 : sr.bottom - 4 };
    var obs = [{ l: G.left - 6, t: G.top - 6, r: G.right + 6, b: G.bottom + 6, wt: 100 }], QM = null;
    if (L.wide) {
      var cp = U.idx > 0 ? copies[U.idx] : hero;
      if (cp && (U.idx > 0 || parseFloat(hero.style.opacity || '1') > 0.2)) { var rr = restRect(cp); obs.push({ l: rr.left - 10, t: rr.top - 10, r: rr.right + 10, b: rr.bottom + 10, wt: 1 }); }
      if (stage.classList.contains('is-install') && qrEl) {
        var qo = rectOf(qrEl, 6); qo.wt = 1; obs.push(qo);
        if (qrImg) {
          var qi = rectOf(qrImg, 4); qi.wt = 10; obs.push(qi);
          // Los módulos del código ocupan 41 de las 49 unidades del SVG, con 4 de margen blanco por
          // lado. Pesan como el vidrio y la burbuja nunca los pisa, porque con un patrón de posición
          // tapado el código puede dejar de leerse.
          var qr = rectOf(qrImg), qm = (qr.r - qr.l) * 4 / 49;
          QM = { l: qr.l + qm, t: qr.t + qm, r: qr.r - qm, b: qr.b - qm, wt: 100 };
          obs.push(QM);
        }
      }
    } else if (pauseSt) { var ps = rectOf(pauseSt, 6); ps.wt = 1; obs.push(ps); }
    obs.push({ l: p.x - s / 2, t: p.y - s / 2, r: p.x + s / 2, b: p.y + s / 2, wt: 1 });
    var out = s / 2 + 12, dir = U.spot.kind === 'qr' ? 0 : U.spot.side === 'r' ? 1 : -1;
    var ax = dir > 0 ? p.x - s * 0.35 : dir < 0 ? p.x + s * 0.35 - w : p.x - w / 2;
    var cands = {
      a: { l: ax, t: p.y - out - h, tail: 'b' },
      d: { l: ax, t: p.y + out, tail: 't' },
      s: dir >= 0 ? { l: p.x + out, t: p.y - h / 2, tail: 'l' } : { l: p.x - out - w, t: p.y - h / 2, tail: 'r' },
      o: dir >= 0 ? { l: p.x - out - w, t: p.y - h / 2, tail: 'r' } : { l: p.x + out, t: p.y - h / 2, tail: 'l' }
    };
    var order = !L.wide && U.spot.fy < 0.5 ? ['d', 'a', 's'] : ['a', 'd', 's', 'o'];
    // [hard] es lo que la burbuja nunca debe hacer, pisar el vidrio o los módulos del QR o, en la
    // compu, salirse de la ventana. Si el mejor lugar lo hace, la burbuja no se muestra.
    var GX = { l: G.left, t: G.top, r: G.right, b: G.bottom };
    function cost(c) {
      var box = { l: c.l, t: c.t, r: c.l + w, b: c.t + h }, k = 0, outA = w * h - overlap(box, lo);
      obs.forEach(function (o) { k += o.wt * overlap(box, o); });
      // En la compu, salirse de la ventana pesa veinte veces, más que rozar el borde del panel del QR.
      k += (L.wide ? 20 : 2) * outA;
      c.hard = overlap(box, GX) + (QM ? overlap(box, QM) : 0) + (L.wide ? outA : 0);
      return k;
    }
    // Se corre a lo largo de su borde para caber, sin que la cola deje de apuntar a Ulises. Prueba el
    // lugar centrado y los dos extremos del recorrido, y se queda con el que menos pisa.
    function fit(name) {
      var c = cands[name], hz = c.tail === 'b' || c.tail === 't', key = hz ? 'l' : 't';
      var a = hz ? Math.max(lo.l, p.x - w + 18) : Math.max(lo.t, p.y - h + 16);
      var z = hz ? Math.min(lo.r - w, p.x - 18) : Math.min(lo.b - h, p.y - 16);
      var vs = [clamp(c[key], a, z)];
      if (a <= z) vs.push(a, z);
      var best = null;
      vs.forEach(function (v) {
        var q = { n: name, l: c.l, t: c.t, tail: c.tail };
        q[key] = v;
        q.k = cost(q);
        if (!best || q.k < best.k - 1) best = q;
      });
      return best;
    }
    if (keep && cands[keep]) { var kept = fit(keep); if (kept.k < 1) return kept; }
    var best = null;
    for (var i = 0; i < order.length; i++) {
      var q = fit(order[i]);
      if (!best || q.k < best.k) best = q;
      if (q.k < 1) break;
    }
    return best;
  }
  function bubPlace() {
    var b = U.bub, p = spotXY(U.spot), w = b.w, h = b.h, best = bubBest(w, h, b.cand);
    b.cand = best.n;
    // Si ni el mejor lugar evita el vidrio, los módulos del QR y el borde de la ventana, la burbuja
    // espera oculta, sin desplazar nada, hasta que haya lugar. Lo que dice Ulises sigue en el texto
    // (.udice).
    ubub.classList.toggle('no-cabe', best.hard > 0.5);
    // Se ubica con translate y no con left y top, así cambiar de lugar no cuenta como desplazamiento
    // de diseño (CLS), ni siquiera con movimiento reducido, cuando cambia de texto y de lugar en el
    // mismo cuadro sin dejar de verse.
    if (HAS_TRANSLATE) ubub.style.translate = f(best.l) + 'px ' + f(best.t) + 'px';
    else { ubub.style.left = f(best.l) + 'px'; ubub.style.top = f(best.t) + 'px'; }
    var tx = clamp(p.x - best.l, 18, w - 18), ty = clamp(p.y - best.t, 16, h - 16), tl = best.tail;
    ubub.setAttribute('data-tail', tl);
    ubub.style.setProperty('--tx', f(tx) + 'px');
    ubub.style.setProperty('--ty', f(ty) + 'px');
    // La cola sale de la esquina de arriba a la izquierda y llega a su lado con translate, en el mismo
    // lugar que le darían left, top, right y bottom, así cambiar de lado no suma CLS.
    ubub.style.setProperty('--px', f(tl === 'l' ? -7 : tl === 'r' ? w - 7 : tx - 6) + 'px');
    ubub.style.setProperty('--py', f(tl === 't' ? -7 : tl === 'b' ? h - 7 : ty - 6) + 'px');
  }
  // Mide la burbuja con cada ancho posible y se queda con el que mejor cabe. Ante un empate gana el
  // primero, el más ancho. Si ninguno cabe libre, prueba además una burbuja compacta, con letra de
  // 13,5 px, que en una compu baja cabe entre la barra y el panel del QR, o en una angosta, entre el
  // teléfono y el borde de la ventana, y en un celular bajo, sobre el botón de pausa.
  function bubFit() {
    var ws = bubWidths(), best = null, bw = 0, bh = 0, bm = ws[0], bc = false;
    [false, true].forEach(function (compact) {
      // En la compu, en un hueco de menos de 140 px, la compacta gana si cabe libre, porque lleva
      // menos renglones.
      var narrow = L.wide && best && bw < 140;
      if (compact && best.k < 1 && !narrow) return;
      ubub.classList.toggle('is-compact', compact);
      ws.forEach(function (mw) {
        ubub.style.maxWidth = mw + 'px';
        var w = ubub.offsetWidth, h = ubub.offsetHeight, q = bubBest(w, h, null);
        var ok = q.hard <= 0.5, bok = best && best.hard <= 0.5;
        if (!best || (ok !== bok ? ok : q.k < best.k - 1 || (compact && narrow && q.k < 1))) { best = q; bw = w; bh = h; bm = mw; bc = compact; }
      });
    });
    ubub.classList.toggle('is-compact', bc);
    ubub.style.maxWidth = bm + 'px';
    U.bub.w = bw; U.bub.h = bh; U.bub.cand = best.n;
  }
  function bubShow(ts) {
    var txt = uliText(U.idx), shout = uliShout(U.idx);
    if (!txt && !shout) return;
    ubT.textContent = txt;
    if (ubS) ubS.textContent = shout;
    ubub.classList.toggle('is-67', !!shout);
    ubub.classList.toggle('solo-67', !!shout && !U.t67both);
    bubFit();
    instant(ubub, bubPlace);
    U.bub.on = true;
    ubub.classList.add('is-on');
    U.talk = ts;
  }
  // Ulises dice otra cosa sin moverse, como la respuesta al 67.
  function uliSay() {
    if (!U.ok || U.fl) return;
    if (U.bub.on) bubHide();
    U.showAt = now() + (reduce || still ? 0 : 140);
    requestRender();
  }
  function uliGo(ts, jump) {
    bubHide();
    var B = spotXY(U.spot);
    if (jump || reduce || still) {
      U.fl = null; U.x = B.x; U.y = B.y; U.land = -1e9; U.showAt = ts; U.face = restFace();
      return;
    }
    var A = { x: U.x, y: U.y }, len = along(pathPts(A, B), 1).len;
    U.fl = { t0: ts, dur: clamp(380 + len * 0.55, 650, 1300), A: A };
    U.showAt = 1e15;
  }
  // Al pausar a mitad de un vuelo, Ulises llega de una vez.
  function uliStill() { if (still && U.fl) { U.fl = null; U.land = -1e9; U.showAt = 0; U.face = restFace(); } }
  function uliOff() { uli.classList.remove('is-on'); bubHide(); }

  // Dibuja a Ulises en el instante [ts] para el paso [idx]. Devuelve si sigue en movimiento.
  var LKX = [0, 0.2, 0.48, 0.74, 1], LSX = [1, 1.16, 0.95, 1.03, 1], LSY = [1, 0.8, 1.08, 0.98, 1], LDY = [0, 0, -0.11, 0, 0];
  function renderUli(ts, idx) {
    if (!L.rig) { if (U.ok || uli.classList.contains('is-on')) uliOff(); U.ok = false; return false; }
    U.s = uliSize();
    if (!U.ok) {
      if (introStart === null) return false;
      var wait = introStart + NATIVE + INTRO_END[variant] + ARRIVE - ts;
      if (!reduce && wait > 0) return true;
      U.ok = true; U.mode = L.mode; U.idx = idx; U.spot = spotOf(idx);
      var B0 = spotXY(U.spot);
      // Llega volando desde arriba a la derecha, por fuera del teléfono.
      U.x = L.vw + U.s; U.y = B0.y - (L.wide ? 220 : 90); U.face = -1;
      uliGo(ts, false);
    }
    if (U.mode !== L.mode) { U.mode = L.mode; U.idx = idx; U.spot = spotOf(idx); uliGo(ts, true); }
    if (idx !== U.idx) {
      U.idx = idx;
      var sp = spotOf(idx), nb = spotXY(sp);
      if (Math.abs(nb.x - U.x) + Math.abs(nb.y - U.y) < 48) sp = altSpot(sp);
      U.spot = sp;
      uliGo(ts, false);
    }
    var x, y, rot = 0, sx = 1, sy = 1, busy = false;
    if (U.fl) {
      var pr = clamp((ts - U.fl.t0) / U.fl.dur), q = along(pathPts(U.fl.A, spotXY(U.spot)), inOutSine(pr));
      var env = Math.sin(Math.PI * pr), flap = Math.abs(Math.sin(pr * Math.PI * 5)), ln = Math.sqrt(q.dx * q.dx + q.dy * q.dy) || 1;
      x = q.x; y = q.y - 3 * Math.sin(pr * Math.PI * 10) * env;
      if (Math.abs(q.dx) > 0.5) U.face = q.dx > 0 ? 1 : -1;
      rot = 14 * (q.dx / ln) * env;
      sy = 1 - 0.1 * flap * env; sx = 1 + 0.04 * flap * env;
      busy = true;
      if (pr >= 1) { U.fl = null; U.land = ts; U.showAt = ts + BUB_DELAY; U.face = restFace(); }
    } else {
      var B = spotXY(U.spot);
      x = B.x; y = B.y; U.face = restFace();
      // Rebote al posarse, con compresión contra el canto, estiramiento y asiento.
      var lp = (ts - U.land) / LAND;
      if (lp >= 0 && lp < 1) {
        var i = 0;
        while (i < LKX.length - 2 && lp > LKX[i + 1]) i++;
        var qq = inOutSine(clamp((lp - LKX[i]) / (LKX[i + 1] - LKX[i])));
        sx = lerp(LSX[i], LSX[i + 1], qq); sy = lerp(LSY[i], LSY[i + 1], qq); y += lerp(LDY[i], LDY[i + 1], qq) * U.s;
        busy = true;
      }
      // Habla con un leve asentimiento cuando aparece su burbuja, salvo con movimiento reducido o con
      // las animaciones en pausa.
      var tp = reduce || still ? -1 : (ts - U.talk) / TALK;
      if (tp >= 0 && tp < 1) { var s1 = Math.sin(Math.PI * tp); sx *= 1 + 0.06 * s1; sy *= 1 + 0.06 * s1; rot = -6 * s1 * U.face; busy = true; }
      if (!U.bub.on && U.showAt < 1e15) { if (ts >= U.showAt) bubShow(ts); else busy = true; }
    }
    U.x = x; U.y = y;
    // Al final de la página el escenario sube y Ulises se va con él.
    var R = rigBox(), vis = R.top > L.navH - 36 && R.bottom > L.navH + 80;
    uli.style.setProperty('--us', U.s + 'px');
    uli.style.transform = 'translate(' + f(x - U.s / 2) + 'px,' + f(y - U.s / 2) + 'px)';
    uliF.style.transform = 'rotate(' + f(rot) + 'deg) scale(' + (sx * U.face).toFixed(3) + ',' + sy.toFixed(3) + ')';
    uli.classList.toggle('is-on', vis);
    ubub.classList.toggle('is-hid', !vis);
    if (U.bub.on) bubPlace();
    return busy;
  }

  /* ---------- Portada, salida del splash y cuadro a cuadro ---------- */
  var S2 = { idx: -1 };
  // La salida del splash empieza una sola vez. En la compu, al bajar un poco («Baja y la app se
  // abre»); en el celular, sola al terminar la intro y su pausa, o antes si se baja. Bajar nunca
  // corta la intro del logo. Solo adelanta la salida hasta el fin de la intro (como mucho 1,33 s
  // después del splash nativo), como pide la spec, que la empieza en max(fin de la intro, carga).
  // Desde ahí corre por tiempo hasta el final, se baje como se baje, así nunca queda congelada a
  // medias. Con movimiento reducido el logo aparece entero y la app entra de una vez.
  function splashProgress(ts, y) {
    if (EX.t0 === null && introStart !== null) {
      var scrolled = y > (L.wide ? 0.04 * L.vh : 6);
      var auto = !L.wide && ts - introStart - NATIVE >= (reduce ? 700 : INTRO_END[variant] + HOLD);
      if (auto || (scrolled && reduce)) EX.t0 = ts;
      else if (scrolled) EX.t0 = Math.max(ts, introStart + NATIVE + INTRO_END[variant]);
    }
    if (EX.t0 === null) return 0;
    return reduce ? 1 : seg(ts - EX.t0, 0, EXIT_DUR[variant]);
  }

  var uliBusy = false;
  function update(ts) {
    var y = win.pageYOffset, p = splashProgress(ts, y), idx = 0;
    if (L.rig) {
      if (L.wide) {
        var e = reduce ? (y > 0.3 * L.vh ? 1 : 0) : inOutCubic(clamp(y / (0.62 * L.vh)));
        rig.style.transform = 'translateX(' + f(L.heroDx * (1 - e)) + 'px)';
        var ho = 1 - clamp((y - 0.08 * L.vh) / (0.34 * L.vh));
        hero.style.opacity = f(ho);
        hero.style.pointerEvents = ho < 0.05 ? 'none' : '';
        cue.style.opacity = f(1 - clamp(p * 4));
      } else {
        rig.style.transform = '';
        hero.style.opacity = '';
        hero.style.pointerEvents = '';
      }
      root.style.setProperty('--gk', f(lerp(1, 0.45, p)));
      idx = activeIndex(y);
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
      if (L.wide) updateLeader(idx, p, ts); else leaderOff();
    } else {
      rig.style.transform = '';
      hero.style.opacity = '';
      hero.style.pointerEvents = '';
      root.style.removeProperty('--gk');
      if (T.idx !== -1) startRigTour(-1);
      setScreen('malla', false);
      leaderOff();
    }
    uliBusy = renderUli(ts, idx);
    renderFx(ts, p);
    return p;
  }

  var pending = false;
  function requestRender() { if (!pending) { pending = true; win.requestAnimationFrame(frame); } }
  function frame(ts) {
    pending = false;
    var p = update(ts), busy = uliBusy;
    // Sigue pidiendo cuadros mientras corre la intro, la salida o la espera en bucle del logo. La
    // espera se detiene con las animaciones en pausa, salvo en el celular, donde la salida llega sola.
    if (introStart !== null && !reduce && p < 1) {
      var el = ts - introStart - NATIVE;
      if (el < FX_END[variant] || EX.t0 !== null || !still || !L.wide) busy = true;
    }
    if (busy) requestRender();
  }
  function startIntro() {
    if (introStart !== null) return;
    introStart = now();
    requestRender();
    // Con movimiento reducido no hay cuadros seguidos. La app y Ulises entran a su hora.
    if (reduce) setTimeout(requestRender, NATIVE + 760);
  }

  /* ---------- Arranque ---------- */
  var remeasure = function () { measure(); U.bub.cand = null; if (U.bub.on && U.spot && L.rig) bubFit(); requestRender(); };
  win.addEventListener('scroll', requestRender, { passive: true });
  win.addEventListener('resize', remeasure);
  win.addEventListener('load', remeasure);
  if (win.ResizeObserver) new ResizeObserver(remeasure).observe(doc.body);
  onChange(mqWide, remeasure);
  onChange(mqCmp, remeasure);
  onChange(mqReduce, function () {
    reduce = !!mqReduce.matches; cur = null; lastP = -1;
    // Los recorridos vuelven a empezar con la preferencia nueva.
    T.idx = -2;
    shotTours.forEach(function (s) { s.fig.classList.toggle('rv', !reduce); if (s.on && !L.rig) playShot(s); });
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
