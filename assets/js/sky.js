/* ==========================================================================
   Tonight over Lethbridge — a live night almanac for the Events page.

   Everything except the ISS is computed in the browser from low-precision
   orbital formulae (Paul Schlyter's method): good to about a degree and a
   minute or two, which is plenty for "when is it dark, what's up".
   The ISS uses the current orbital elements from CelesTrak and the SGP4
   model (satellite.js, loaded only when this page needs it).
   ========================================================================== */
(function () {
  "use strict";

  const root = document.querySelector("[data-tonight]");
  if (!root) return;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TZ = "America/Edmonton", LAT = 49.68, LON = -112.86;
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;
  const norm = (x) => ((x % 360) + 360) % 360;
  const jd = (d) => d.getTime() / 864e5 + 2440587.5;
  const STEP = 5 * 60e3;          // chart resolution: 5 minutes
  const HOURS = 17;               // chart spans 16:00 → 09:00

  /* ---- Time zone helpers (no library; DST handled by Intl) ---- */
  const partsFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  function parts(d) {
    const o = {};
    partsFmt.formatToParts(d).forEach((p) => { if (p.type !== "literal") o[p.type] = +p.value; });
    return o;
  }
  const offsetMin = (d) => { const p = parts(d); return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - d.getTime()) / 6e4); };
  function localDate(y, m, day, h) {
    let g = Date.UTC(y, m - 1, day, h);
    g -= offsetMin(new Date(g)) * 6e4;
    return new Date(Date.UTC(y, m - 1, day, h) - offsetMin(new Date(g)) * 6e4);
  }

  /* ---- Positions ---- */
  function lst(d) { return norm(280.46061837 + 360.98564736629 * (jd(d) - 2451545.0) + LON); }
  function horizon(ra, dec, d) {
    const H = (lst(d) - ra) * RAD, p = LAT * RAD, q = dec * RAD;
    const alt = Math.asin(Math.sin(p) * Math.sin(q) + Math.cos(p) * Math.cos(q) * Math.cos(H));
    const az = Math.atan2(-Math.sin(H) * Math.cos(q), Math.cos(p) * Math.sin(q) - Math.sin(p) * Math.cos(q) * Math.cos(H));
    return { alt: alt * DEG, az: norm(az * DEG) };
  }
  const obliq = (d) => (23.4393 - 3.563e-7 * d) * RAD;
  function toEq(x, y, z, d) {
    const o = obliq(d), ye = y * Math.cos(o) - z * Math.sin(o), ze = y * Math.sin(o) + z * Math.cos(o);
    return { ra: norm(Math.atan2(ye, x) * DEG), dec: Math.atan2(ze, Math.hypot(x, ye)) * DEG };
  }
  function kepler(M, e) {
    let E = M + DEG * e * Math.sin(M * RAD) * (1 + e * Math.cos(M * RAD));
    for (let i = 0; i < 6; i++) E -= (E - DEG * e * Math.sin(E * RAD) - M) / (1 - e * Math.cos(E * RAD));
    return E;
  }
  function sunEcl(d) {
    const w = 282.9404 + 4.70935e-5 * d, e = 0.016709 - 1.151e-9 * d, M = norm(356.047 + 0.9856002585 * d);
    const E = kepler(M, e), xv = Math.cos(E * RAD) - e, yv = Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    const r = Math.hypot(xv, yv), lon = norm(Math.atan2(yv, xv) * DEG + w);
    return { lon, r, M, w, x: r * Math.cos(lon * RAD), y: r * Math.sin(lon * RAD) };
  }
  function sun(date) { const d = jd(date) - 2451543.5, s = sunEcl(d); return toEq(s.x, s.y, 0, d); }

  function moon(date) {
    const d = jd(date) - 2451543.5;
    const N = norm(125.1228 - 0.0529538083 * d), i = 5.1454, w = norm(318.0634 + 0.1643573223 * d), a = 60.2666, e = 0.0549;
    const M = norm(115.3654 + 13.0649929509 * d), E = kepler(M, e);
    const xv = a * (Math.cos(E * RAD) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    let r = Math.hypot(xv, yv); const v = Math.atan2(yv, xv) * DEG;
    const x = r * (Math.cos(N * RAD) * Math.cos((v + w) * RAD) - Math.sin(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
    const y = r * (Math.sin(N * RAD) * Math.cos((v + w) * RAD) + Math.cos(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
    const z = r * Math.sin((v + w) * RAD) * Math.sin(i * RAD);
    let lon = Math.atan2(y, x) * DEG, lat = Math.atan2(z, Math.hypot(x, y)) * DEG;
    // The largest perturbations (evection, variation, yearly equation …)
    const s = sunEcl(d), Ms = s.M, Ls = norm(Ms + s.w), Lm = norm(M + w + N), D = Lm - Ls, F = Lm - N, sn = (x) => Math.sin(x * RAD);
    lon += -1.274 * sn(M - 2 * D) + 0.658 * sn(2 * D) - 0.186 * sn(Ms) - 0.059 * sn(2 * M - 2 * D) - 0.057 * sn(M - 2 * D + Ms)
      + 0.053 * sn(M + 2 * D) + 0.046 * sn(2 * D - Ms) + 0.041 * sn(M - Ms) - 0.035 * sn(D) - 0.031 * sn(M + Ms) - 0.015 * sn(2 * F - 2 * D) + 0.011 * sn(M - 4 * D);
    lat += -0.173 * sn(F - 2 * D) - 0.055 * sn(M - F - 2 * D) - 0.046 * sn(M + F - 2 * D) + 0.033 * sn(F + 2 * D) + 0.017 * sn(2 * M + F);
    r += -0.58 * Math.cos((M - 2 * D) * RAD) - 0.46 * Math.cos(2 * D * RAD);
    const cx = Math.cos(lat * RAD) * Math.cos(lon * RAD), cy = Math.cos(lat * RAD) * Math.sin(lon * RAD), cz = Math.sin(lat * RAD);
    const eq = toEq(cx, cy, cz, d);
    const elong = Math.acos(Math.cos((lon - s.lon) * RAD) * Math.cos(lat * RAD)) * DEG;
    return { ...eq, r, illum: (1 - Math.cos(elong * RAD)) / 2, age: (norm(lon - s.lon) / 360) * 29.530588853 };
  }
  function moonHorizon(date) {
    const m = moon(date), h = horizon(m.ra, m.dec, date);
    h.alt -= DEG * Math.asin(Math.cos(h.alt * RAD) / m.r); // topocentric parallax (about a degree)
    return h;
  }

  const PLANETS = [
    { id: "venus", el: (d) => [76.6799 + 2.4659e-5 * d, 3.3946 + 2.75e-8 * d, 54.891 + 1.38374e-5 * d, 0.72333, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d], sunLimit: -4 },
    { id: "jupiter", el: (d) => [100.4542 + 2.76854e-5 * d, 1.303 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.895 + 0.0830853001 * d], sunLimit: -6 },
    { id: "mars", el: (d) => [49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d], sunLimit: -8 },
    { id: "saturn", el: (d) => [113.6634 + 2.3898e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.967 + 0.0334442282 * d], sunLimit: -8 },
    { id: "mercury", el: (d) => [48.3313 + 3.24587e-5 * d, 7.0047 + 5e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d], sunLimit: -4 },
  ];
  function planet(p, date) {
    const d = jd(date) - 2451543.5, [N, i, w, a, e, M0] = p.el(d), M = norm(M0), E = kepler(M, e);
    const xv = a * (Math.cos(E * RAD) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    const r = Math.hypot(xv, yv), u = (Math.atan2(yv, xv) * DEG + w) * RAD;
    const xh = r * (Math.cos(N * RAD) * Math.cos(u) - Math.sin(N * RAD) * Math.sin(u) * Math.cos(i * RAD));
    const yh = r * (Math.sin(N * RAD) * Math.cos(u) + Math.cos(N * RAD) * Math.sin(u) * Math.cos(i * RAD));
    const zh = r * Math.sin(u) * Math.sin(i * RAD);
    const s = sunEcl(d);
    const eq = toEq(xh + s.x, yh + s.y, zh, d);
    return horizon(eq.ra, eq.dec, date);
  }

  /* ---- Formatting ---- */
  const NBSP = " ";
  function clock(d) {
    return new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(d).replace(" ", NBSP);
  }
  const hourLabel = (d) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric" }).format(d).replace(" ", "").toLowerCase();
  const weekday = (d) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(d);
  const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const compass = (az) => COMPASS[Math.round(az / 22.5) % 16];
  const PNAME = { venus: "Venus", jupiter: "Jupiter", mars: "Mars", saturn: "Saturn", mercury: "Mercury" };
  const pname = (id) => PNAME[id];
  const PHASES = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];

  /* ---- The night ---- */
  function computeNight(now) {
    const p = parts(now);
    let base = new Date(Date.UTC(p.year, p.month - 1, p.day));
    if (p.hour < 6) base = new Date(base.getTime() - 864e5); // small hours: still last night
    const start = localDate(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), 16);
    const n = (HOURS * 60 * 60e3) / STEP;
    const times = [], sunAlt = [], moonAlt = [], pl = PLANETS.map(() => []);
    for (let k = 0; k <= n; k++) {
      const d = new Date(start.getTime() + k * STEP);
      times.push(d);
      const s = sun(d); sunAlt.push(horizon(s.ra, s.dec, d).alt);
      moonAlt.push(moonHorizon(d).alt);
      PLANETS.forEach((q, j) => pl[j].push(planet(q, d)));
    }
    // Interpolated crossing of a threshold (dir +1 rising, -1 setting)
    const cross = (arr, level, dir) => {
      for (let k = 1; k < arr.length; k++) {
        const a = arr[k - 1] - level, b = arr[k] - level;
        if ((dir < 0 && a > 0 && b <= 0) || (dir > 0 && a < 0 && b >= 0)) return new Date(times[k - 1].getTime() + (a / (a - b)) * STEP);
      }
      return null;
    };
    const planets = PLANETS.map((q, j) => {
      let best = null, first = null, last = null;
      pl[j].forEach((h, k) => {
        if (sunAlt[k] < q.sunLimit && h.alt > 8) {
          if (!first) first = times[k];
          last = times[k];
          if (!best || h.alt > best.alt) best = { alt: h.alt, az: h.az, time: times[k] };
        }
      });
      return { id: q.id, best, first, last, alts: pl[j].map((h) => h.alt) };
    });
    const mid = moon(new Date(start.getTime() + 6 * 36e5));
    return {
      start, end: new Date(start.getTime() + HOURS * 36e5), times, sunAlt, moonAlt, planets,
      sunset: cross(sunAlt, -0.833, -1), dusk: cross(sunAlt, -18, -1), dawn: cross(sunAlt, -18, 1), sunrise: cross(sunAlt, -0.833, 1),
      moonrise: cross(moonAlt, 0, 1), moonset: cross(moonAlt, 0, -1), moon: mid,
    };
  }

  /* ---- ISS: next visible pass over the next three days ---- */
  let issState = { status: "loading" };
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (window.satellite) return res();
      const s = Object.assign(document.createElement("script"), { src, async: true, crossOrigin: "anonymous" });
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  async function issPass() {
    const KEY = "pama-iss-tle";
    let tle = null;
    try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); if (c && Date.now() - c.t < 6 * 36e5) tle = c.v; } catch (e) { /* storage blocked */ }
    if (!tle) {
      const r = await fetch("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE");
      if (!r.ok) throw new Error("TLE " + r.status);
      const lines = (await r.text()).trim().split(/\r?\n/).map((l) => l.trim());
      tle = [lines[lines.length - 2], lines[lines.length - 1]];
      if (!/^1 /.test(tle[0]) || !/^2 /.test(tle[1])) throw new Error("TLE format");
      try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v: tle })); } catch (e) { /* ignore */ }
    }
    await loadScript("https://cdn.jsdelivr.net/npm/satellite.js@5.0.0/dist/satellite.min.js");
    const S = window.satellite, rec = S.twoline2satrec(tle[0], tle[1]);
    const obs = { longitude: LON * RAD, latitude: LAT * RAD, height: 0.9 };
    const now = Date.now(), end = now + 3 * 864e5, dt = 20e3;
    let pass = null, best = null;
    for (let ms = now; ms < end; ms += dt) {
      const d = new Date(ms), pv = S.propagate(rec, d);
      if (!pv || !pv.position) continue;
      const look = S.ecfToLookAngles(obs, S.eciToEcf(pv.position, S.gstime(d)));
      const el = look.elevation * DEG, az = norm(look.azimuth * DEG);
      let visible = false;
      if (el > 10) {
        const so = sun(d), sa = horizon(so.ra, so.dec, d).alt;
        if (sa < -6) {
          // Is the station itself still in sunlight? (cylindrical Earth shadow)
          const r = pv.position, sx = Math.cos(so.dec * RAD) * Math.cos(so.ra * RAD), sy = Math.cos(so.dec * RAD) * Math.sin(so.ra * RAD), sz = Math.sin(so.dec * RAD);
          const dot = r.x * sx + r.y * sy + r.z * sz;
          visible = dot > 0 || Math.hypot(r.x - dot * sx, r.y - dot * sy, r.z - dot * sz) > 6371;
        }
      }
      if (visible) {
        if (!pass) pass = { start: d, end: d, azStart: az, azEnd: az, max: el };
        pass.end = d; pass.azEnd = az; if (el > pass.max) pass.max = el;
      } else if (pass) { best = pass; break; }
    }
    return best || pass;
  }

  /* ---- Render ---- */
  let night = null;
  function moonIcon(age) {
    const syn = 29.530588853, waxing = age < syn / 2, r = 28, k = Math.cos((2 * Math.PI * age) / syn);
    const d = `M32 4 A${r} ${r} 0 0 ${waxing ? 1 : 0} 32 60 A${(Math.abs(k) * r).toFixed(2)} ${r} 0 0 ${(waxing ? k > 0 : k < 0) ? 0 : 1} 32 4Z`;
    return `<svg class="alm__moon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="#0d1120" stroke="rgba(255,255,255,.18)"/><path d="${d}" fill="#e6ecf7"/></svg>`;
  }
  const pct = (d) => ((d - night.start) / (night.end - night.start)) * 100;
  function skyGradient() {
    const col = (a) => a > 6 ? "#3d5a8c" : a > 0 ? "#344d7a" : a > -6 ? "#26375c" : a > -12 ? "#18223d" : a > -18 ? "#0f1629" : "#070a14";
    const stops = [];
    for (let k = 0; k < night.times.length; k += 3) stops.push(`${col(night.sunAlt[k])} ${((k / (night.times.length - 1)) * 100).toFixed(2)}%`);
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }
  // One continuous gradient per row: brightness = altitude × how dark the sky is
  function bars(alts, { color = "var(--accent-rgb)", darkOnly = true } = {}) {
    const n = alts.length - 1;
    const stops = alts.map((a, k) => {
      const dark = night.sunAlt[k] < -12 ? 1 : night.sunAlt[k] < -4 ? 0.55 : darkOnly ? 0.14 : 0.4;
      const o = a <= 0 ? 0 : Math.min(1, 0.25 + a / 40) * dark;
      return `rgba(${color}, ${o.toFixed(2)}) ${((k / n) * 100).toFixed(2)}%`;
    });
    return `<div class="alm-bar" style="background:linear-gradient(90deg, ${stops.join(", ")})"></div>`;
  }
  function marker(d, label) {
    if (!d) return "";
    return `<span class="alm-mark" style="left:${pct(d).toFixed(2)}%"><span>${esc(label)}</span></span>`;
  }

  function render() {
    const now = new Date();
    if (!night || now > night.end || now < night.start - 12 * 36e5) night = computeNight(now);
    const N = night, m = N.moon, phaseIdx = Math.floor((m.age / 29.530588853) * 8 + 0.5) % 8;
    const visible = N.planets.filter((p) => p.best).sort((a, b) => b.best.alt - a.best.alt);
    const hidden = N.planets.filter((p) => !p.best);

    // Moon rise/set line
    const moonUpAll = N.moonAlt.every((a) => a > 0), moonDownAll = N.moonAlt.every((a) => a <= 0);
    const moonSub = moonUpAll ? "Up all night" : moonDownAll ? "Below the horizon all night"
      : [N.moonrise && "Rises {t}".replace("{t}", clock(N.moonrise)), N.moonset && "Sets {t}".replace("{t}", clock(N.moonset))].filter(Boolean).join(" · ");

    // ISS cell
    let issMain, issSub;
    if (issState.status === "loading") { issMain = "Calculating…"; issSub = "Next visible pass"; }
    else if (issState.status === "ok" && issState.pass) {
      const p = issState.pass, mins = Math.max(1, Math.round((p.end - p.start) / 6e4));
      issMain = `${weekday(p.start)} ${clock(p.start)}`;
      issSub = "{m} min · max {e}° · {a} → {b}".replace("{m}", mins).replace("{e}", Math.round(p.max)).replace("{a}", compass(p.azStart)).replace("{b}", compass(p.azEnd));
    } else if (issState.status === "ok") { issMain = "No visible pass"; issSub = "in the next three days"; }
    else { issMain = `<a class="text-link" href="https://www.heavens-above.com/PassSummary.aspx?satid=25544&lat=${LAT}&lng=${LON}&loc=Lethbridge&alt=900&tz=MST" target="_blank" rel="noopener">Heavens-Above ↗</a>`; issSub = "Live pass data unavailable"; }

    // Hour ticks every two hours
    const ticks = [];
    for (let h = 0; h <= HOURS; h += 1) {
      const d = new Date(N.start.getTime() + h * 36e5);
      ticks.push(`<span class="alm-tick${h % 2 ? " alm-tick--minor" : ""}" style="left:${((h / HOURS) * 100).toFixed(2)}%">${h % 2 ? "" : `<span>${esc(hourLabel(d))}</span>`}</span>`);
    }
    const nowIn = now >= N.start && now <= N.end;
    const issInWindow = issState.pass && issState.pass.start >= N.start && issState.pass.start <= N.end;

    const planetRows = visible.map((p) => `
        <div class="alm-row">
          <div class="alm-row__label"><b>${esc(pname(p.id))}</b><span>${esc("Best {t} · {e}° {d}".replace("{t}", clock(p.best.time)).replace("{e}", Math.round(p.best.alt)).replace("{d}", compass(p.best.az)))}</span></div>
          <div class="alm-row__track alm-row__track--planet">${bars(p.alts)}</div>
        </div>`).join("");

    const summary = "Sunset {a}. {b} Moon {c}% lit. Planets after dark: {d}."
      .replace("{a}", N.sunset ? clock(N.sunset) : "—")
      .replace("{b}", N.dusk ? "Fully dark from {t}.".replace("{t}", clock(N.dusk)) : "No full darkness tonight.")
      .replace("{c}", Math.round(m.illum * 100))
      .replace("{d}", visible.length ? visible.map((p) => pname(p.id)).join(", ") : "none");

    root.innerHTML = `
      <div class="instrument__bar"><span><span class="alm-live" aria-hidden="true"></span>${esc("Live · Lethbridge 49.68° N")}</span><span data-alm-now>${esc(clock(now))}</span></div>
      <p class="sr-only">${esc(summary)}</p>
      <div class="alm-stats">
        <div class="alm-stat">
          <p class="alm-stat__k">${esc("Sunset")}</p>
          <p class="alm-stat__v">${N.sunset ? esc(clock(N.sunset)) : "—"}</p>
          <p class="alm-stat__s">${esc(N.dusk ? "Fully dark from {t}.".replace("{t}", clock(N.dusk)).replace(/\.$/, "") : "No full darkness tonight.".replace(/\.$/, ""))}</p>
        </div>
        <div class="alm-stat alm-stat--moon">
          ${moonIcon(m.age)}
          <div>
            <p class="alm-stat__k">${esc("Moon")}</p>
            <p class="alm-stat__v">${esc(PHASES[phaseIdx])} <small>${Math.round(m.illum * 100)}%</small></p>
            <p class="alm-stat__s">${esc(moonSub)}</p>
          </div>
        </div>
        <div class="alm-stat">
          <p class="alm-stat__k">${esc("Planets")}</p>
          <p class="alm-stat__v">${visible.length ? esc(visible.map((p) => pname(p.id)).join(", ")) : esc("None tonight")}</p>
          <p class="alm-stat__s">${esc(hidden.length ? "Not up after dark: {p}".replace("{p}", hidden.map((p) => pname(p.id)).join(", ")) : "All five naked-eye planets are up")}</p>
        </div>
        <div class="alm-stat">
          <p class="alm-stat__k">${esc("Space Station")}</p>
          <p class="alm-stat__v">${issState.status === "error" ? issMain : esc(issMain)}</p>
          <p class="alm-stat__s">${esc(issSub)}</p>
        </div>
      </div>
      <div class="alm-chart" aria-hidden="true">
        <div class="alm-row alm-row--sky">
          <div class="alm-row__label"><b>${esc("Sky")}</b><span>${esc("Twilight → dark")}</span></div>
          <div class="alm-row__track"><div class="alm-sky" style="background:${skyGradient()}">${marker(N.sunset, "Sunset")}${marker(N.dusk, "Dark")}${marker(N.dawn, "Dawn")}${marker(N.sunrise, "Sunrise")}</div></div>
        </div>
        <div class="alm-row">
          <div class="alm-row__label"><b>${esc("Moon")}</b><span>${Math.round(m.illum * 100)}% ${esc("illuminated")}</span></div>
          <div class="alm-row__track alm-row__track--moon">${bars(N.moonAlt, { color: "230, 236, 247", darkOnly: false })}</div>
        </div>
        ${planetRows}
        ${issInWindow ? `<div class="alm-row"><div class="alm-row__label"><b>ISS</b><span>${esc(clock(issState.pass.start))}</span></div><div class="alm-row__track"><span class="alm-pass" style="left:${pct(issState.pass.start).toFixed(2)}%;width:${Math.max(0.6, pct(issState.pass.end) - pct(issState.pass.start)).toFixed(2)}%"></span></div></div>` : ""}
        <div class="alm-axis"><div class="alm-row__label"></div><div class="alm-axis__track">${ticks.join("")}</div></div>
        ${nowIn ? `<span class="alm-now" style="--p:${(pct(now) / 100).toFixed(4)}"><span>${esc("Now")}</span></span>` : ""}
      </div>
      <p class="alm-foot">${esc("Computed live for Lethbridge. Bars show when each object is above the horizon; brighter means higher in a darker sky.")}</p>`;
  }

  function safeRender() { try { render(); } catch (e) { console.error("[PAMA] tonight failed:", e); } }
  function start() {
    safeRender();
    setInterval(() => {
      const el = root.querySelector("[data-alm-now]");
      if (el) el.textContent = clock(new Date());
      if (new Date().getSeconds() < 30 || !el) safeRender();
    }, 30e3);
    issPass().then((pass) => { issState = { status: "ok", pass }; safeRender(); })
      .catch((e) => { console.warn("[PAMA] ISS pass unavailable:", e); issState = { status: "error" }; safeRender(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
