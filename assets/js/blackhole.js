/* ==========================================================================
   The Event Horizon — a live black hole in the Events page hero.

   Light is traced backwards from the camera through the curved spacetime of
   a non-spinning (Schwarzschild) black hole. Each ray falls in (the shadow),
   crosses the accretion disk (which glows), or escapes to a sky of stars,
   the Milky Way and faint nebulae — so the whole sky is really lensed:
   stars slide toward the hole, smear into arcs and split into two images.

   Units: the Schwarzschild radius rs = 1. Light bends according to
     d²x/dt² = −(3/2) h² x / r⁵,   h = |x × v|  (conserved)
   which reproduces the photon sphere (1.5 rs), the shadow edge
   (√27/2 ≈ 2.6 rs) and weak-field lensing (deflection ≈ 2 rs / b).
   The disk runs from the innermost stable orbit (3 rs) outward: thin-disk
   temperature profile, Keplerian flow, gravitational redshift and Doppler
   beaming (the side coming toward you is brighter and bluer).

   Pipeline (WebGL 2, HDR):
     1. bend (coarse)  — how far light is bent, over the whole hero, low res
     2. bend (fine)    — round the hole: the finished colour (disk and lensed
                         sky), 4 rays a pixel at the shadow edge
     3. sky            — everywhere else, every screen pixel: stars and the
                         Milky Way along each ray's bent direction
     4. bloom          — the glow of the hottest gas and brightest stars
     5. finish         — tone map, dither, to screen

   Desktop only (≥ 901 px). It measures the GPU at start-up and picks a
   quality level, pauses off screen and in background tabs, freezes to a
   still frame when motion is switched off, and if WebGL 2 is missing the
   hero photo simply stays.
   ========================================================================== */
