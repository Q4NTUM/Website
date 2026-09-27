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
     Starfield — a fixed canvas behind every page. The same seeded, static
     sky everywhere (so nothing jumps between pages) plus a motion layer
     that changes with the page, set by body[data-theme]:
       home / default → drift    rising particles, from the original site
       about          → aurora   curtains of southern-Alberta aurora
       events         → meteors  the occasional shooting star
       team           → network  wandering stars linked into constellations
       resources      → lensing  a spacetime grid bent by drifting masses
       news           → pulsar   radio rings sweeping out from a pulsar
       join           → warp     stars streaming gently outward
  ------------------------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t2 = Math.imul(a ^ (a >>> 15), 1 | a);
      t2 = (t2 + Math.imul(t2 ^ (t2 >>> 7), 61 | t2)) ^ t2;
      return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296;
    };
  }
  function accentRGB() {
    return (getComputedStyle(document.body).getPropertyValue("--accent-rgb") || "158, 220, 255").trim();
  }

  function starfield() {
    const canvas = document.createElement("canvas");
    canvas.className = "starfield";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    const rgb = accentRGB();
    const mode = { about: "aurora", events: "meteors", team: "network", resources: "lensing", news: "pulsar", join: "warp" }[document.body.dataset.theme] || "drift";
    let w = 0, h = 0, dpr = 1, lastW = 0, lastH = 0, twinklers = [], raf = 0, last = 0, lastDraw = 0;
    const R = Math.random;

    // Gentle parallax: the sky shifts a few pixels against the pointer
    const M = 18;
    let ox = 0, oy = 0, tx = 0, ty = 0, px = -1e4, py = -1e4;
    if (finePointer && !reduceMotion) {
      window.addEventListener("pointermove", (e) => {
        px = e.clientX; py = e.clientY;
        tx = (e.clientX / w - 0.5) * -2 * (M - 4);
        ty = (e.clientY / h - 0.5) * -2 * (M - 4);
      }, { passive: true });
    }

    // Soft glow sprites (much cheaper than shadowBlur)
    const makeSprite = (c) => {
      const s = document.createElement("canvas");
      s.width = s.height = 32;
      const g = s.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, `rgba(${c},1)`); gr.addColorStop(0.18, `rgba(${c},.85)`);
      gr.addColorStop(0.45, `rgba(${c},.18)`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
      return s;
    };
    const white = makeSprite("255,255,255"), tint = makeSprite(rgb);
    const glow = (spr, x, y, size, a) => { ctx.globalAlpha = a; ctx.drawImage(spr, x - size / 2, y - size / 2, size, size); };
    const count = (per, max) => Math.round(Math.min(max, (w * h) / per));

    /* ---- Motion layers ---- */
    let parts = [], extra = [], clock = 0;
    const MODES = {
      drift: {
        spawn: (any) => ({ x: R() * w, y: any ? R() * h : h + 12, r: R() * 1.1 + 0.6, v: h / (60 * (15 + R() * 15)), max: R() * 0.45 + 0.35, c: R() < 0.25 }),
        init() { parts = Array.from({ length: count(28000, 44) }, () => this.spawn(true)); },
        step(dt) {
          for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            p.y -= p.v * dt;
            if (p.y < -12) { parts[i] = this.spawn(false); continue; }
            const life = p.y / h;
            glow(p.c ? tint : white, p.x + ox * 1.8, p.y + oy * 1.8, p.r * 7, Math.max(0, Math.min(p.max, Math.min(life, 1 - life) * 4 * p.max)));
          }
        },
      },
      aurora: {
        // Curtains of light: bright lower edge, rays fading upward, slowly folding
        init() {
          const s = document.createElement("canvas"); s.width = 2; s.height = 256;
          const g = s.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
          gr.addColorStop(0, "rgba(120,90,255,0)"); gr.addColorStop(0.35, "rgba(140,100,255,.28)");
          gr.addColorStop(0.62, "rgba(230,110,200,.55)"); gr.addColorStop(0.84, `rgba(${rgb},.95)`);
          gr.addColorStop(0.9, `rgba(${rgb},.8)`); gr.addColorStop(1, `rgba(${rgb},0)`);
          g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
          extra = [s]; clock = R() * 5000;
          parts = [0, 1, 2].map((i) => ({
            base: h * (0.2 + i * 0.12), amp: h * (0.05 + R() * 0.04), len: h * (0.22 + R() * 0.14),
            ph: R() * 10, k1: 0.0018 + R() * 0.001, k2: 0.005 + R() * 0.003, sp: 0.0035 + R() * 0.002, al: 0.26 - i * 0.05,
          }));
        },
        step(dt) {
          clock += dt;
          const spr = extra[0], S = 5;
          ctx.globalCompositeOperation = "lighter";
          for (const r of parts) {
            const t = clock * r.sp;
            for (let x = -S; x < w + S; x += S) {
              const y = r.base + Math.sin(x * r.k1 + t + r.ph) * r.amp + Math.sin(x * r.k2 - t * 1.6) * r.amp * 0.35;
              const env = 0.5 + 0.5 * Math.sin(x * 0.0016 + r.ph + t * 0.35);            // curtains have ends
              const ray = 0.7 + 0.3 * Math.sin(x * 0.03 + t * 2.4 + r.ph) * Math.sin(x * 0.011 - t); // fine rays
              const L = r.len * (0.75 + 0.25 * Math.sin(x * 0.007 + t * 0.8));
              ctx.globalAlpha = r.al * env * env * ray;
              ctx.drawImage(spr, x - 2 + ox * 1.4, y - L + oy * 1.4, S + 4, L);
            }
          }
          ctx.globalCompositeOperation = "source-over";
        },
      },
      meteors: {
        init() { parts = []; clock = 40; MODES.drift.init.call(MODES.drift); extra = parts.slice(0, 14); parts = []; },
        step(dt) {
          for (const p of extra) { p.y -= p.v * dt * 0.6; if (p.y < -12) p.y = h + 12; glow(white, p.x, p.y, p.r * 6, 0.35); }
          clock -= dt;
          if (clock <= 0) {
            clock = 70 + R() * 200;
            const ang = Math.PI * (0.72 + R() * 0.12); // heading down and to the left
            parts.push({ x: w * (0.35 + R() * 0.75), y: -20 + R() * h * 0.35, vx: Math.cos(ang) * (9 + R() * 7), vy: Math.sin(ang) * (9 + R() * 7), len: 90 + R() * 120, life: 1, fade: 0.012 + R() * 0.01 });
          }
          parts = parts.filter((m) => m.life > 0);
          for (const m of parts) {
            m.x += m.vx * dt; m.y += m.vy * dt; m.life -= m.fade * dt;
            const k = m.len / Math.hypot(m.vx, m.vy);
            const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * k, m.y - m.vy * k);
            g.addColorStop(0, `rgba(255,255,255,${0.9 * m.life})`);
            g.addColorStop(0.25, `rgba(${rgb},${0.5 * m.life})`);
            g.addColorStop(1, `rgba(${rgb},0)`);
            ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * k, m.y - m.vy * k); ctx.stroke();
            glow(white, m.x, m.y, 10, m.life);
          }
        },
      },
      network: {
        init() {
          parts = Array.from({ length: count(26000, 60) }, () => {
            const a = R() * Math.PI * 2, v = 0.12 + R() * 0.18;
            return { x: R() * w, y: R() * h, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: R() * 1 + 0.8 };
          });
        },
        step(dt) {
          const D = Math.min(170, Math.max(110, w / 9));
          for (const p of parts) {
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
            if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
          }
          ctx.lineWidth = 1;
          for (let i = 0; i < parts.length; i++) {
            const a = parts[i];
            for (let j = i + 1; j < parts.length; j++) {
              const b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
              if (d > D) continue;
              ctx.globalAlpha = (1 - d / D) * 0.22; ctx.strokeStyle = `rgb(${rgb})`;
              ctx.beginPath(); ctx.moveTo(a.x + ox, a.y + oy); ctx.lineTo(b.x + ox, b.y + oy); ctx.stroke();
            }
            const dp = Math.hypot(a.x - px, a.y - py);
            if (dp < D * 1.3) { // reach out to the pointer
              ctx.globalAlpha = (1 - dp / (D * 1.3)) * 0.35; ctx.strokeStyle = `rgb(${rgb})`;
              ctx.beginPath(); ctx.moveTo(a.x + ox, a.y + oy); ctx.lineTo(px, py); ctx.stroke();
            }
            glow(tint, a.x + ox, a.y + oy, a.r * 6, 0.8);
          }
        },
      },
      lensing: {
        // Spacetime grid bent by drifting masses (and the pointer) — gravitational lensing
        init() {
          clock = R() * 5000;
          parts = [
            { bx: 0.72, by: 0.32, ax: 0.1, ay: 0.08, sx: 0.0011, sy: 0.0017, m: 1, ph: R() * 6 },
            { bx: 0.24, by: 0.72, ax: 0.08, ay: 0.1, sx: 0.0014, sy: 0.0009, m: 0.65, ph: R() * 6 },
          ];
          extra = [{ x: w / 2, y: h / 2, m: 0 }];
        },
        step(dt) {
          clock += dt;
          const G = Math.max(40, Math.min(56, w / 28)), S = 12, R0 = Math.min(w, h) * 0.2, soft = R0 * R0 * 0.35;
          const ms = parts.map((p) => ({ x: w * (p.bx + p.ax * Math.sin(clock * p.sx + p.ph)), y: h * (p.by + p.ay * Math.sin(clock * p.sy + p.ph * 2)), m: p.m }));
          const cur = extra[0], on = px > -1e3;
          cur.x += ((on ? px : cur.x) - cur.x) * 0.08; cur.y += ((on ? py : cur.y) - cur.y) * 0.08;
          cur.m += ((on ? 0.45 : 0) - cur.m) * 0.05;
          ms.push(cur);
          const bend = (x, y) => {
            let dx = 0, dy = 0;
            for (const m of ms) {
              const ex = m.x - x, ey = m.y - y, k = (m.m * R0 * R0 * 0.55) / (ex * ex + ey * ey + soft);
              dx += ex * Math.min(0.62, k); dy += ey * Math.min(0.62, k);
            }
            return [x + dx + ox, y + dy + oy, Math.hypot(dx, dy)];
          };
          const faint = new Path2D(), lit = new Path2D();
          const line = (pts) => {
            let prev = null;
            for (const q of pts) {
              const [x, y, mag] = bend(q[0], q[1]);
              if (prev) { faint.moveTo(prev[0], prev[1]); faint.lineTo(x, y); if (mag > 3) { lit.moveTo(prev[0], prev[1]); lit.lineTo(x, y); } }
              prev = [x, y];
            }
          };
          for (let x = (w % G) / 2; x <= w; x += G) { const pts = []; for (let y = -S; y <= h + S; y += S) pts.push([x, y]); line(pts); }
          for (let y = (h % G) / 2; y <= h; y += G) { const pts = []; for (let x = -S; x <= w + S; x += S) pts.push([x, y]); line(pts); }
          ctx.lineWidth = 1; ctx.strokeStyle = `rgb(${rgb})`;
          ctx.globalAlpha = 0.035; ctx.stroke(faint);
          ctx.globalAlpha = 0.11; ctx.stroke(lit);
          // the lensing galaxies themselves, each with a faint Einstein ring
          for (let i = 0; i < 2; i++) {
            const m = ms[i], x = m.x + ox, y = m.y + oy;
            ctx.globalAlpha = 0.16 * m.m; ctx.beginPath(); ctx.arc(x, y, R0 * 0.42 * m.m, 0, 6.283); ctx.stroke();
            glow(tint, x, y, 46 * m.m, 0.55); glow(white, x, y, 9, 0.9);
          }
        },
      },
      pulsar: {
        init() { parts = []; clock = 0; extra = [{ x: w * (w < 700 ? 0.8 : 0.84), y: h * 0.3 }]; },
        step(dt) {
          const p = extra[0], x = p.x + ox, y = p.y + oy, maxR = Math.hypot(w, h) * 0.75;
          clock -= dt;
          if (clock <= 0) { clock = 78; parts.push({ r: 4 }); }
          parts = parts.filter((ring) => ring.r < maxR);
          ctx.lineWidth = 1;
          for (const ring of parts) {
            ring.r += 1.6 * dt;
            ctx.globalAlpha = 0.28 * (1 - ring.r / maxR); ctx.strokeStyle = `rgb(${rgb})`;
            ctx.beginPath(); ctx.arc(x, y, ring.r, 0, 6.283); ctx.stroke();
          }
          // two lighthouse beams, slowly sweeping
          const a = (performance.now() / 1000) * 0.35;
          for (const s of [0, Math.PI]) {
            const g = ctx.createLinearGradient(x, y, x + Math.cos(a + s) * maxR, y + Math.sin(a + s) * maxR);
            g.addColorStop(0, `rgba(${rgb},.22)`); g.addColorStop(1, `rgba(${rgb},0)`);
            ctx.globalAlpha = 1; ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(x, y);
            ctx.arc(x, y, maxR, a + s - 0.035, a + s + 0.035); ctx.closePath(); ctx.fill();
          }
          const beat = 0.6 + 0.4 * Math.max(0, 1 - (78 - clock) / 12);
          glow(tint, x, y, 42 * beat, 0.9); glow(white, x, y, 12, 1);
        },
      },
      warp: {
        spawn: () => ({ x: (R() - 0.5) * 2, y: (R() - 0.5) * 2, z: 0.3 + R() * 0.7, pz: 0 }),
        init() { parts = Array.from({ length: count(9000, 160) }, () => this.spawn()); parts.forEach((p) => { p.pz = p.z; }); },
        step(dt) {
          const cx = w / 2 + ox * 2, cy = h * 0.42 + oy * 2, f = Math.max(w, h) * 0.5;
          ctx.lineCap = "round";
          for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            p.pz = p.z; p.z -= 0.0018 * dt;
            if (p.z <= 0.05) { parts[i] = this.spawn(); parts[i].z = parts[i].pz = 1; continue; }
            const x = cx + (p.x / p.z) * f * 0.5, y = cy + (p.y / p.z) * f * 0.5;
            const x0 = cx + (p.x / p.pz) * f * 0.5, y0 = cy + (p.y / p.pz) * f * 0.5;
            if (x < -10 || x > w + 10 || y < -10 || y > h + 10) { parts[i] = this.spawn(); parts[i].z = parts[i].pz = 1; continue; }
            const near = 1 - p.z;
            ctx.globalAlpha = Math.min(0.85, near * 0.9); ctx.strokeStyle = i % 3 ? "rgb(235,240,255)" : `rgb(${rgb})`;
            ctx.lineWidth = 0.6 + near * 1.4;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
          }
        },
      },
    };
    const layerFx = MODES[mode];

    function buildSky() {
      // Seeded: identical star positions on every page load
      const rnd = mulberry32(0x9a3a);
      const lw = w + 2 * M, lh = h + 2 * M;
      layer.width = lw * dpr; layer.height = lh * dpr;
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((lw * lh) / 9000);
      twinklers = [];
      for (let i = 0; i < n; i++) {
        const s = { x: rnd() * lw, y: rnd() * lh, r: rnd() * 0.9 + 0.2, a: rnd() * 0.5 + 0.15, t: rnd() * 6.283, sp: rnd() * 0.012 + 0.003 };
        if (i % Math.max(1, Math.round(n / 30)) === 0) { twinklers.push(s); continue; }
        lctx.globalAlpha = s.a;
        lctx.fillStyle = i % 9 === 0 ? `rgb(${rgb})` : "#dfe8ff"; // a few stars pick up the page colour
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
        layerFx.init();
        lastW = w; lastH = h;
      }
      frame(0);
    }

    function frame(dt) {
      ctx.clearRect(0, 0, w, h);
      ox += (tx - ox) * 0.06; oy += (ty - oy) * 0.06;
      const bx = ox - M, by = oy - M;
      ctx.globalAlpha = 1;
      ctx.drawImage(layer, bx, by, w + 2 * M, h + 2 * M);
      ctx.fillStyle = "#dfe8ff";
      for (const s of twinklers) {
        s.t += s.sp * dt;
        ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(s.t));
        ctx.beginPath(); ctx.arc(s.x + bx, s.y + by, s.r + 0.15, 0, 6.283); ctx.fill();
      }
      layerFx.step(dt);
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
      if (!open) { const p = $(".menu__panel", nav); if (p) p.classList.remove("has-hl"); }
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
    // One highlight glides between rows; it appears in place, then slides
    const panel = $(".menu__panel", nav), hl = $(".menu__hl", nav);
    const glide = (a) => {
      if (!hl) return;
      hl.style.setProperty("--hl-y", a.offsetTop + "px");
      hl.style.setProperty("--hl-h", a.offsetHeight + "px");
      if (!panel.classList.contains("has-hl")) { void hl.offsetWidth; panel.classList.add("has-hl"); }
    };
    items.forEach((a) => { a.addEventListener("pointerenter", () => glide(a)); a.addEventListener("focus", () => glide(a)); });
    if (panel) panel.addEventListener("pointerleave", () => { if (!panel.contains(document.activeElement)) panel.classList.remove("has-hl"); });
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
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
        if (en.target.classList.contains("eyebrow")) {
          const txt = en.target.querySelector("span:not(.idx)") || en.target;
          if (!txt.children.length) setTimeout(() => scramble(txt, 700), +(en.target.style.getPropertyValue("--d") || "0").replace("ms", "") + 150);
        }
      });
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
        <defs><radialGradient id="g-o" cx="50%" cy="50%" r="50%"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".35"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></radialGradient></defs>
        <circle cx="160" cy="100" r="60" fill="url(#g-o)"/>
        <g fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".8">
          <ellipse cx="160" cy="100" rx="120" ry="34" transform="rotate(-14 160 100)"/>
          <ellipse cx="160" cy="100" rx="80" ry="24" transform="rotate(-14 160 100)"/>
          <ellipse cx="160" cy="100" rx="150" ry="52" transform="rotate(-14 160 100)" stroke-dasharray="2 5"/>
        </g>
        <circle cx="160" cy="100" r="7" fill="#eceef4"/>
        <g transform="rotate(-14 160 100)"><circle r="3" style="fill:var(--accent)"><animateMotion dur="16s" repeatCount="indefinite" path="M280 100a120 34 0 1 1-240 0a120 34 0 1 1 240 0"/></circle></g>
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
        <path d="${d1}" fill="none" style="stroke:var(--accent)" stroke-width="1.2"/></svg>`;
    },
    lattice() {
      let g = "";
      for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) {
        const x = 20 + i * 36 + (j % 2) * 18, y = 18 + j * 34, d = Math.hypot(x - 160, y - 100);
        g += `<circle cx="${x}" cy="${y}" r="${(2.6 - d / 110).toFixed(2)}" style="fill:${d < 60 ? "var(--accent)" : "rgba(255,255,255,.4)"}"/>`;
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
        <path d="${d}" fill="none" style="stroke:var(--accent)" stroke-width="1"/>
        <g fill="none" stroke="rgba(255,255,255,.1)"><circle cx="160" cy="100" r="30"/><circle cx="160" cy="100" r="70"/><circle cx="160" cy="100" r="110"/></g></svg>`;
    },
    constellation() {
      const pts = [[40, 140], [86, 96], [128, 118], [170, 62], [214, 84], [256, 40], [282, 128], [214, 150]];
      const lines = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7], [7, 2]];
      return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g style="stroke:rgba(var(--accent-rgb),.4)" stroke-width=".8">${lines.map(([a, b]) => `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}"/>`).join("")}</g>
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
        <circle cx="220" cy="100" r="7" fill="#04060c" style="stroke:var(--accent)"/><path d="M216 100h8" style="stroke:var(--accent)"/></svg>`;
    },
    ellipses: () => `<svg viewBox="0 0 320 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".8">
        <ellipse cx="160" cy="100" rx="130" ry="40" opacity=".4"/><ellipse cx="160" cy="100" rx="90" ry="28" opacity=".7"/><ellipse cx="160" cy="100" rx="48" ry="15"/></g>
        <circle cx="160" cy="100" r="9" fill="currentColor"/><circle r="3.5" style="fill:var(--accent)"><animateMotion dur="12s" repeatCount="indefinite" path="M250 100a90 28 0 1 1-180 0a90 28 0 1 1 180 0"/></circle></svg>`,
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
    const paint = () => { f.innerHTML = `<span class="equation__math">${list[idx].html}</span>`; c.textContent = I18N.pick(list[idx], "caption"); };
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
     Text decode — characters resolve left to right from symbol noise
  ------------------------------------------------------------------ */
  const NOISE = "ΦΣΩΔπ∂∇λμ∫≈01<>/+*#";
  function scramble(el, duration = 900) {
    if (!el || reduceMotion) return;
    if (el._scrambling) cancelAnimationFrame(el._scrambling);
    const target = el.textContent;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      const solved = Math.floor(target.length * k);
      let out = target.slice(0, solved);
      for (let i = solved; i < target.length; i++) {
        const ch = target[i];
        out += ch === " " || ch === " " ? ch : NOISE[(Math.random() * NOISE.length) | 0];
      }
      el.textContent = out;
      if (k < 1) el._scrambling = requestAnimationFrame(step);
      else { el.textContent = target; el._scrambling = 0; }
    };
    el._scrambling = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------
     Landing intro: only the logo, until the visitor scrolls, taps,
     clicks or presses a key. The first gesture reveals the page instead
     of scrolling it.
  ------------------------------------------------------------------ */
  function landing() {
    const title = $("[data-scramble]");
    if (!html.classList.contains("is-intro")) { if (title) setTimeout(() => scramble(title, 1100), 150); return; }
    if (window.scrollY > 10) { html.classList.remove("is-intro"); return; }
    const SCROLL_KEYS = [" ", "PageDown", "ArrowDown", "End", "Enter"];
    let done = false, lockUntil = 0;
    const block = (e) => { if (performance.now() < lockUntil) e.preventDefault(); };
    function end(e) {
      if (done) return;
      done = true;
      if (e && e.cancelable && (e.type === "wheel" || e.type === "touchmove" || (e.type === "keydown" && SCROLL_KEYS.includes(e.key)))) e.preventDefault();
      lockUntil = performance.now() + 800; // swallow the rest of that wheel/swipe gesture
      html.classList.remove("is-intro");
      try { sessionStorage.setItem("pama-intro", "1"); } catch (err) { /* ignore */ }
      if (title) setTimeout(() => scramble(title, 1200), 120);
      ["wheel", "keydown", "pointerdown", "focusin"].forEach((t2) => window.removeEventListener(t2, end, true));
      window.removeEventListener("touchmove", end, { capture: true });
      window.removeEventListener("scroll", end);
      setTimeout(() => { window.removeEventListener("wheel", block); window.removeEventListener("touchmove", block); }, 900);
    }
    window.addEventListener("wheel", end, { capture: true, passive: false });
    window.addEventListener("touchmove", end, { capture: true, passive: false });
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    ["keydown", "pointerdown", "focusin"].forEach((t2) => window.addEventListener(t2, end, true));
    window.addEventListener("scroll", end);
  }

  /* Keyword ticker: duplicate the list once so the loop is seamless */
  function ticker() {
    const list = $("[data-ticker]");
    if (!list) return;
    const track = list.parentElement;
    $$(".ticker__list[data-clone]", track).forEach((n) => n.remove());
    const clone = list.cloneNode(true);
    clone.removeAttribute("data-i18n"); clone.removeAttribute("data-ticker");
    clone.setAttribute("data-clone", "");
    track.appendChild(clone);
  }

  /* Events hero: live countdown to the next event */
  let cdTimer;
  function countdown() {
    const box = $("[data-countdown]");
    if (!box) return;
    const ev = upcoming[0];
    if (!ev) { box.hidden = true; return; }
    box.hidden = false;
    box.href = "#" + evId(ev);
    $("[data-cd-title]", box).textContent = I18N.pick(ev, "title");
    $("[data-cd-when]", box).textContent = `${dayMonth(ev.s)} · ${clock(ev.s)} · ${I18N.pick(ev, "location")}`;
    const out = { d: $('[data-cd="d"]', box), h: $('[data-cd="h"]', box), m: $('[data-cd="m"]', box), s: $('[data-cd="s"]', box) };
    const label = $("[data-cd-label]", box);
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const now = Date.now();
      const live = now >= ev.s && now < ev.e;
      label.textContent = live ? t("events.live", "Happening now") : t("events.next", "Next up");
      const diff = Math.max(0, ev.s - now);
      out.d.textContent = pad(Math.floor(diff / 864e5));
      out.h.textContent = pad(Math.floor(diff / 36e5) % 24);
      out.m.textContent = pad(Math.floor(diff / 6e4) % 60);
      out.s.textContent = pad(Math.floor(diff / 1e3) % 60);
    };
    clearInterval(cdTimer);
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* Team hero: a mission patch. Each crew member is a station on the ring;
     it is built from the cards on the page, so it never falls out of date */
  function patch() {
    const root = $("[data-patch]");
    if (!root) return;
    const svg = $("svg", root), tip = $("[data-const-tip]", root);
    const people = $$("[data-person]");
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
    const top = t("team.patch.top", "Physics · Astronomy · Mathematics"), bottom = t("team.patch.bottom", "University of Lethbridge");
    svg.innerHTML = `
      <defs>
        <radialGradient id="pface" cx="50%" cy="42%" r="60%"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".16"/><stop offset=".55" stop-color="#0b0e1a"/><stop offset="1" stop-color="#070a13"/></radialGradient>
        <radialGradient id="pcore"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".35"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></radialGradient>
        <path id="ptop" d="M-172 0A172 172 0 0 1 172 0"/><path id="pbot" d="M-172 0A172 172 0 0 0 172 0"/>
      </defs>
      <circle r="197" fill="#070a13" stroke="rgba(255,255,255,.3)" stroke-width="1.2"/>
      <circle r="190" fill="none" class="patch__stitch"/>
      <text class="patch__text" dominant-baseline="middle"><textPath href="#ptop" startOffset="50%" text-anchor="middle">${esc(top)}</textPath></text>
      <text class="patch__text" dominant-baseline="middle"><textPath href="#pbot" startOffset="50%" text-anchor="middle">${esc(bottom)}</textPath></text>
      <path class="patch__star" d="M0-6L1.4-1.4 6 0 1.4 1.4 0 6-1.4 1.4-6 0-1.4-1.4Z" transform="translate(-172 0)"/><path class="patch__star" d="M0-6L1.4-1.4 6 0 1.4 1.4 0 6-1.4 1.4-6 0-1.4-1.4Z" transform="translate(172 0)"/>
      <circle r="156" fill="url(#pface)" stroke="rgba(255,255,255,.24)"/>
      <circle r="126" fill="none" class="patch__track"/>
      <circle r="64" fill="url(#pcore)"/>
      <g transform="rotate(-24)"><ellipse rx="92" ry="30" class="patch__orbit"/><circle r="3" class="patch__sat"><animateMotion dur="16s" repeatCount="indefinite" path="M92 0A92 30 0 1 1-92 0A92 30 0 1 1 92 0"/></circle></g>
      <g transform="rotate(30)"><ellipse rx="84" ry="24" class="patch__orbit patch__orbit--2"/><circle r="2" fill="#f0f2f7"><animateMotion dur="23s" begin="-8s" repeatCount="indefinite" path="M-84 0A84 24 0 1 1 84 0A84 24 0 1 1-84 0"/></circle></g>
      <image href="${ROOT}assets/img/pama-logo-white-sm.png" x="-42" y="-11" width="84" height="20.4"/>
      <text class="patch__est" y="26" text-anchor="middle">EST · 2026</text>`;
    stripMotion(svg);
    const info = (el) => ({
      name: ($(".person__name", el) || $(".person__name-sm", el)).textContent.trim(),
      role: ($(".person__role", el) || $("small", el)).textContent.trim(),
    });
    const light = (el, on) => el.classList.toggle("is-lit", on);
    const n = people.length;
    let active = null;
    people.forEach((el, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2, x = Math.cos(a) * 126, y = Math.sin(a) * 126;
      const g = mk("g", { class: "patch__m" + (el.hasAttribute("data-grad") ? " patch__m--grad" : ""), tabindex: "0", role: "button", transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, svg);
      g.style.setProperty("--i", i);
      const s = mk("g", { class: "patch__node" }, g);
      mk("circle", { r: 17 }, s);
      mk("text", { "text-anchor": "middle", "dominant-baseline": "central" }, s).textContent = $(".person__avatar", el).textContent.trim();
      const p = info(el);
      g.setAttribute("aria-label", `${p.name} — ${p.role}`);
      const show = () => {
        const q = info(el);
        tip.innerHTML = `<strong>${esc(q.name)}</strong><span>${esc(q.role)}</span>`;
        if (active && active !== g) active.classList.remove("is-active");
        active = g; g.classList.add("is-active"); light(el, true);
      };
      const hide = () => { g.classList.remove("is-active"); light(el, false); };
      const go = () => {
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        light(el, true); setTimeout(() => light(el, false), 1800);
      };
      g.addEventListener("pointerenter", show);
      g.addEventListener("pointerleave", hide);
      g.addEventListener("focus", show);
      g.addEventListener("blur", hide);
      g.addEventListener("click", (e) => { if (e.pointerType === "touch" && active !== g) { show(); return; } go(); });
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }

  /* News hero: an oscilloscope trace */
  function scope() {
    const box = $("[data-scope]");
    if (!box) return;
    const canvas = $("canvas", box), ctx = canvas.getContext("2d");
    const latest = $("[data-scope-latest]", box), count = $("[data-scope-count]", box);
    const readout = () => {
      if (posts[0]) latest.textContent = longDate(posts[0].date);
      count.textContent = String(posts.length).padStart(2, "0");
    };
    readout();
    document.addEventListener("pama:lang", readout);
    let w, h, raf = 0, visible = true, lastDraw = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.clientWidth; h = box.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);
      // graticule
      ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
      for (let i = 1; i < 10; i++) { const x = Math.round((w / 10) * i) + 0.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let j = 1; j < 6; j++) { const y = Math.round((h / 6) * j) + 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = "rgba(255,255,255,.14)";
      ctx.beginPath(); ctx.moveTo(0, h * 0.45 + 0.5); ctx.lineTo(w, h * 0.45 + 0.5); ctx.stroke();
      // trace: a carrier with a travelling pulse
      const tt = time / 1000, mid = h * 0.45, amp = h * 0.24;
      const trace = (alpha, width, phase) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const u = x / w;
          const env = Math.exp(-Math.pow(((u - ((tt * 0.12 + phase) % 1.4) + 0.2) * 6), 2));
          const y = mid + Math.sin(u * 26 - tt * 2.2) * amp * (0.18 + env * 0.82) + Math.sin(u * 7 + tt) * amp * 0.08;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = `rgba(${accentRGB()},${alpha})`; ctx.lineWidth = width; ctx.stroke();
      };
      trace(0.15, 5, 0);
      trace(0.95, 1.4, 0);
    };
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (!visible || now - lastDraw < 32) return;
      lastDraw = now; draw(now);
    };
    size(); draw(2600);
    window.addEventListener("resize", () => { size(); draw(performance.now()); });
    if (reduceMotion) return;
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(box);
    raf = requestAnimationFrame(loop);
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
      [buildFormats, renderEvents, renderNews, moon, ticker, countdown, patch].forEach(safe);
      reveal();
    });
  }

  /* ------------------------------------------------------------------ */
  function safe(fn) { try { fn(); } catch (err) { console.error("[PAMA] " + (fn.name || "init") + " failed:", err); } }
  document.addEventListener("DOMContentLoaded", () => {
    [
      () => I18N.apply(), initData, buildFormats, starfield, header, menu, art,
      renderEvents, eventsUI, renderNews, newsDeepLink, equations, moon, lst,
      landing, ticker, countdown, patch, scope,
      reveal, spotlight, transitions, toTop, relang,
    ].forEach(safe);
    html.classList.add("js-ready");
  });
})();
