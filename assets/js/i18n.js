/* ==========================================================================
   Tiny i18n engine — English lives in the HTML; French lives in fr.js
   (loaded only when needed).

   Mark translatable markup with a key:
     <p data-i18n="home.mission.lead">English text…</p>
     <a data-i18n-attr="aria-label:ui.home|title:ui.homeTitle">…</a>
   Add the French string under the same key in assets/js/fr.js.
   A missing French key falls back to the English in the page, so editing
   English never breaks anything. Note: data-i18n replaces the element's
   whole inner HTML — don't put JS-filled children inside it.

   Language choice, in order: ?lang=fr|en in the URL → saved choice →
   the browser's preferred languages → English.
   ========================================================================== */
(function () {
  "use strict";
  const KEY = "pama-lang";
  const root = document.documentElement;
  const frSrc = new URL("fr.js", document.currentScript.src).href;

  function detect() {
    try {
      const q = new URLSearchParams(location.search).get("lang");
      if (q === "fr" || q === "en") { localStorage.setItem(KEY, q); return q; }
      const saved = localStorage.getItem(KEY);
      if (saved === "fr" || saved === "en") return saved;
    } catch (e) { /* storage blocked */ }
    // Whichever of French/English the browser lists first
    const prefs = navigator.languages || [navigator.language || "en"];
    const first = prefs.find((l) => /^(fr|en)\b/i.test(l)) || "en";
    return /^fr/i.test(first) ? "fr" : "en";
  }

  let lang = detect();
  let loading = null;
  root.lang = lang;

  const dict = () => (lang === "fr" && window.PAMA_FR) || {};
  let pending = null;
  const ready = () => lang === "en" || !!window.PAMA_FR;

  function loadFR() {
    if (window.PAMA_FR) return Promise.resolve();
    if (!loading) {
      loading = new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = frSrc;
        s.onload = s.onerror = () => resolve();
        document.head.appendChild(s);
      });
    }
    return loading;
  }

  if (lang === "fr") {
    root.classList.add("i18n-pending");
    setTimeout(() => root.classList.remove("i18n-pending"), 1500); // never stay hidden
    loadFR().then(() => {
      if (document.readyState !== "loading") { apply(); announce(); }
    });
  }

  const originals = new WeakMap(); // element -> { html, attrs }
  function remember(el) {
    let o = originals.get(el);
    if (!o) { o = { html: null, attrs: {} }; originals.set(el, o); }
    return o;
  }

  function apply(scope) {
    const d = dict();
    (scope || document).querySelectorAll("[data-i18n]").forEach((el) => {
      const o = remember(el);
      if (o.html === null) o.html = el.innerHTML;
      const next = d[el.dataset.i18n] ?? o.html;
      if (el.innerHTML !== next) el.innerHTML = next;
    });
    (scope || document).querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const o = remember(el);
      el.dataset.i18nAttr.split("|").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (!(attr in o.attrs)) o.attrs[attr] = el.getAttribute(attr);
        const next = d[key] ?? o.attrs[attr];
        if (next != null) el.setAttribute(attr, next);
      });
    });
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    root.lang = lang === "fr" && !window.PAMA_FR ? "en" : lang; // if French failed to load, the page is still English
    if (ready()) root.classList.remove("i18n-pending");
  }
  const announce = () => document.dispatchEvent(new CustomEvent("pama:lang", { detail: { lang } }));

  window.PAMA_I18N = {
    get lang() { return lang; },
    /** Locale for Intl formatting */
    get locale() { return lang === "fr" ? "fr-CA" : "en-US"; },
    /** UI string for JS-rendered text: t("events.next", "Next up") */
    t(key, fallback) { return dict()[key] ?? fallback ?? key; },
    /** Field from a data.js item, preferring its `fr` override */
    pick(item, field) { return (lang === "fr" && item.fr && item.fr[field]) || item[field]; },
    apply,
    async set(next) {
      next = next === "fr" ? "fr" : "en";
      if (next === (pending || lang)) return;
      pending = next; // quick EN → FR → EN clicks: the last one wins
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      root.classList.add("lang-swap");               // brief fade while text changes
      await Promise.all([next === "fr" ? loadFR() : null, new Promise((r) => setTimeout(r, 170))]);
      if (pending !== next) return;
      pending = null;
      if (next === "fr" && !window.PAMA_FR) { root.classList.remove("lang-swap"); return; } // French failed to load
      lang = next;
      apply();
      announce();
      requestAnimationFrame(() => root.classList.remove("lang-swap"));
    },
  };

  // Back/forward cache: a restored page follows the language chosen since
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (err) { /* ignore */ }
    if ((saved === "fr" || saved === "en") && saved !== lang) window.PAMA_I18N.set(saved);
  });

  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-lang]");
    if (b) window.PAMA_I18N.set(b.dataset.lang);
  });
})();