(function () {
  "use strict";

  const hero = document.querySelector("[data-blackhole]");
  if (!hero) return;
  const bg = hero.querySelector(".page-hero__bg");
  const anchor = hero.querySelector("[data-bh-anchor]");
  if (!bg || !anchor) return;

  // Add #bh-debug to the address to expose window.__bh for tuning
  const DEBUG = /bh-debug/.test(location.hash);
  const forcedLevel = parseInt((/bh-level=(\d)/.exec(location.hash) || [])[1], 10);

  const desktop = window.matchMedia("(min-width: 901px)");
  const osReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const html = document.documentElement;
  const still = () => osReduce.matches || html.classList.contains("motion-off");

  /* ---- Scene settings (tweak here) ---- */
  const DISK_IN = 3.0;        // inner edge: the innermost stable circular orbit, 3 rs
  const DISK_OUT = 11.0;      // outer edge of the glowing disk, in rs
  const CAM_DIST = 34.0;      // camera distance from the hole, in rs
  const SIZE = 0.52;          // disk radius as a fraction of the hero's right-hand column
  const TILT = 0.24;          // camera height above the disk plane (radians, ~14°)
  const TILT_RANGE = 0.1;     // how far the pointer tilts the view
  const ROLL_RANGE = 0.1;
  const PAN_RANGE = 0.28;     // how far the pointer swings the camera round the hole
  const DRIFT = 0.45;         // the camera's slow drift round the hole (radians either way)
  const DRIFT_PERIOD = 140;   // seconds for one drift back and forth
  const INNER_ORBIT = 3.5;    // seconds for gas at the inner edge to go round once
  const look = { exposure: 0.55, bloom: 0.08, stars: 1.8 };   // brightness, glow, star brightness

  /* ---- Shaders ---- */
  const VERT = `#version 300 es
    in vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const NOISE = `
    float hash1(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float vnoise(vec3 x) {
      vec3 i = floor(x), f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash1(i), hash1(i + vec3(1, 0, 0)), f.x),
                     mix(hash1(i + vec3(0, 1, 0)), hash1(i + vec3(1, 1, 0)), f.x), f.y),
                 mix(mix(hash1(i + vec3(0, 0, 1)), hash1(i + vec3(1, 0, 1)), f.x),
                     mix(hash1(i + vec3(0, 1, 1)), hash1(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p, int oct) {
      float s = 0.0, a = 0.5, n = 0.0;
      for (int i = 0; i < 8; i++) {
        if (i >= oct) break;
        s += a * vnoise(p); n += a;
        p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5;
      }
      return s / n;
    }`;

  /* The sky, shared by both passes: the Milky Way map plus four layers of
     stars. calm (0–1) fades star images stretched into threads right at
     the shadow's edge, where the lensing magnifies without limit. */
  const SKYFN = `
    vec3 hash33(vec3 p) {
      p = fract(p * vec3(0.1031, 0.1030, 0.0973));
      p += dot(p, p.yxz + 33.33);
      return fract((p.xxy + p.yxx) * p.zyx);
    }
    vec3 starColour(float t) {
      return t < 0.35 ? mix(vec3(1.0, 0.62, 0.38), vec3(1.0, 0.86, 0.72), t / 0.35)
                      : mix(vec3(1.0, 0.95, 0.9), vec3(0.72, 0.82, 1.0), (t - 0.35) / 0.65);
    }
    // One layer of stars: at most one per cell of a cube-sphere grid
    vec3 stars(vec3 d, float cells, float prob, float seed, float gain) {
      vec3 a = abs(d);
      vec2 uv; float face;
      if (a.x >= a.y && a.x >= a.z) { uv = d.yz / a.x; face = d.x > 0.0 ? 0.0 : 1.0; }
      else if (a.y >= a.z)          { uv = d.xz / a.y; face = d.y > 0.0 ? 2.0 : 3.0; }
      else                          { uv = d.xy / a.z; face = d.z > 0.0 ? 4.0 : 5.0; }
      vec2 g = (uv * 0.5 + 0.5) * cells, c = floor(g);
      vec3 h = hash33(vec3(c, face * 131.0 + seed));
      if (h.x > prob) return vec3(0.0);
      vec2 sp = c + 0.2 + 0.6 * h.yz;
      float ang = length(g - sp) * (2.0 / cells) / (1.0 + dot(uv, uv));
      vec3 k = hash33(vec3(c.yx + 17.0, face + seed * 7.0));
      float mag = pow(k.x, 14.0);                  // many faint stars, a few bright ones
      float sig = uPix * (0.55 + 1.1 * mag);
      return starColour(k.y) * gain * (0.04 + 2.0 * mag) * exp(-0.5 * ang * ang / (sig * sig));
    }
    vec3 skyColour(vec3 sd, float calm) {
      float lon = atan(sd.x, sd.z) / 6.2831853 + 0.5;
      float lat = asin(clamp(sd.y, -1.0, 1.0)) / 3.14159265 + 0.5;
      vec3 sky = textureLod(uNeb, vec2(lon, lat), 0.0).rgb;
      float m = exp(-pow(dot(sd, uBand) / 0.2, 2.0));    // more stars along the Milky Way
      vec3 s = stars(sd, 40.0, 0.45, 1.0, 10.0)
             + stars(sd, 100.0, 0.12 + 0.2 * m, 2.0, 2.2)
             + stars(sd, 240.0, 0.06 + 0.3 * m, 3.0, 1.2)
             + stars(sd, 560.0, 0.008 + 0.25 * m, 4.0, 0.55);
      return sky + s * uStarGain * calm;
    }
    // How far lensing stretches a star image round the hole: the angle of the
    // image from the hole over the angle of the star itself (point-lens
    // tangential magnification). Threads stretched past ~5× are dimmed.
    float calmFor(vec3 dir, vec3 v0) {
      float stretch = acos(clamp(v0.z, -1.0, 1.0)) / max(acos(clamp(dir.z, -1.0, 1.0)), 1e-4);
      return mix(1.0, 0.25, smoothstep(5.0, 15.0, stretch)) * (1.0 - smoothstep(0.6, 1.4, length(dir - v0)));
    }`;

  /* 1–2. Light paths.
     Coarse pass: over the whole hero at low resolution, it stores how far each
     ray was bent (and how much sky shows through); the sky pass then looks up
     the stars along that direction at full resolution. Far from the hole the
     bending changes smoothly, so this is exact enough and cheap.
     Fine pass: round the hole it renders the finished colour itself (disk,
     glow and the lensed sky), with 4 rays a pixel near the shadow's edge —
     there, neighbouring rays go completely different ways (one falls in, the
     next loops round the hole), so they can't be blended afterwards. */
  const BEND = `#version 300 es
    precision highp float;
    uniform vec4 uRegion;   // CSS px rectangle this target covers
    uniform vec2 uSize;     // target size, px
    uniform vec4 uSkip;     // CSS px rectangle left to the fine pass
    uniform vec2 uHole;     // hole centre, CSS px
    uniform float uF;       // focal length, CSS px
    uniform float uD;       // camera distance, rs
    uniform vec3 uN, uE1, uE2;   // disk normal and in-plane axes, camera space
    uniform float uTime;
    uniform float uOmega;   // angular speed at r = 1 (Keplerian: × r^-1.5)
    uniform int uDisk;      // 1: the fine pass
    uniform sampler2D uNeb;
    uniform mat3 uCam;      // camera → sky directions
    uniform vec3 uBand;
    uniform float uStarGain;
    uniform float uPix;     // angular size of one pixel, radians
    layout(location = 0) out vec4 oLight;
    layout(location = 1) out vec4 oBend;

    const float RIN = ${DISK_IN.toFixed(2)};
    const float ROUT = ${DISK_OUT.toFixed(2)};
    const float TAU = 6.2831853;
    // Rotated-grid offsets for 4 rays a pixel
    const vec2 SS[4] = vec2[4](vec2(-0.125, -0.375), vec2(0.375, -0.125), vec2(0.125, 0.375), vec2(-0.375, 0.125));
    ${NOISE}
    ${SKYFN}

    vec3 accel(vec3 p, float h2) {
      float r2 = dot(p, p);
      return -1.5 * h2 * p / (r2 * r2 * sqrt(r2));
    }

    // Fiery palette after NASA's accretion-disk visualisations: deep red,
    // through orange and amber, to gold-white where the gas is hottest.
    // Stops are sRGB; returns linear.
    vec3 fire(float t) {
      vec3 c;
      if (t < 0.3)       c = mix(vec3(0.16, 0.015, 0.0), vec3(0.62, 0.09, 0.01), t / 0.3);
      else if (t < 0.55) c = mix(vec3(0.62, 0.09, 0.01), vec3(0.96, 0.3, 0.03), (t - 0.3) / 0.25);
      else if (t < 0.8)  c = mix(vec3(0.96, 0.3, 0.03), vec3(1.0, 0.52, 0.09), (t - 0.55) / 0.25);
      else if (t < 1.05) c = mix(vec3(1.0, 0.52, 0.09), vec3(1.0, 0.72, 0.28), (t - 0.8) / 0.25);
      else if (t < 1.35) c = mix(vec3(1.0, 0.72, 0.28), vec3(1.0, 0.88, 0.62), (t - 1.05) / 0.3);
      else               c = mix(vec3(1.0, 0.88, 0.62), vec3(1.0, 0.97, 0.9), clamp((t - 1.35) / 0.45, 0.0, 1.0));
      return pow(c, vec3(2.2));
    }

    // Turbulence carried round by the flow. Two layers cross-fade so the
    // differential rotation never winds the pattern up completely.
    float flow(float r, float phi, float om) {
      const float T = 7.0;
      float t1 = mod(uTime, T), t2 = mod(uTime + 0.5 * T, T);
      float w = 1.0 - abs(2.0 * t1 / T - 1.0);
      float lr = log(r) * 10.0;
      float a1 = phi - om * t1, a2 = phi - om * t2 + 2.4;
      float n1 = fbm(vec3(cos(a1) * 4.0, sin(a1) * 4.0, lr), 4);
      float n2 = fbm(vec3(cos(a2) * 4.0, sin(a2) * 4.0, lr + 5.3), 4);
      return mix(n2, n1, w);
    }

    // Bright clumps of gas, each on its own Keplerian orbit
    float clumps(float r, float phi) {
      float s = 0.0;
      for (int i = 0; i < 16; i++) {
        float fi = float(i);
        vec3 h = fract(sin(vec3(fi * 12.9898, fi * 78.233, fi * 37.719)) * 43758.5453);
        float rb = RIN + 0.4 + h.x * h.x * 6.5;
        float ph = h.y * TAU + uOmega * pow(rb, -1.5) * uTime;
        float dphi = mod(phi - ph + 3.14159265, TAU) - 3.14159265;
        float wr = 0.18 + 0.3 * h.z, arc = (0.25 + 0.55 * h.x) * (3.0 / rb + 0.25);
        s += (0.6 + h.z) * exp(-pow((r - rb) / wr, 2.0) - pow(dphi / arc, 2.0));
      }
      return s;
    }

    // Light from the disk where the ray crosses it; dir is the ray's march
    // direction (the photon itself travels the other way, towards us)
    vec4 disk(vec3 p, vec3 dir) {
      float r = length(p);
      float phi = atan(dot(p, uE2), dot(p, uE1));
      float om = uOmega * pow(max(r, RIN), -1.5);
      if (r < RIN) {
        // Inside the last stable orbit the gas spirals in: a faint glow
        // that fades into the dark, so the disk doesn't end in a hard edge
        float k = smoothstep(1.2, RIN, r);
        float a = phi * 2.0 - log(r) * 5.0 - uTime * 2.4;
        float swirl = fbm(vec3(cos(a) * 1.5, sin(a) * 1.5, r * 1.5), 3);
        return vec4(fire(0.5 + 0.2 * k) * 0.5 * k * k * (0.5 + 0.5 * swirl), 0.22 * k * k);
      }
      vec3 u = normalize(cross(p, uN));             // direction the gas moves
      // Thin-disk temperature profile, peak normalised to 1 (at r ≈ 4.1 rs)
      float x = RIN / r;
      float temp = pow(x, 0.75) * pow(max(1.0 - sqrt(x), 0.0) + 0.03, 0.25) / 0.51;
      // Orbital speed seen by a static observer: 0.5c at the inner edge
      float beta = sqrt(0.5 / (r - 1.0));
      float g = sqrt(1.0 - beta * beta) / (1.0 + beta * dot(u, dir)) * sqrt(1.0 - 1.0 / r);
      float n = flow(r, phi, om);
      float lumps = clumps(r, phi);
      float bright = (pow(temp, 1.6) * (0.3 + 1.1 * n * n) + 0.9 * lumps * temp) * g * g * g;
      // Colour follows the (Doppler-shifted) heat: hotter gas and the
      // approaching side run toward gold-white, the rest glows orange-red
      float heat = temp * g * (0.72 + 0.35 * n + 0.2 * lumps);
      vec3 col = fire(heat) * bright * 3.2;
      float edge = smoothstep(RIN, RIN + 0.35, r) * (1.0 - smoothstep(ROUT - 5.0, ROUT, r));
      float a = clamp(edge * (0.6 + 0.55 * n + 0.3 * lumps), 0.0, 0.985);
      return vec4(col, a);
    }

    // Faint glowing gas just above and below the disk. Being part of the
    // march it is lensed too: the soft halo round the far-side arch.
    vec3 haze(vec3 p) {
      float r = length(p);
      if (r < RIN * 0.8 || r > ROUT) return vec3(0.0);
      float h = dot(p, uN);
      return fire(0.7) * pow(RIN / r, 2.2) * smoothstep(RIN * 0.8, RIN * 1.3, r) * exp(-h * h / 0.1);
    }

    // The photon ring: light that circles the hole (at 1.5 rs) before
    // escaping piles up in a thin ring at impact parameter √27/2 ≈ 2.598 rs.
    // Drawn from that directly, so it stays smooth at any resolution, and
    // brighter over the side of the disk whose gas comes toward us.
    vec3 photonRing(float b, vec3 v0) {
      const float BC = 2.5980762;
      float x = b - BC;
      if (x < -0.06 || x > 0.8) return vec3(0.0);
      float core = exp(-pow(x / 0.035, 2.0));
      float halo = exp(-max(x, 0.0) / 0.2) * smoothstep(-0.06, 0.0, x) * 0.22;
      vec3 s = normalize(vec3(v0.xy, 0.0));
      vec3 pd = normalize(s - dot(s, uN) * uN);    // the disk direction under this part of the ring
      float toward = -cross(pd, uN).z;             // how much the gas there moves toward us
      return fire(0.95 + 0.3 * toward) * (1.4 * core + halo) * pow(1.0 + 0.45 * toward, 3.0);
    }

    // March one ray from the camera. Returns the light gathered from the
    // disk, how much of the sky still shows through (0 if it fell in), and
    // its final direction out to infinity.
    void trace(vec2 px, bool withDisk, out vec3 light, out float vis, out vec3 dir, out vec3 v0) {
      vec2 q = (px - uHole) / uF;
      v0 = normalize(vec3(q.x, -q.y, 1.0));
      vec3 v = v0, p = vec3(0.0, 0.0, -uD);
      float h2 = dot(cross(p, v), cross(p, v));
      light = vec3(0.0);
      float trans = 1.0, fell = 0.0;
      int crossings = 0;
      for (int i = 0; i < 220; i++) {
        float r = length(p);
        float dt = r * mix(0.04, 0.16, smoothstep(2.5, 14.0, r));
        vec3 p0 = p;
        // Runge–Kutta 4
        vec3 k1v = accel(p, h2),                  k1p = v;
        vec3 k2v = accel(p + 0.5 * dt * k1p, h2), k2p = v + 0.5 * dt * k1v;
        vec3 k3v = accel(p + 0.5 * dt * k2p, h2), k3p = v + 0.5 * dt * k2v;
        vec3 k4v = accel(p + dt * k3p, h2),       k4p = v + dt * k3v;
        p += dt / 6.0 * (k1p + 2.0 * k2p + 2.0 * k3p + k4p);
        v += dt / 6.0 * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);

        if (withDisk) {
          float s0 = dot(p0, uN), s1 = dot(p, uN);
          // Crossed the disk plane. Only the first two images of the disk are
          // drawn: later ones are squeezed into a line far thinner than a
          // pixel and would only sparkle; the photon ring stands in for them.
          if (s0 * s1 < 0.0 && crossings < 2) {
            crossings++;
            vec3 hit = mix(p0, p, s0 / (s0 - s1));
            float rh = length(hit);
            if (rh > 1.1 && rh < ROUT) {
              vec4 d = disk(hit, normalize(v));
              light += trans * d.a * d.rgb;
              trans *= 1.0 - d.a;
            }
          }
          light += trans * 0.25 * dt * haze(p);
        }
        float r1 = length(p);
        if (r1 < 1.0) { fell = 1.0; break; }
        if (trans < 0.01) break;
        if (r1 > uD * 1.02 && dot(p, v) > 0.0) break;
      }
      // Escaped: add the rest of the (weak-field) bending out to infinity
      vec3 d = normalize(v);
      float s = dot(p, d);
      vec3 perp = p - s * d;
      float b = max(length(perp), 1e-3);
      dir = normalize(d - (1.0 - s / length(p)) / b * perp / b);
      vis = trans * (1.0 - fell);
      if (withDisk) light += trans * photonRing(sqrt(h2), v0);
    }

    void main() {
      vec2 px = vec2(uRegion.x + gl_FragCoord.x / uSize.x * uRegion.z,
                     uRegion.y + (1.0 - gl_FragCoord.y / uSize.y) * uRegion.w);
      if (px.x > uSkip.x && px.x < uSkip.x + uSkip.z && px.y > uSkip.y && px.y < uSkip.y + uSkip.w) {
        oLight = vec4(0.0, 0.0, 0.0, 1.0); oBend = vec4(0.0); return;
      }
      vec3 light, dir, v0;
      float vis;
      if (uDisk == 0) {
        trace(px, false, light, vis, dir, v0);
        oLight = vec4(light, vis);
        oBend = vec4((dir - v0) * step(0.0001, vis), 0.0);
        return;
      }
      // Fine pass: finished colour, 4 rays a pixel in and round the shadow
      float b = length(px - uHole) / uF * uD;        // roughly the ray's impact parameter, rs
      int n = b < 4.3 ? 4 : 1;
      float pixCss = uRegion.z / uSize.x;
      vec3 acc = vec3(0.0);
      for (int k = 0; k < 4; k++) {
        if (k >= n) break;
        vec2 o = n == 1 ? vec2(0.0) : SS[k] * pixCss;
        trace(px + o, true, light, vis, dir, v0);
        acc += light + skyColour(uCam * dir, calmFor(dir, v0)) * vis;
      }
      oLight = vec4(acc / float(n), 1.0);
      oBend = vec4(0.0);
    }`;

  /* 3. The screen: the fine pass's finished colour round the hole; elsewhere
     the sky along each coarse ray's bent direction, at full resolution */
  const SKY = `#version 300 es
    precision highp float;
    uniform sampler2D uLowL, uLowB, uHiL, uNeb;
    uniform vec4 uHiRect;   // CSS px rectangle of the fine pass
    uniform vec2 uCss;      // canvas size, CSS px
    uniform vec2 uSize;     // this target, px
    uniform vec2 uHole;
    uniform float uF;
    uniform mat3 uCam;      // camera → sky directions
    uniform float uPix;     // angular size of one pixel, radians
    uniform vec3 uBand;     // pole of the Milky Way's plane
    uniform float uStarGain;
    out vec4 oColor;
    ${SKYFN}

    void main() {
      vec2 p = vec2(gl_FragCoord.x / uSize.x * uCss.x, (1.0 - gl_FragCoord.y / uSize.y) * uCss.y);
      vec2 hu = vec2((p.x - uHiRect.x) / uHiRect.z, 1.0 - (p.y - uHiRect.y) / uHiRect.w);
      float e = min(min(p.x - uHiRect.x, uHiRect.x + uHiRect.z - p.x), min(p.y - uHiRect.y, uHiRect.y + uHiRect.w - p.y));
      float w = smoothstep(0.0, 24.0, e);
      vec3 col = vec3(0.0);
      if (w < 1.0) {
        vec2 lu = vec2(p.x / uCss.x, 1.0 - p.y / uCss.y);
        vec4 L = texture(uLowL, lu), B = texture(uLowB, lu);
        vec2 q = (p - uHole) / uF;
        vec3 v0 = normalize(vec3(q.x, -q.y, 1.0)), d = normalize(v0 + B.xyz);
        col = L.rgb + skyColour(uCam * d, calmFor(d, v0)) * L.a;
      }
      if (w > 0.0) col = mix(col, texture(uHiL, hu).rgb, w);
      oColor = vec4(col, 1.0);
    }`;

  /* The Milky Way and nebulae on an equirectangular sky map, made once */
  const NEBULA = `#version 300 es
    precision highp float;
    uniform vec2 uSize;
    uniform vec3 uBand, uCore;
    out vec4 oColor;
    ${NOISE}
    void main() {
      vec2 uv = gl_FragCoord.xy / uSize;
      float lon = (uv.x - 0.5) * 6.2831853, lat = (uv.y - 0.5) * 3.14159265;
      vec3 d = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));
      float b = dot(d, uBand);
      float band = exp(-b * b / (0.16 * 0.16));
      float wide = exp(-b * b / (0.5 * 0.5));
      float core = exp(-(1.0 - dot(d, uCore)) / 0.025);
      float cl = fbm(d * 3.2 + 1.3, 6);
      float fine = fbm(d * 12.0 + 7.1, 5);
      float dust = smoothstep(0.46, 0.7, fbm(d * 7.0 + 3.7, 6)) * smoothstep(0.2, 0.9, band + core);
      vec3 cool = vec3(0.45, 0.58, 1.0), warm = vec3(1.0, 0.7, 0.45);
      vec3 mw = mix(cool, warm, clamp(core * 2.5 + 0.1, 0.0, 1.0)) * (band * (0.25 + 1.3 * cl * fine) + wide * 0.08 + core * 1.8);
      mw *= 1.0 - 0.9 * dust;
      float n1 = pow(fbm(d * 1.7 + 11.0, 7), 3.0), n2 = pow(fbm(d * 2.5 + 23.0, 7), 4.0);
      vec3 neb = n1 * vec3(0.28, 0.36, 1.0) + n2 * vec3(1.0, 0.3, 0.5);
      oColor = vec4(mw * 0.12 + neb * 0.05, 1.0);
    }`;

  /* 4. Bloom: a 13-tap downsample and a tent upsample (as in CoD: AW) */
  const DOWN = `#version 300 es
    precision highp float;
    uniform sampler2D uSrc;
    uniform vec2 uTexel, uSize;
    out vec4 oColor;
    void main() {
      vec2 uv = gl_FragCoord.xy / uSize, t = uTexel;
      vec3 a = texture(uSrc, uv + t * vec2(-2, 2)).rgb, b = texture(uSrc, uv + t * vec2(0, 2)).rgb, c = texture(uSrc, uv + t * vec2(2, 2)).rgb;
      vec3 d = texture(uSrc, uv + t * vec2(-2, 0)).rgb, e = texture(uSrc, uv).rgb, f = texture(uSrc, uv + t * vec2(2, 0)).rgb;
      vec3 g = texture(uSrc, uv + t * vec2(-2, -2)).rgb, h = texture(uSrc, uv + t * vec2(0, -2)).rgb, i = texture(uSrc, uv + t * vec2(2, -2)).rgb;
      vec3 j = texture(uSrc, uv + t * vec2(-1, 1)).rgb, k = texture(uSrc, uv + t * vec2(1, 1)).rgb;
      vec3 l = texture(uSrc, uv + t * vec2(-1, -1)).rgb, m = texture(uSrc, uv + t * vec2(1, -1)).rgb;
      vec3 o = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
      oColor = vec4(min(o, vec3(60.0)), 1.0);
    }`;
  const UP = `#version 300 es
    precision highp float;
    uniform sampler2D uSrc;
    uniform vec2 uTexel, uSize;
    out vec4 oColor;
    void main() {
      vec2 uv = gl_FragCoord.xy / uSize, t = uTexel;
      vec3 s = texture(uSrc, uv).rgb * 4.0;
      s += (texture(uSrc, uv + vec2(t.x, 0)).rgb + texture(uSrc, uv - vec2(t.x, 0)).rgb + texture(uSrc, uv + vec2(0, t.y)).rgb + texture(uSrc, uv - vec2(0, t.y)).rgb) * 2.0;
      s += texture(uSrc, uv + t).rgb + texture(uSrc, uv - t).rgb + texture(uSrc, uv + vec2(t.x, -t.y)).rgb + texture(uSrc, uv + vec2(-t.x, t.y)).rgb;
      oColor = vec4(s / 16.0, 1.0);
    }`;

  /* 5. Tone map (Khronos PBR Neutral: keeps hues), gamma, dither */
  const FINISH = `#version 300 es
    precision highp float;
    uniform sampler2D uScene, uBloom;
    uniform vec2 uSize;
    uniform float uExposure, uBloomAmt;
    out vec4 oColor;
    vec3 neutral(vec3 c) {
      const float start = 0.76, desat = 0.05;   // low desaturation keeps the fiery oranges rich
      float x = min(c.r, min(c.g, c.b));
      float off = x < 0.08 ? x - 6.25 * x * x : 0.04;
      c -= off;
      float peak = max(c.r, max(c.g, c.b));
      if (peak < start) return c;
      const float d = 1.0 - start;
      float np = 1.0 - d * d / (peak + d - start);
      c *= np / peak;
      float g = 1.0 - 1.0 / (desat * (peak - np) + 1.0);
      return mix(c, vec3(np), g);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / uSize;
      vec3 c = (texture(uScene, uv).rgb + texture(uBloom, uv).rgb * uBloomAmt) * uExposure;
      c = pow(max(neutral(c), 0.0), vec3(1.0 / 2.2));
      float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      oColor = vec4(c + (n - 0.5) / 255.0, 1.0);
    }`;

  /* ---- State ---- */
  let canvas = null, gl = null, P = {}, quad = null, nebTex = null;
  let W = 0, H = 0, dpr = 1, level = 1, levels = [], hole = { x: 0, y: 0 }, pxPerRs = 20;
  let hiRect = { x: 0, y: 0, w: 1, h: 1 }, T = {};
  let raf = 0, running = false, visible = true, frozen = false, ready = false;
  let last = 0, simTime = 0;
  let tilt = TILT, roll = 0, pan = 0, tiltTo = TILT, rollTo = 0, panTo = 0;
  const dts = [];
  let badWindows = 0;
  const LOW_SCALE = 0.3;
  const BAND = norm([-Math.sin(0.62), Math.cos(0.62), 0.0]);          // Milky Way tilted ~35°, passing behind the hole
  const CORE = (() => { const c = norm([-1.1, -0.75, 0.9]), k = dot(c, BAND); return norm([c[0] - k * BAND[0], c[1] - k * BAND[1], c[2] - k * BAND[2]]); })();

  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  function program(fragSrc) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fragSrc));
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  }

  // A render target: one or two float textures (linear filtering is core in WebGL 2).
  // Colour-only stages use the compact R11F_G11F_B10F format (4 bytes a pixel).
  function target(w, h, count = 1, compact = false) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    const fb = gl.createFramebuffer(), tex = [];
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    for (let i = 0; i < count; i++) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      if (compact) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, w, h, 0, gl.RGB, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
      tex.push(t);
    }
    gl.drawBuffers(tex.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("framebuffer");
    return { fb, tex, w, h };
  }
  function freeTarget(t) {
    if (!t) return;
    t.tex.forEach((x) => gl.deleteTexture(x));
    gl.deleteFramebuffer(t.fb);
  }

  function setup() {
    canvas = document.createElement("canvas");
    canvas.className = "bh-canvas";
    canvas.setAttribute("aria-hidden", "true");
    gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: DEBUG });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return false;
    // No real graphics chip (WebGL emulated on the CPU): ray tracing would crawl
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return false;

    P.bend = program(BEND);
    P.sky = program(SKY);
    P.neb = program(NEBULA);
    P.down = program(DOWN);
    P.up = program(UP);
    P.finish = program(FINISH);

    quad = gl.createVertexArray();
    gl.bindVertexArray(quad);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // The Milky Way and nebulae, drawn once onto a 2:1 sky map
    const neb = target(2048, 1024, 1, true);
    use(P.neb, neb);
    gl.uniform2f(P.neb.u.uSize, neb.w, neb.h);
    gl.uniform3fv(P.neb.u.uBand, BAND);
    gl.uniform3fv(P.neb.u.uCore, CORE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    nebTex = neb.tex[0];
    gl.bindTexture(gl.TEXTURE_2D, nebTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.deleteFramebuffer(neb.fb);

    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); teardown(); });
    return true;
  }

  function use(prog, t) {
    gl.useProgram(prog.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fb : null);
    gl.viewport(0, 0, t ? t.w : canvas.width, t ? t.h : canvas.height);
  }
  function bind(unit, tex, loc) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  // Where things sit, in CSS px relative to the hero photo's box
  function layout() {
    W = bg.offsetWidth; H = bg.offsetHeight;
    const b = bg.getBoundingClientRect(), a = anchor.getBoundingClientRect();
    hole = { x: a.left + a.width / 2 - b.left, y: a.top + a.height / 2 - b.top };
    pxPerRs = (Math.min(a.width, a.height * 1.6) * SIZE) / DISK_OUT;
    // The fine pass covers the disk and the strongest lensing round it
    const hx = 15 * pxPerRs + 30, hy = 9.5 * pxPerRs + 30;
    const x0 = Math.max(0, hole.x - hx), y0 = Math.max(0, hole.y - hy);
    hiRect = { x: x0, y: y0, w: Math.min(W, hole.x + hx) - x0, h: Math.min(H, hole.y + hy) - y0 };
    dpr = window.devicePixelRatio || 1;
    // Quality levels, best first: [fine-pass scale, screen scale] per CSS px
    levels = [
      [Math.min(dpr, 1.5), Math.min(dpr, 2)],
      [1.0, Math.min(dpr, 1.5)],
      [0.75, 1.0],
      [0.55, 0.75],
    ];
    allocate();
    anchor.style.setProperty("--bh-rs", pxPerRs.toFixed(2) + "px");
  }

  function allocate() {
    const [hs, cs] = levels[level];
    ["low", "hi", "scene", "b0", "b1", "b2", "b3", "b4", "b5"].forEach((k) => { freeTarget(T[k]); T[k] = null; });
    canvas.width = Math.max(1, Math.round(W * cs));
    canvas.height = Math.max(1, Math.round(H * cs));
    T.low = target(W * LOW_SCALE, H * LOW_SCALE, 2);
    T.hi = target(hiRect.w * hs, hiRect.h * hs, 2);
    T.scene = target(canvas.width, canvas.height, 1, true);
    let w = canvas.width, h = canvas.height;
    for (let i = 0; i <= 5; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); T["b" + i] = target(w, h, 1, true); }
  }

  // Camera: drifting slowly round the hole, nudged by the pointer
  function camera() {
    const drift = still() ? 0 : DRIFT * Math.sin((simTime / DRIFT_PERIOD) * Math.PI * 2);
    const az = drift + pan, el = tilt;
    const pos = [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
    const F = [-pos[0], -pos[1], -pos[2]];
    const R0 = norm(cross([0, 1, 0], F)), U0 = cross(F, R0);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const R = [R0[0] * cr + U0[0] * sr, R0[1] * cr + U0[1] * sr, R0[2] * cr + U0[2] * sr];
    const U = [U0[0] * cr - R0[0] * sr, U0[1] * cr - R0[1] * sr, U0[2] * cr - R0[2] * sr];
    const inCam = (v) => [dot(v, R), dot(v, U), dot(v, F)];
    return {
      toSky: [...R, ...U, ...F],            // columns: camera x, y, z in sky directions
      n: inCam([0, 1, 0]), e1: inCam([1, 0, 0]), e2: inCam([0, 0, 1]),
    };
  }

  function bend(t, region, skip, withDisk, cam) {
    const u = P.bend.u;
    use(P.bend, t);
    gl.uniform4f(u.uRegion, region.x, region.y, region.w, region.h);
    gl.uniform2f(u.uSize, t.w, t.h);
    gl.uniform4f(u.uSkip, skip.x, skip.y, skip.w, skip.h);
    gl.uniform2f(u.uHole, hole.x, hole.y);
    gl.uniform1f(u.uF, pxPerRs * CAM_DIST);
    gl.uniform1f(u.uD, CAM_DIST);
    gl.uniform3fv(u.uN, cam.n);
    gl.uniform3fv(u.uE1, cam.e1);
    gl.uniform3fv(u.uE2, cam.e2);
    gl.uniform1f(u.uTime, simTime);
    gl.uniform1f(u.uOmega, (2 * Math.PI / INNER_ORBIT) * Math.pow(DISK_IN, 1.5));
    gl.uniform1i(u.uDisk, withDisk ? 1 : 0);
    // The fine pass also lights the sky itself
    bind(4, nebTex, u.uNeb);
    gl.uniformMatrix3fv(u.uCam, false, cam.toSky);
    gl.uniform3fv(u.uBand, BAND);
    gl.uniform1f(u.uStarGain, look.stars);
    gl.uniform1f(u.uPix, 1 / (pxPerRs * CAM_DIST * (t.w / region.w)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function draw() {
    tilt += (tiltTo - tilt) * 0.05;
    roll += (rollTo - roll) * 0.05;
    pan += (panTo - pan) * 0.05;
    const cam = camera();
    gl.bindVertexArray(quad);
    gl.disable(gl.BLEND);

    // 1–2. Light paths: coarse everywhere, fine round the hole
    const F = 22;
    bend(T.low, { x: 0, y: 0, w: W, h: H }, { x: hiRect.x + F, y: hiRect.y + F, w: hiRect.w - 2 * F, h: hiRect.h - 2 * F }, false, cam);
    bend(T.hi, hiRect, { x: 0, y: 0, w: 0, h: 0 }, true, cam);

    // 3. Sky and disk, every pixel
    const s = P.sky.u;
    use(P.sky, T.scene);
    bind(0, T.low.tex[0], s.uLowL); bind(1, T.low.tex[1], s.uLowB);
    bind(2, T.hi.tex[0], s.uHiL);
    bind(4, nebTex, s.uNeb);
    gl.uniform4f(s.uHiRect, hiRect.x, hiRect.y, hiRect.w, hiRect.h);
    gl.uniform2f(s.uCss, W, H);
    gl.uniform2f(s.uSize, T.scene.w, T.scene.h);
    gl.uniform2f(s.uHole, hole.x, hole.y);
    gl.uniform1f(s.uF, pxPerRs * CAM_DIST);
    gl.uniformMatrix3fv(s.uCam, false, cam.toSky);
    gl.uniform1f(s.uPix, 1 / (pxPerRs * CAM_DIST * (T.scene.w / W)));
    gl.uniform3fv(s.uBand, BAND);
    gl.uniform1f(s.uStarGain, look.stars);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 4. Bloom: down the chain, then back up, adding as it goes
    let src = T.scene;
    for (let i = 0; i <= 5; i++) {
      const dst = T["b" + i];
      use(P.down, dst);
      bind(0, src.tex[0], P.down.u.uSrc);
      gl.uniform2f(P.down.u.uTexel, 1 / src.w, 1 / src.h);
      gl.uniform2f(P.down.u.uSize, dst.w, dst.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      src = dst;
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = 5; i > 0; i--) {
      const from = T["b" + i], dst = T["b" + (i - 1)];
      use(P.up, dst);
      bind(0, from.tex[0], P.up.u.uSrc);
      gl.uniform2f(P.up.u.uTexel, 1 / from.w, 1 / from.h);
      gl.uniform2f(P.up.u.uSize, dst.w, dst.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.disable(gl.BLEND);

    // 5. To the screen
    use(P.finish, null);
    bind(0, T.scene.tex[0], P.finish.u.uScene);
    bind(1, T.b0.tex[0], P.finish.u.uBloom);
    gl.uniform2f(P.finish.u.uSize, canvas.width, canvas.height);
    gl.uniform1f(P.finish.u.uExposure, look.exposure);
    gl.uniform1f(P.finish.u.uBloomAmt, look.bloom / 6);   // the chain sums six blurred copies
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!ready) {
      ready = true;
      setTimeout(() => { hero.classList.add("bh-on"); }, 60);   // fade in once the first frame is up
    }
  }

  /* ---- Quality ----
     At start-up, time the GPU directly (draw, then wait for it to finish)
     and pick a level. Frame timing alone can't tell a slow GPU from a
     browser capping us at 30 fps (battery saver). */
  const GPU_BUDGET = 9;                  // ms of GPU time per frame we're happy to use
  // Time 8 frames and 2 frames, each followed by a wait for the GPU; the
  // difference cancels the fixed cost of waiting and leaves 6 frames of work
  function gpuTime() {
    const px = new Uint8Array(4);
    const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const batch = (n) => { const t = performance.now(); for (let i = 0; i < n; i++) draw(); sync(); return performance.now() - t; };
    batch(1);                                         // warm-up
    return Math.max(0.3, (batch(8) - batch(2)) / 6);
  }
  // The middle of three estimates (fewer if the GPU is clearly slow).
  // Measured at level 2; level 0 costs ≈ 2.4×, level 1 ≈ 1.2×.
  function calibrate(runs = 3) {
    if (forcedLevel >= 0 && forcedLevel < levels.length) { level = forcedLevel; allocate(); return; }
    const was = level;
    level = 2; allocate();
    const est = [gpuTime()];
    while (est.length < runs && est[0] < GPU_BUDGET * 2) est.push(gpuTime());
    const ms = est.sort((a, b) => a - b)[est.length >> 1];
    level = ms < GPU_BUDGET / 2.6 ? 0 : ms < GPU_BUDGET / 1.3 ? 1 : ms < GPU_BUDGET ? 2 : 3;
    allocate();
    if (ms > GPU_BUDGET * 4) freeze();                // too slow even for the lowest level
    if (DEBUG) console.info(`[PAMA] black hole: ${ms.toFixed(1)} ms/frame at level 2 → level ${level} (was ${was}, estimates ${est.map((e) => e.toFixed(1)).join(", ")})`);
  }

  // Safety net while running: step down if frames are really slow (under
  // ~22 fps), and freeze if even the lowest level can't cope
  let slowRun = 0;
  function adapt(dt) {
    if (forcedLevel >= 0) return;
    // Gaps this long mean the browser is throttling us (background window)
    if (dt > 100) { if (++slowRun > 45) freeze(); return; }
    slowRun = 0;
    dts.push(dt);
    if (dts.length < 40) return;
    const med = dts.slice().sort((a, b) => a - b)[20];
    dts.length = 0;
    if (med <= 45) { badWindows = 0; return; }
    if (level < levels.length - 1) { level++; allocate(); }
    else if (++badWindows >= 2) freeze();
  }

  function loop(now) {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = now - last;
    if (last && dt < 14) return;         // cap at ~60 fps on high-refresh screens
    if (last) { simTime += Math.min(dt, 50) / 1000; adapt(dt); }
    last = now;
    draw();
  }

  function start() {
    if (!gl || frozen || running || !visible || document.hidden) return;
    if (still()) { draw(); return; }
    running = true; last = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  // Slow machine: keep the last frame as a still image
  function freeze() {
    frozen = true;
    stop();
    if (ready) draw();
  }
  function teardown() {
    stop();
    hero.classList.remove("bh-on", "bh-active");
    if (canvas) canvas.remove();
    canvas = gl = null;
  }

  /* ---- Pointer: swing, tilt and roll the view a little ---- */
  function onPointer(e) {
    const r = hero.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    tiltTo = TILT - y * 2 * TILT_RANGE;
    rollTo = -x * 2 * ROLL_RANGE;
    panTo = x * 2 * PAN_RANGE;
  }

  /* ---- Annotations: labels over the render, sized from the physics ---- */
  function annotations() {
    const btn = hero.querySelector("[data-bh-toggle]");
    const layer = hero.querySelector("[data-bh-labels]");
    if (!btn || !layer) return;
    btn.hidden = false;
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      btn.lastChild.textContent = on ? "Hide the physics" : "Show the physics";
      layer.hidden = !on;
      hero.classList.toggle("bh-labelled", on);
      if (on) placeLabels();
    });
  }
  function placeLabels() {
    const layer = hero.querySelector("[data-bh-labels]");
    if (!layer) return;
    const f = pxPerRs * CAM_DIST;
    // Apparent radii (CSS px) seen from the camera distance
    const shadow = f * Math.tan(Math.asin((Math.sqrt(27) / 2 / CAM_DIST) * Math.sqrt(1 - 1 / CAM_DIST)));
    const einstein = f * Math.sqrt(2 / CAM_DIST);
    layer.style.setProperty("--bh-shadow", shadow.toFixed(1) + "px");
    layer.style.setProperty("--bh-einstein", einstein.toFixed(1) + "px");
    layer.style.setProperty("--bh-rs", pxPerRs.toFixed(2) + "px");
  }

  /* ---- Boot ---- */
  let booted = false;
  function boot() {
    if (booted || !desktop.matches) return;
    booted = true;
    try {
      if (!setup()) { canvas = gl = null; return; }
    } catch (err) {
      console.warn("[PAMA] black hole unavailable:", err.message);
      canvas = gl = null;
      return;
    }
    hero.classList.add("bh-active");
    bg.appendChild(canvas);
    layout();
    calibrate();
    draw();
    start();
    annotations();
    placeLabels();
    // Re-check once the page has settled (start-up work skews the first timing)
    setTimeout(() => {
      const recheck = () => { if (gl && !frozen) { calibrate(3); if (!running) draw(); } };   // resizing clears the canvas
      if ("requestIdleCallback" in window) requestIdleCallback(recheck, { timeout: 1500 }); else recheck();
    }, 2200);

    let rt = 0;
    new ResizeObserver(() => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (gl) { layout(); placeLabels(); if (!running) draw(); } }, 120);
    }).observe(hero);
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) start(); else stop();
    }, { rootMargin: "80px" }).observe(hero);
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
    document.addEventListener("pama:motion", () => { if (still()) { stop(); draw(); } else start(); });
    window.addEventListener("pointermove", onPointer, { passive: true });
    // A throttled or slow spell froze it: try again when the window comes back
    window.addEventListener("focus", () => { if (frozen) { frozen = false; slowRun = 0; start(); } });

    if (DEBUG) {
      window.__bh = {
        get state() { return { level, levels, W, H, canvas: [canvas.width, canvas.height], hi: [T.hi.w, T.hi.h], running, frozen, pxPerRs, hole, simTime }; },
        stop, start, draw: () => draw(),
        set(k, v) {
          if (k === "time") simTime = v;
          if (k === "tilt") tilt = tiltTo = v;
          if (k === "roll") roll = rollTo = v;
          if (k === "pan") pan = panTo = v;
          if (k === "level") { level = v; allocate(); }
          if (k in look) look[k] = v;
          draw();
        },
        gpu: () => +gpuTime().toFixed(2),
        // Save a frame to the local frame sink (scratch tool): the whole hero with
        // the page's dark veil (crop 0), or a close crop round the hole (crop = half-width, CSS px)
        save(name = "frame.jpg", crop = 0, width = 1400) {
          draw();
          const c = document.createElement("canvas"), k = canvas.width / W;
          let sx = 0, sy = 0, sw = canvas.width, sh = canvas.height;
          if (crop) { sw = 2 * crop * k; sh = 1.25 * crop * k; sx = hole.x * k - sw / 2; sy = hole.y * k - sh / 2; }
          c.width = width; c.height = Math.round(width * sh / sw);
          const g = c.getContext("2d");
          g.fillStyle = "#04060c"; g.fillRect(0, 0, c.width, c.height);
          g.globalAlpha = 1;
          g.drawImage(canvas, sx, sy, sw, sh, 0, 0, c.width, c.height);
          g.globalAlpha = 1;
          if (!crop) {       // the CSS veil that keeps the text side readable
            const h = g.createLinearGradient(0, 0, c.width, 0);
            h.addColorStop(0, "rgba(4,6,12,.94)"); h.addColorStop(0.36, "rgba(4,6,12,.74)"); h.addColorStop(0.62, "rgba(4,6,12,.12)"); h.addColorStop(1, "rgba(4,6,12,.18)");
            g.fillStyle = h; g.fillRect(0, 0, c.width, c.height);
          }
          return new Promise((res) => c.toBlob((b) => fetch("http://localhost:8093/save?name=" + encodeURIComponent(name), { method: "POST", body: b }).then(() => res(name), (e) => res("failed: " + e.message)), "image/jpeg", 0.9));
        },
        probe(x, y) {              // raw values at a CSS px point, per stage
          draw();
          const read = (t, u, v) => { const o = new Float32Array(4); gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.readBuffer(gl.COLOR_ATTACHMENT0); gl.readPixels(Math.min(t.w - 1, Math.floor(u * t.w)), Math.min(t.h - 1, Math.floor(v * t.h)), 1, 1, gl.RGBA, gl.FLOAT, o); return Array.from(o, (n) => +n.toFixed(4)); };
          const readB = (t, u, v) => { const o = new Float32Array(4); gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.readBuffer(gl.COLOR_ATTACHMENT1); gl.readPixels(Math.min(t.w - 1, Math.floor(u * t.w)), Math.min(t.h - 1, Math.floor(v * t.h)), 1, 1, gl.RGBA, gl.FLOAT, o); gl.readBuffer(gl.COLOR_ATTACHMENT0); return Array.from(o, (n) => +n.toFixed(4)); };
          const lu = x / W, lv = 1 - y / H, hu = (x - hiRect.x) / hiRect.w, hv = 1 - (y - hiRect.y) / hiRect.h;
          return { scene: read(T.scene, lu, lv), bloom0: read(T.b0, lu, lv), lowLight: read(T.low, lu, lv), lowBend: readB(T.low, lu, lv), hiLight: hu >= 0 && hu <= 1 && hv >= 0 && hv <= 1 ? read(T.hi, hu, hv) : null };
        },
        nebula(u, v) { const t = { fb: gl.createFramebuffer() }; gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, nebTex, 0); const o = new Float32Array(4); gl.readPixels(Math.floor(u * 2047), Math.floor(v * 1023), 1, 1, gl.RGBA, gl.FLOAT, o); gl.deleteFramebuffer(t.fb); return Array.from(o, (n) => +n.toFixed(4)); },
        inspect(half = 260) {      // full-screen crop around the hole, for close looks
          let ov = document.getElementById("bh-inspect");
          if (!ov) { ov = document.createElement("canvas"); ov.id = "bh-inspect"; ov.style.cssText = "position:fixed;inset:0;z-index:99999;width:100vw;height:100vh;background:#000"; document.body.appendChild(ov); }
          ov.width = innerWidth * 2; ov.height = innerHeight * 2;
          draw();
          const k = canvas.width / W, g = ov.getContext("2d"), sz = Math.min(ov.width, ov.height * 4 / 3);
          g.drawImage(canvas, hole.x * k - half * k, hole.y * k - half * 0.75 * k, 2 * half * k, 1.5 * half * k, (ov.width - sz) / 2, (ov.height - sz * 0.75) / 2, sz, sz * 0.75);
        },
        page() { const ov = document.getElementById("bh-inspect"); if (ov) ov.remove(); hero.classList.add("bh-on"); html.classList.remove("js"); draw(); },
      };
    }
  }
  // Only on wide screens; a window that grows past 900 px can start it later
  desktop.addEventListener("change", () => {
    if (desktop.matches) { boot(); start(); } else stop();
  });
  boot();
})();
