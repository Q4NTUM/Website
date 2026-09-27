/* ==========================================================================
   PAMA — behaviour
   Every feature is an independent function run through safe(); a failure in
   one never blocks the others. If this file fails entirely, chrome.js
   un-hides all content after a short timeout.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const html = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const { ICONS = {}, ROOT = "" } = window.PAMA || {};
  const DATA = window.PAMA_DATA || {};
  const I18N = window.PAMA_I18N || { lang: "en", locale: "en-US", t: (k, f) => f, pick: (o, f) => o[f], apply() {} };
  const t = (k, f) => I18N.t(k, f);
  const fr = () => I18N.lang === "fr";
  const NBSP = "\u00a0";
  const TZ = "America/Edmonton";
  const LON = -112.86;

  /* ------------------------------------------------------------------
     Data — derived lazily inside safe() so a bad entry can't take the
     whole site down.
  ------------------------------------------------------------------ */
  let events = [], upcoming = [], past = [], posts = [];
  let offFmt = null;
  try { offFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" }); } catch (e) { /* old browser */ }

  // Wall-clock Lethbridge time ("2026-10-08 18:00") → Date, DST handled.
  function lethbridge(local) {
    const s = String(local || "").trim();
    if (/[zZ]$|[+-]\d\d:\d\d$/.test(s)) return new Date(s);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
    if (!m) return new Date(NaN);
    const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00`;
    const offsetAt = (d) => {
      if (offFmt) {
        const v = offFmt.formatToParts(d).find((p) => p.type === "timeZoneName").value.replace("GMT", "");
        return v || "+00:00";
      }
      // Fallback: Canadian DST rule (2nd Sunday of March → 1st Sunday of November)
      const y = +m[1], mar = new Date(Date.UTC(y, 2, 8)), nov = new Date(Date.UTC(y, 10, 1));
      const start = Date.UTC(y, 2, 8 + ((7 - mar.getUTCDay()) % 7), 9), end = Date.UTC(y, 10, 1 + ((7 - nov.getUTCDay()) % 7), 8);
      return d >= start && d < end ? "-06:00" : "-07:00";
    };
    const first = new Date(iso + offsetAt(new Date(iso + "Z")));
    return new Date(iso + offsetAt(first));
  }

  function initData() {
    events = (DATA.events || [])
      .map((e) => ({ ...e, s: lethbridge(e.start), e: lethbridge(e.end) }))
      .filter((e) => {
        const ok = e.id && e.title && !isNaN(e.s) && !isNaN(e.e);
        if (!ok) console.warn("[PAMA] Skipping an event in data.js with a missing id/title or invalid date:", e);
        return ok;
      })
      .sort((a, b) => a.s - b.s);
    const now = new Date();
    upcoming = events.filter((e) => e.e >= now);
    past = events.filter((e) => e.e < now).reverse();
    posts = (DATA.news || [])
      .filter((p) => p && p.id && /^\d{4}-\d\d-\d\d$/.test(p.date) && Array.isArray(p.body))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /* ------------------------------------------------------------------
     Starfield — the same seeded sky on every page (no jump between pages),
     drawn once to an offscreen layer; only a few stars twinkle and the
     slow upward drift from the original site runs at ~30 fps.
  ------------------------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t2 = Math.imul(a ^ (a >>> 15), 1 | a);
      t2 = (t2 + Math.imul(t2 ^ (t2 >>> 7), 61 | t2)) ^ t2;
      return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296;
    };
  }

  function starfield() {
    const canvas = document.createElement("canvas");
    canvas.className = "starfield";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    let w = 0, h = 0, dpr = 1, lastW = 0, lastH = 0, twinklers = [], drifters = [], raf = 0, last = 0, lastDraw = 0;

    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const sg = sprite.getContext("2d");
    const grad = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.18, "rgba(255,255,255,.85)");
    grad.addColorStop(0.45, "rgba(255,255,255,.18)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    sg.fillStyle = grad; sg.fillRect(0, 0, 32, 32);

    const spawn = (anywhere) => ({
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 12,
      r: Math.random() * 1.1 + 0.6,
      v: h / (60 * (15 + Math.random() * 15)), // crosses the screen in 15–30 s, like the original
      max: Math.random() * 0.45 + 0.35,
    });

    function buildSky() {
      // Seeded: identical star positions on every page load
      const rnd = mulberry32(0x9a3a);
      layer.width = w * dpr; layer.height = h * dpr;
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.fillStyle = "#dfe8ff";
      const count = Math.round((w * h) / 9000);
      twinklers = [];
      for (let i = 0; i < count; i++) {
        const s = { x: rnd() * w, y: rnd() * h, r: rnd() * 0.9 + 0.2, a: rnd() * 0.5 + 0.15, t: rnd() * 6.283, sp: rnd() * 0.012 + 0.003 };
        if (i % Math.max(1, Math.round(count / 30)) === 0) { twinklers.push(s); continue; }
        lctx.globalAlpha = s.a;
        lctx.beginPath(); lctx.arc(s.x, s.y, s.r, 0, 6.283); lctx.fill();
      }
      lctx.globalAlpha = 1;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Mobile toolbars change the height while scrolling — only rebuild on real changes
      if (w !== lastW || Math.abs(h - lastH) > 120 || !twinklers.length) {
        buildSky();
        drifters = Array.from({ length: Math.round(Math.min(44, (w * h) / 28000)) }, () => spawn(true));
        lastW = w; lastH = h;
      }
      frame(0);
    }

    function frame(dt) {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(layer, 0, 0, w, h);
      ctx.fillStyle = "#dfe8ff";
      for (const s of twinklers) {
        s.t += s.sp * dt;
        ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(s.t));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 0.15, 0, 6.283); ctx.fill();
      }
      for (let i = 0; i < drifters.length; i++) {
        const p = drifters[i];
        p.y -= p.v * dt;
        if (p.y < -12) { drifters[i] = spawn(false); continue; }
        const life = p.y / h; // fade in at the bottom, out at the top
        ctx.globalAlpha = Math.max(0, Math.min(p.max, Math.min(life, 1 - life) * 4 * p.max));
        const size = p.r * 7;
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - lastDraw < 32) return; // ~30 fps is plenty for motion this slow
      const dt = last ? Math.min(4, (now - last) / 16.667) : 1;
      last = now; lastDraw = now;
      frame(dt);
    }

    resize();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (reduceMotion) return;
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden) raf = requestAnimationFrame(loop);
    });
  }

  /* ------------------------------------------------------------------
     Header: solid state on scroll; hero parallax on home
  ------------------------------------------------------------------ */
  function header() {
    const el = $("[data-header]");
    const heroBg = $(".hero__bg");
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (el) el.classList.toggle("is-scrolled", y > 24);
      if (heroBg && !reduceMotion && y < window.innerHeight * 1.2) heroBg.style.setProperty("--parallax", (y * 0.28).toFixed(1) + "px");
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     Particle menu — hover (with intent) on desktop; click/tap/keys everywhere
  ------------------------------------------------------------------ */
  function menu() {
    const nav = $("[data-menu]");
    if (!nav) return;
    const btn = $(".menu__toggle", nav);
    const veil = $("[data-menu-veil]");
    const items = $$(".menu__item", nav);
    let openTimer, closeTimer, hoverOpenedAt = 0, viaKeys = false;
    const isOpen = () => nav.classList.contains("is-open");
    const focusInside = () => nav.contains(document.activeElement) && document.activeElement !== btn;

    function set(open, { focus = false, hover = false } = {}) {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      // The dimming veil is for deliberate opens; a desktop hover-peek stays light
      if (veil) veil.classList.toggle("is-visible", open && !hover);
      if (!finePointer) html.style.overflow = open ? "hidden" : "";
      viaKeys = open && focus;
      if (open && focus) setTimeout(() => items[0] && items[0].focus(), 60);
    }

    btn.addEventListener("click", (e) => {
      if (isOpen() && e.detail > 0 && performance.now() - hoverOpenedAt < 700) {
        if (veil) veil.classList.add("is-visible"); // a click on a hover-open makes it "deliberate"
        return;
      }
      set(!isOpen(), { focus: e.detail === 0 });
    });
    if (finePointer) {
      nav.addEventListener("mouseenter", () => {
        clearTimeout(closeTimer);
        openTimer = setTimeout(() => { if (!isOpen()) { hoverOpenedAt = performance.now(); set(true, { hover: true }); } }, 160);
      });
      nav.addEventListener("mouseleave", () => {
        clearTimeout(openTimer);
        closeTimer = setTimeout(() => { if (!focusInside()) set(false); }, 260);
      });
    }
    items.forEach((a) => a.addEventListener("click", () => setTimeout(() => set(false), 0)));
    if (veil) veil.addEventListener("click", () => set(false));
    window.addEventListener("pageshow", () => set(false)); // back/forward cache restore
    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (e.key === "Escape") { set(false); btn.focus(); return; }
      if (!viaKeys && !focusInside()) return; // don't hijack arrows for a hover-open
      const i = items.indexOf(document.activeElement);
      let next = null;
      if (e.key === "ArrowDown") next = i < 0 ? 0 : (i + 1) % items.length;
      if (e.key === "ArrowUp") next = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = items.length - 1;
      if (next !== null) { e.preventDefault(); items[next].focus(); }
    });
    nav.addEventListener("focusout", (e) => { if (e.relatedTarget && !nav.contains(e.relatedTarget)) set(false); });
  }

  /* ------------------------------------------------------------------
     Scroll reveal (automatic stagger for [data-stagger] children)
  ------------------------------------------------------------------ */
  let io;
  function reveal(root = document) {
    $$("[data-stagger]", root).forEach((group) => {
      Array.from(group.children).forEach((c, i) => {
        if (!c.classList.contains("reveal")) { c.classList.add("reveal"); c.style.setProperty("--d", i * 80 + "ms"); }
      });
    });
    const els = $$(".reveal:not(.is-in)", root);
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
    io = io || new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }
  // Re-render a list without replaying its entrance if it was already shown
  function rerender(el, markup) {
    const shown = !!el.querySelector(".is-in");
    el.innerHTML = markup;
    if (shown) Array.from(el.children).forEach((c) => c.classList.add("reveal", "is-in"));
  }

  /* Cursor spotlight on interactive cards */
  function spotlight() {
    if (!finePointer) return;
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest && e.target.closest(".card--interactive");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Generative line art (pillars, news, cards)
  ------------------------------------------------------------------ */
  const ART = {
    orbit: () => `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><radialGradient id="g-o" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9edcff" stop-opacity=".35"/><stop offset="1" stop-color="#9edcff" stop-opacity="0"/></radialGradient></defs>
        <circle cx="160" cy="100" r="60" fill="url(#g-o)"/>
        <g fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".8">
          <ellipse cx="160" cy="100" rx="120" ry="34" transform="rotate(-14 160 100)"/>
          <ellipse cx="160" cy="100" rx="80" ry="24" transform="rotate(-14 160 100)"/>
          <ellipse cx="160" cy="100" rx="150" ry="52" transform="rotate(-14 160 100)" stroke-dasharray="2 5"/>
        </g>
        <circle cx="160" cy="100" r="7" fill="#eceef4"/>
        <g transform="rotate(-14 160 100)"><circle r="3" fill="#9edcff"><animateMotion dur="16s" repeatCount="indefinite" path="M280 100a120 34 0 1 1-240 0a120 34 0 1 1 240 0"/></circle></g>
      </svg>`,
    wave() {
      let d1 = "", d2 = "";
      for (let x = 0; x <= 320; x += 4) {
        const env = Math.exp(-Math.pow((x - 160) / 80, 2));
        d1 += (x ? "L" : "M") + x + " " + (100 + Math.sin(x / 9) * 44 * env).toFixed(1);
        d2 += (x ? "L" : "M") + x + " " + (100 + Math.cos(x / 9) * 44 * env).toFixed(1);
      }
      return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M0 100H320" stroke="rgba(255,255,255,.12)"/>
        <path d="${d2}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
        <path d="${d1}" fill="none" stroke="#9edcff" stroke-width="1.2"/></svg>`;
    },
    lattice() {
      let g = "";
      for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) {
        const x = 20 + i * 36 + (j % 2) * 18, y = 18 + j * 34, d = Math.hypot(x - 160, y - 100);
        g += `<circle cx="${x}" cy="${y}" r="${(2.6 - d / 110).toFixed(2)}" fill="${d < 60 ? "#9edcff" : "rgba(255,255,255,.4)"}"/>`;
      }
      return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g stroke="rgba(255,255,255,.08)">${Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 36} 0V200"/>`).join("")}</g>${g}</svg>`;
    },
    spiral() {
      let d = "";
      const phi = (1 + Math.sqrt(5)) / 2;
      for (let a = 0; a < 4.2 * Math.PI; a += 0.05) {
        const r = 2.2 * Math.pow(phi, (2 * a) / Math.PI);
        d += (a ? "L" : "M") + (160 + r * Math.cos(a)).toFixed(1) + " " + (100 + r * Math.sin(a)).toFixed(1);
      }
      return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="${d}" fill="none" stroke="#9edcff" stroke-width="1"/>
        <g fill="none" stroke="rgba(255,255,255,.1)"><circle cx="160" cy="100" r="30"/><circle cx="160" cy="100" r="70"/><circle cx="160" cy="100" r="110"/></g></svg>`;
    },
    constellation() {
      const pts = [[40, 140], [86, 96], [128, 118], [170, 62], [214, 84], [256, 40], [282, 128], [214, 150]];
      const lines = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7], [7, 2]];
      return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g stroke="rgba(158,220,255,.4)" stroke-width=".8">${lines.map(([a, b]) => `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}"/>`).join("")}</g>
        ${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 2 : 3}" fill="#eceef4"/>`).join("")}</svg>`;
    },
    lissajous() {
      let d = "";
      for (let a = 0; a <= Math.PI * 2 + 0.02; a += 0.02) {
        d += (a ? "L" : "M") + (160 + 92 * Math.sin(3 * a + Math.PI / 2)).toFixed(1) + " " + (100 + 80 * Math.sin(2 * a)).toFixed(1);
      }
      return `<svg viewBox="0 0 320 200" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;
    },
    field() {
      // Dipole field lines between a + and a − charge
      let g = "";
      for (let k = 1; k <= 5; k++) {
        const a = k * 13;
        g += `<path d="M104 100 C 130 ${100 - a}, 190 ${100 - a}, 216 100"/><path d="M104 100 C 130 ${100 + a}, 190 ${100 + a}, 216 100"/>`;
      }
      return `<svg viewBox="0 0 320 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".8" opacity=".75">${g}<path d="M104 100H216"/></g>
        <circle cx="100" cy="100" r="7" fill="#04060c" stroke="currentColor"/><path d="M96 100h8M100 96v8" stroke="currentColor"/>
        <circle cx="220" cy="100" r="7" fill="#04060c" stroke="#9edcff"/><path d="M216 100h8" stroke="#9edcff"/></svg>`;
    },
    ellipses: () => `<svg viewBox="0 0 320 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".8">
        <ellipse cx="160" cy="100" rx="130" ry="40" opacity=".4"/><ellipse cx="160" cy="100" rx="90" ry="28" opacity=".7"/><ellipse cx="160" cy="100" rx="48" ry="15"/></g>
        <circle cx="160" cy="100" r="9" fill="currentColor"/><circle r="3.5" fill="#9edcff"><animateMotion dur="12s" repeatCount="indefinite" path="M250 100a90 28 0 1 1-180 0a90 28 0 1 1 180 0"/></circle></svg>`,
  };
  const stripMotion = (root = document) => { if (reduceMotion) $$("animateMotion", root).forEach((m) => m.remove()); };
  function art(root = document) {
    $$("[data-art]", root).forEach((el) => { const f = ART[el.dataset.art]; if (f) el.innerHTML = f(); });
    stripMotion(root);
  }

  /* ------------------------------------------------------------------
     Formatting (locale follows the language switch)
  ------------------------------------------------------------------ */
  const F = {};
  function buildFormats() {
    const mk = (o) => new Intl.DateTimeFormat(I18N.locale, { timeZone: TZ, ...o });
    F.day = mk({ day: "2-digit" });
    F.dayNum = mk({ day: "numeric" });
    F.mon = mk({ month: "short" });
    F.monLong = mk({ month: "long" });
    F.wk = mk({ weekday: "short" });
    F.time = mk({ hour: "numeric", minute: "2-digit" });
    F.hm = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    F.monthYear = mk({ month: "long", year: "numeric" });
    F.year = mk({ year: "numeric" });
    F.pct = new Intl.NumberFormat(I18N.locale, { style: "percent" });
    F.plural = new Intl.PluralRules(I18N.locale);
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const shortLabel = (s) => s.replace(/\.$/, ""); // "oct." → "oct" for the tiny caps label only

  // "19 h" / "19 h 30" in French; "7:00 PM" in English
  function clock(d) {
    if (!fr()) return F.time.format(d).replace(" ", NBSP);
    const [hh, mm] = F.hm.format(d).split(":");
    return `${+hh}${NBSP}h${mm === "00" ? "" : NBSP + mm}`;
  }
  function timeRange(a, b) {
    if (!fr()) {
      try { if (F.time.formatRange) return F.time.formatRange(a, b).replace(/ (AM|PM)/g, NBSP + "$1"); } catch (e) { /* fall through */ }
    }
    return `${clock(a)} – ${clock(b)}`;
  }
  // "Oct 1" / "1er oct." — used in running text
  function dayMonth(d) {
    const n = +F.dayNum.format(d);
    if (fr()) return `${n === 1 ? "1er" : n}${NBSP}${F.mon.format(d)}`;
    return `${F.mon.format(d)}${NBSP}${n}`;
  }
  // "September 20, 2026" / "20 septembre 2026" (news dates are calendar dates, no TZ)
  function longDate(ymd) {
    const d = new Date(ymd + "T12:00:00Z");
    const f = (o) => new Intl.DateTimeFormat(I18N.locale, { timeZone: "UTC", ...o }).format(d);
    if (fr()) { const n = d.getUTCDate(); return `${n === 1 ? "1er" : n} ${f({ month: "long" })} ${f({ year: "numeric" })}`; }
    return f({ month: "long", day: "numeric", year: "numeric" });
  }

  /* ------------------------------------------------------------------
     Events
  ------------------------------------------------------------------ */
  const CATS = { talk: "Talk", observing: "Observing", workshop: "Workshop", social: "Social", competition: "Competition" };
  const evId = (ev) => "ev-" + ev.id; // prefixed so event ids never clash with page anchors
  const ARCHIVE_VISIBLE = 6;

  function gcalUrl(ev) {
    const st = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const q = new URLSearchParams({
      action: "TEMPLATE", text: "PAMA · " + I18N.pick(ev, "title"), dates: `${st(ev.s)}/${st(ev.e)}`,
      location: `${I18N.pick(ev, "location")}, ${t("footer.uni", "University of Lethbridge")}`,
      details: I18N.pick(ev, "desc"), ctz: TZ,
    });
    return "https://calendar.google.com/calendar/render?" + q.toString();
  }

  function eventRow(ev, { isNext = false, isPast = false, hl = 3 } = {}) {
    const title = I18N.pick(ev, "title"), desc = I18N.pick(ev, "desc"), loc = I18N.pick(ev, "location");
    const H = "h" + hl;
    const live = !isPast && ev.s <= new Date();
    const addLabel = t("events.addToFmt", "Add “{title}” to your calendar").replace("{title}", title);
    const calendar = isPast ? "" : `
      <details class="cal">
        <summary class="icon-btn" aria-label="${esc(addLabel)}" title="${esc(t("events.addTo", "Add to calendar"))}">${ICONS.calendar || "+"}</summary>
        <div class="cal__menu">
          <a href="${esc(gcalUrl(ev))}" target="_blank" rel="noopener">Google Calendar</a>
          <button type="button" data-ics="${esc(ev.id)}">${esc(t("events.ics", "Apple / Outlook (.ics)"))}</button>
        </div>
      </details>`;
    const flag = live ? `<span class="tag tag--next">${esc(t("events.live", "Happening now"))}</span>`
      : isNext ? `<span class="tag tag--next">${esc(t("events.next", "Next up"))}</span>` : "";
    return `
      <article class="event${isPast ? " is-past" : ""}" id="${esc(evId(ev))}" data-cat="${esc(ev.cat)}">
        <time class="event__date" datetime="${ev.s.toISOString()}">
          <span class="event__day">${F.day.format(ev.s)}</span>
          <span class="event__mon">${shortLabel(F.mon.format(ev.s))}<small>${shortLabel(F.wk.format(ev.s))}</small></span>
        </time>
        <div class="event__body">
          <div class="event__tags">
            <span class="tag">${esc(t("cat." + ev.cat, CATS[ev.cat] || ev.cat))}</span>${flag}
          </div>
          <${H} class="event__title">${esc(title)}</${H}>
          <p class="event__desc">${esc(desc)}</p>
        </div>
        <div class="event__meta">
          <span>${ICONS.clock || ""}${timeRange(ev.s, ev.e)}</span>
          <span>${ICONS.pin || ""}${esc(loc)}</span>
        </div>
        <div class="event__actions">${calendar}</div>
      </article>`;
  }

  let currentCat = "all";
  function renderEvents() {
    const empty = `<p class="empty">${esc(t("events.none", "New events are being planned — check back soon."))}</p>`;
    $$("[data-events-upcoming]").forEach((el) => {
      const n = parseInt(el.dataset.eventsUpcoming, 10) || 3;
      el.innerHTML = upcoming.slice(0, n).map((ev, i) => eventRow(ev, { isNext: i === 0 })).join("") || empty;
    });

    const full = $("[data-events-full]");
    if (full) {
      const list = upcoming.filter((e) => currentCat === "all" || e.cat === currentCat);
      if (!list.length) full.innerHTML = currentCat === "all" ? empty : `<p class="empty">${esc(t("events.noneCat", "Nothing scheduled in this category yet — new events are added every few weeks."))}</p>`;
      else {
        let out = "", month = "";
        list.forEach((ev) => {
          const m = cap(F.monthYear.format(ev.s));
          if (m !== month) { if (month) out += "</div>"; month = m; out += `<h3 class="month-label">${m}</h3><div class="event-list">`; }
          out += eventRow(ev, { isNext: ev === upcoming[0], hl: 4 });
        });
        full.innerHTML = out + "</div>";
      }
    }

    const archive = $("[data-events-past]");
    if (archive) {
      const rows = past.map((ev) => eventRow(ev, { isPast: true }));
      archive.innerHTML = !rows.length
        ? `<p class="empty">${esc(t("events.archiveEmpty", "The archive starts with our first event."))}</p>`
        : rows.slice(0, ARCHIVE_VISIBLE).join("") + (rows.length > ARCHIVE_VISIBLE
          ? `<details class="archive-more"><summary class="link">${esc(t("events.older", "Show older events"))} (${rows.length - ARCHIVE_VISIBLE})</summary>${rows.slice(ARCHIVE_VISIBLE).join("")}</details>` : "");
    }

    // Hero teaser: next event, or the latest news if nothing is scheduled
    const teaser = $("[data-teaser]");
    if (teaser) {
      const kicker = $("[data-teaser-kicker]", teaser), text = $("[data-teaser-text]", teaser);
      if (upcoming[0]) {
        const ev = upcoming[0];
        teaser.href = ROOT + "events.html#" + evId(ev);
        kicker.textContent = ev.s <= new Date() ? t("events.live", "Happening now") : t("events.next", "Next up");
        text.textContent = `${I18N.pick(ev, "title")} — ${dayMonth(ev.s)}`;
      } else if (posts[0]) {
        teaser.href = ROOT + "news.html#" + posts[0].id;
        kicker.textContent = t("news.latest", "Latest");
        text.textContent = I18N.pick(posts[0], "title");
      }
    }
    $$("[data-upcoming-count]").forEach((el) => { el.textContent = String(upcoming.length).padStart(2, "0"); });
  }

  function announceCount() {
    const status = $("[data-events-status]");
    if (!status) return;
    const n = upcoming.filter((e) => currentCat === "all" || e.cat === currentCat).length;
    const form = F.plural.select(n) === "one" ? "one" : "other";
    status.textContent = t("events.showing." + form, form === "one" ? "Showing {n} event" : "Showing {n} events").replace("{n}", n);
  }

  function eventsUI() {
    const full = $("[data-events-full]");
    const chips = $$("[data-filter]");
    chips.forEach((c) => c.addEventListener("click", () => {
      if (c.dataset.filter === currentCat) return;
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      currentCat = c.dataset.filter;
      if (!full || reduceMotion) { renderEvents(); announceCount(); return; }
      full.classList.add("is-swapping");
      setTimeout(() => { renderEvents(); announceCount(); full.classList.remove("is-swapping"); }, 220);
    }));

    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ics]");
      if (b) { const ev = events.find((x) => x.id === b.dataset.ics); if (ev) downloadICS(ev); }
      $$("details.cal[open]").forEach((d) => { if (!d.contains(e.target) || b) d.open = false; });
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") $$("details.cal[open]").forEach((d) => { d.open = false; }); });

    // Deep link to an event (e.g. from the home teaser)
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (target && target.classList.contains("event")) setTimeout(() => target.scrollIntoView({ block: "center" }), 300);

    // Structured data so search engines can list upcoming events
    if (full && upcoming.length) {
      const base = new URL("events.html", ROOT || location.href).href;
      const ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify(upcoming.map((ev) => ({
        "@context": "https://schema.org", "@type": "Event",
        name: ev.title, description: ev.desc, url: `${base}#${evId(ev)}`, inLanguage: "en",
        startDate: ev.s.toISOString(), endDate: ev.e.toISOString(),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place", name: ev.location,
          address: { "@type": "PostalAddress", streetAddress: "4401 University Dr W", addressLocality: "Lethbridge", addressRegion: "AB", postalCode: "T1K 3M4", addressCountry: "CA" },
        },
        organizer: { "@type": "Organization", name: "PAMA — Physics, Astronomy & Mathematics Association", url: ROOT },
        isAccessibleForFree: true,
      })));
      document.head.appendChild(ld);
    }
  }

  const enc = new TextEncoder();
  function downloadICS(ev) {
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const txt = (s) => String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
    const fold = (line) => { // RFC 5545: lines of at most 75 octets
      const out = []; let cur = "";
      for (const ch of line) {
        if (enc.encode(cur + ch).length > 73) { out.push(cur); cur = " " + ch; } else cur += ch;
      }
      out.push(cur);
      return out.join("\r\n");
    };
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PAMA//Events//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${ev.id}@pama.uleth`, `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(ev.s)}`, `DTEND:${stamp(ev.e)}`,
      `SUMMARY:${txt("PAMA · " + I18N.pick(ev, "title"))}`,
      `LOCATION:${txt(I18N.pick(ev, "location") + ", " + t("footer.uni", "University of Lethbridge"))}`,
      `DESCRIPTION:${txt(I18N.pick(ev, "desc"))}`,
      "END:VEVENT", "END:VCALENDAR",
    ].map(fold).join("\r\n");

    const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (iOS) { // opening directly offers "Add to Calendar" on iOS/iPadOS
      location.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
      return;
    }
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `pama-${ev.id}.ics` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ------------------------------------------------------------------
     News
  ------------------------------------------------------------------ */
  function renderNews() {
    $$("[data-news-latest]").forEach((el) => {
      const n = parseInt(el.dataset.newsLatest, 10) || 3;
      rerender(el, posts.slice(0, n).map((p) => `
        <a class="post" href="${ROOT}news.html#${esc(p.id)}">
          <div class="post__media">${(ART[p.art] || ART.orbit)()}</div>
          <div class="post__meta"><time datetime="${p.date}">${longDate(p.date)}</time><span class="accent">${esc(I18N.pick(p, "tag"))}</span></div>
          <h3>${esc(I18N.pick(p, "title"))}</h3>
          <p>${esc(I18N.pick(p, "excerpt"))}</p>
        </a>`).join(""));
      stripMotion(el);
    });

    const list = $("[data-news-list]");
    if (list) {
      const openIds = $$("details[open]", list).map((d) => d.id);
      list.innerHTML = posts.map((p) => `
        <details class="article" id="${esc(p.id)}"${openIds.includes(p.id) ? " open" : ""}>
          <summary>
            <span class="article__date"><time datetime="${p.date}">${longDate(p.date)}</time><br><span class="accent">${esc(I18N.pick(p, "tag"))}</span></span>
            <h3 class="article__title">${esc(I18N.pick(p, "title"))}</h3>
            <span class="article__excerpt">${esc(I18N.pick(p, "excerpt"))}</span>
            <span class="article__toggle" aria-hidden="true"><span class="i i-plus"></span></span>
          </summary>
          <div class="article__body"><div>${(I18N.pick(p, "body") || []).map((x) => `<p>${esc(x)}</p>`).join("")}</div></div>
        </details>`).join("");
    }
  }
  function newsDeepLink() {
    const open = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const d = id && document.getElementById(id);
      if (d && d.tagName === "DETAILS") { d.open = true; setTimeout(() => d.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 250); }
    };
    open();
    window.addEventListener("hashchange", open);
  }

  /* ------------------------------------------------------------------
     Equation of the week — changes Monday 00:00 Lethbridge time;
     the dots browse the rest.
  ------------------------------------------------------------------ */
  function weekNumber() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(new Date()).map((x) => [x.type, x.value]));
    const days = Date.UTC(+p.year, +p.month - 1, +p.day) / 864e5;
    return Math.floor((days - 4) / 7); // 1970-01-05 was a Monday
  }
  function equations() {
    const box = $("[data-equation]");
    const list = DATA.equations || [];
    if (!box || !list.length) return;
    const f = $(".equation__formula", box), c = $(".equation__caption", box), nav = $(".equation__nav", box), status = $("[data-eq-status]", box);
    let idx = 0;
    nav.innerHTML = list.map((_, k) => `<button class="equation__dot" type="button" data-eq="${k}"></button>`).join("");
    const dots = $$(".equation__dot", nav);
    const label = () => dots.forEach((d, k) => d.setAttribute("aria-label", t("eq.show", "Show equation {n}").replace("{n}", k + 1)));
    const paint = () => { f.innerHTML = list[idx].html; c.textContent = I18N.pick(list[idx], "caption"); };
    const show = (k, instant) => {
      idx = (k + list.length) % list.length;
      dots.forEach((d, j) => d.setAttribute("aria-current", String(j === idx)));
      if (instant || reduceMotion) { paint(); if (!instant && status) status.textContent = c.textContent; return; }
      f.classList.add("is-swapping"); c.classList.add("is-swapping");
      setTimeout(() => { paint(); f.classList.remove("is-swapping"); c.classList.remove("is-swapping"); if (status) status.textContent = c.textContent; }, 380);
    };
    dots.forEach((d) => d.addEventListener("click", () => show(+d.dataset.eq)));
    label();
    show(((weekNumber() % list.length) + list.length) % list.length, true);
    document.addEventListener("pama:lang", () => { label(); paint(); });
  }

  /* ------------------------------------------------------------------
     Sky: moon phase + local sidereal time for Lethbridge
  ------------------------------------------------------------------ */
  const PHASES = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  function moon() {
    const els = $$("[data-moon]");
    if (!els.length) return;
    const syn = 29.530588853;
    const ref = Date.UTC(2000, 0, 6, 18, 14); // a known new moon
    const age = ((((Date.now() - ref) / 864e5) % syn) + syn) % syn;
    const frac = (1 - Math.cos((2 * Math.PI * age) / syn)) / 2;
    const i = Math.floor((age / syn) * 8 + 0.5) % 8;
    const name = t("sky.phase" + i, PHASES[i]);
    const toNew = Math.max(1, Math.round(syn - age));
    const waxing = age < syn / 2, r = 28, k = Math.cos((2 * Math.PI * age) / syn);
    const d = `M32 4 A${r} ${r} 0 0 ${waxing ? 1 : 0} 32 60 A${(Math.abs(k) * r).toFixed(2)} ${r} 0 0 ${(waxing ? k > 0 : k < 0) ? 0 : 1} 32 4Z`;
    const note = frac < 0.35
      ? t("sky.dark", "Dark skies — a good night for faint galaxies and nebulae.")
      : t("sky.bright", "Bright moonlight. Next new moon in about {n} days.").replace("{n}", toNew);
    const markup = `
      <svg class="sky__moon" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#0d1120" stroke="rgba(255,255,255,.15)"/>
        <path d="${d}" fill="#e6ecf7"/>
      </svg>
      <div>
        <p class="sky__label">${esc(t("sky.label", "Tonight over Lethbridge"))}</p>
        <p class="sky__value">${esc(name)} · ${F.pct.format(Math.round(frac * 100) / 100)} ${esc(t("sky.lit", "illuminated"))}</p>
        <p class="sky__note">${esc(note)}</p>
      </div>`;
    els.forEach((el) => { el.innerHTML = markup; });
  }
  function lst() {
    const el = $("[data-lst]");
    if (!el) return;
    const tick = () => {
      const jd = Date.now() / 864e5 + 2440587.5;
      const T = (jd - 2451545.0) / 36525;
      const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T;
      const hrs = ((((gmst + LON) % 360) + 360) % 360) / 15;
      const h = Math.floor(hrs), m = Math.floor((hrs - h) * 60), s = Math.floor(((hrs - h) * 60 - m) * 60);
      el.textContent = [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
    };
    tick(); setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------
     Page transitions: native cross-document View Transitions where
     supported (see style.css); a short JS fade elsewhere.
  ------------------------------------------------------------------ */
  function transitions() {
    if (reduceMotion || html.classList.contains("vt")) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || a.target === "_blank" || a.hasAttribute("download") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.protocol !== location.protocol) return;
      if (url.pathname === location.pathname) return; // same page (hash links)
      if (!/\.html?$|\/$/.test(url.pathname)) return;
      e.preventDefault();
      document.body.classList.add("is-leaving");
      setTimeout(() => { location.href = url.href; }, 240);
    });
    window.addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("is-leaving"); });
  }
  function toTop() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-to-top]")) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }
  function relang() {
    document.addEventListener("pama:lang", () => {
      [buildFormats, renderEvents, renderNews, moon].forEach(safe);
      reveal();
    });
  }

  /* ------------------------------------------------------------------ */
  function safe(fn) { try { fn(); } catch (err) { console.error("[PAMA] " + (fn.name || "init") + " failed:", err); } }
  document.addEventListener("DOMContentLoaded", () => {
    [
      () => I18N.apply(), initData, buildFormats, starfield, header, menu, art,
      renderEvents, eventsUI, renderNews, newsDeepLink, equations, moon, lst,
      reveal, spotlight, transitions, toTop, relang,
    ].forEach(safe);
    html.classList.add("js-ready");
  });
})();
