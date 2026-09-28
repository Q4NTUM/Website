/* ==========================================================================
   Search palette — press "/" or Ctrl/Cmd+K anywhere (or the header's search
   button) to jump to any page, section, event, news post or resource.
   Accessible combobox: the input keeps focus; arrows move the highlight.
   ========================================================================== */
(function () {
  "use strict";

  const P = window.PAMA || {}, ROOT = P.ROOT || "", NAV = P.NAV || [], LINKS = P.LINKS || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dlg, input, list, items = [], shown = [], active = 0, resources = null, opener = null;

  /* ---- Index ---- */
  function todayYMD() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}`;
  }
  function dateLabel(ymd) {
    const d = new Date(ymd + "T12:00:00Z");
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(d);
  }
  function build() {
    const D = window.PAMA_DATA || {}, out = [];
    NAV.forEach((n, i) => out.push({ group: "pages", title: n.label, sub: String(i + 1).padStart(2, "0"), href: ROOT + n.href, words: n.id }));
    // Sections of the page you're on
    document.querySelectorAll("main h2[id]").forEach((h) => {
      const txt = h.textContent.trim();
      if (txt) out.push({ group: "here", title: txt, sub: "On this page", href: "#" + h.id });
    });
    const today = todayYMD();
    (D.events || []).filter((e) => e && e.id && String(e.end || e.start) >= today).sort((a, b) => a.start.localeCompare(b.start)).forEach((e) => {
      out.push({ group: "events", title: e.title, sub: `${dateLabel(e.start.slice(0, 10))} · ${e.location}`, href: `${ROOT}event.html?id=${encodeURIComponent(e.id)}`, words: `${e.cat} ${e.desc}` });
    });
    (D.news || []).forEach((n) => out.push({ group: "news", title: n.title, sub: `${dateLabel(n.date)} · ${n.tag}`, href: `${ROOT}news.html#${encodeURIComponent(n.id)}`, words: n.excerpt }));
    (resources || []).forEach((r) => out.push({ group: "resources", title: r.name, sub: r.desc, href: r.href, ext: true }));
    out.push(
      { group: "actions", title: "Tonight's sky over Lethbridge", sub: "Darkness, moon, planets, ISS", href: ROOT + "events.html#tonight-title", words: "moon planets iss sky tonight" },
      { group: "actions", title: "Problem of the week", sub: "This week's puzzle", href: ROOT + "index.html#pow-title", words: "puzzle" },
      { group: "actions", title: "Copy a link to this page", sub: "Share", run: copyLink, words: "share url" },
      { group: "actions", title: "Membership form", sub: "Google Forms", href: LINKS.joinForm, ext: true, words: "join member" },
      { group: "actions", title: "Instagram", sub: "@uleth.pama", href: LINKS.instagram, ext: true, words: "social" },
    );
    items = out.filter((x) => x.href || x.run);
  }
  function loadResources() {
    if (resources || location.protocol === "file:") return;
    resources = [];
    fetch(ROOT + "resources.html").then((r) => r.text()).then((txt) => {
      const doc = new DOMParser().parseFromString(txt, "text/html");
      resources = Array.from(doc.querySelectorAll("a.res[href^='http']")).map((a) => ({
        name: (a.querySelector(".res__name") || a).textContent.trim(),
        desc: (a.querySelector(".res__desc") || {}).textContent || "",
        href: a.href,
      }));
      if (dlg && dlg.open) { build(); render(); }
    }).catch(() => { /* offline: resources simply don't appear */ });
  }

  /* ---- Matching: prefix beats word-start beats substring beats subsequence ---- */
  function score(item, q) {
    const title = fold(item.title), hay = fold(`${item.title} ${item.sub || ""} ${item.words || ""}`);
    if (title.startsWith(q)) return 100 - title.length * 0.01;
    if (new RegExp("\\b" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(title)) return 80;
    if (title.includes(q)) return 60;
    if (hay.includes(q)) return 40;
    let i = 0;
    for (const ch of title) if (ch === q[i]) i++;
    return i === q.length ? 20 : 0;
  }
  const GROUPS = ["pages", "here", "events", "news", "resources", "actions"];
  const GROUP_LABEL = { pages: "Pages", here: "On this page", events: "Upcoming events", news: "News", resources: "Resources", actions: "Quick actions" };

  function render() {
    const q = fold(input.value.trim());
    let res, order = GROUPS;
    if (!q) {
      res = items.filter((x) => x.group === "pages" || x.group === "actions" || x.group === "here")
        .concat(items.filter((x) => x.group === "events").slice(0, 3));
    } else {
      const scored = items.map((x) => ({ x, s: score(x, q) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s);
      res = scored.map((r) => r.x);
      order = [...new Set(res.map((x) => x.group))]; // groups in order of their best match
    }
    // Keep each group together: at most 6 per group when searching, 8 when browsing
    shown = [];
    order.forEach((g) => res.filter((x) => x.group === g).slice(0, q ? 6 : 8).forEach((x) => shown.push(x)));
    active = 0;
    if (!shown.length) {
      list.innerHTML = `<li class="pal__empty" role="presentation">${esc("Nothing matches “{q}”".replace("{q}", input.value.trim()))}</li>`;
      input.setAttribute("aria-activedescendant", "");
      return;
    }
    let html = "", last = "";
    shown.forEach((x, i) => {
      if (x.group !== last) { last = x.group; html += `<li class="pal__group" role="presentation">${esc(GROUP_LABEL[x.group])}</li>`; }
      html += `<li class="pal__item" role="option" id="pal-${i}" data-i="${i}" aria-selected="${i === 0}">
        <span class="pal__title">${esc(x.title)}</span>${x.sub ? `<span class="pal__sub">${esc(x.sub)}</span>` : ""}
        <span class="pal__go" aria-hidden="true">${x.ext ? "↗" : "↵"}</span></li>`;
    });
    list.innerHTML = html;
    input.setAttribute("aria-activedescendant", "pal-0");
  }
  function move(d) {
    if (!shown.length) return;
    active = (active + d + shown.length) % shown.length;
    list.querySelectorAll(".pal__item").forEach((li) => li.setAttribute("aria-selected", String(+li.dataset.i === active)));
    const el = list.querySelector(`#pal-${active}`);
    input.setAttribute("aria-activedescendant", `pal-${active}`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }
  function go(i, newTab) {
    const x = shown[i];
    if (!x) return;
    close(false);
    if (x.run) { x.run(); return; }
    if (x.ext || newTab) { window.open(x.href, "_blank", "noopener"); return; }
    const url = new URL(x.href, location.href);
    if (url.pathname === location.pathname && url.hash) {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) { target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); history.replaceState(null, "", url.hash); return; }
    }
    location.href = url.href;
  }
  function copyLink() {
    const say = (m) => window.PAMA && window.PAMA.toast && window.PAMA.toast(m);
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(() => say("Link copied"), () => say(location.href));
  }

  /* ---- Dialog ---- */
  function create() {
    dlg = document.createElement("dialog");
    dlg.className = "pal";
    dlg.setAttribute("aria-label", "Search the site");
    dlg.innerHTML = `
      <div class="pal__box">
        <div class="pal__field">
          <svg class="pal__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
          <input class="pal__input" type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" autocomplete="off" spellcheck="false">
          <kbd class="pal__kbd">Esc</kbd>
        </div>
        <ul class="pal__list" id="pal-list" role="listbox"></ul>
        <p class="pal__foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> ${esc("to move")}</span><span><kbd>↵</kbd> ${esc("to open")}</span><span><kbd>Esc</kbd> ${esc("to close")}</span></p>
      </div>`;
    document.body.appendChild(dlg);
    input = dlg.querySelector(".pal__input");
    list = dlg.querySelector(".pal__list");
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); go(active, e.metaKey || e.ctrlKey); }
    });
    list.addEventListener("click", (e) => { const li = e.target.closest(".pal__item"); if (li) go(+li.dataset.i, e.metaKey || e.ctrlKey); });
    list.addEventListener("mousemove", (e) => { const li = e.target.closest(".pal__item"); if (li && +li.dataset.i !== active) move(+li.dataset.i - active); });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener("close", () => { document.documentElement.classList.remove("pal-open"); if (opener && opener.focus) opener.focus({ preventScroll: true }); });
  }
  function open() {
    if (!dlg) create();
    if (dlg.open) return;
    opener = document.activeElement;
    input.placeholder = "Search pages, events, resources…";
    build(); input.value = ""; render();
    dlg.showModal();
    document.documentElement.classList.add("pal-open");
    input.focus();
    loadResources();
  }
  function close(restore = true) {
    if (!dlg || !dlg.open) return;
    if (!restore) opener = null;
    dlg.close();
  }

  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (dlg && dlg.open) close(); else open(); return; }
    if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(); }
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-palette-open]")) { e.preventDefault(); open(); } });
})();
