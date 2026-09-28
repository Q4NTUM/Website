/* ==========================================================================
   Site chrome — header, menu drawer and footer, shared by every page.
   Loaded synchronously in <head> so the custom elements upgrade as the
   parser reaches them (no flash of missing navigation).

   To change navigation or links site-wide, edit NAV and LINKS below.
   Any element with data-link="instagram" / "joinForm" / "email" gets its
   href filled from LINKS automatically.
   ========================================================================== */
(function () {
  "use strict";

  // Site root, derived from this script's own URL (assets/js/chrome.js),
  // so links keep working from nested paths and from file://.
  const ROOT = new URL("../../", document.currentScript.src).href;

  // Content hidden for scroll-reveal only while JS is healthy: main.js marks
  // "js-ready"; if it never does (missing file, error), everything shows.
  const html = document.documentElement;
  html.classList.add("js");
  try { if (localStorage.getItem("pama-motion") === "off") html.classList.add("motion-off"); } catch (e) { /* storage blocked */ }
  if ("onpagereveal" in window) html.classList.add("vt"); // cross-document view transitions
  document.addEventListener("DOMContentLoaded", () => setTimeout(() => {
    if (!html.classList.contains("js-ready")) html.classList.remove("js");
  }, 2500));

  const LINKS = {
    instagram: "https://www.instagram.com/uleth.pama/",
    joinForm: "https://docs.google.com/forms/d/e/1FAIpQLSfjsnHnHnEASkb9UESTRAUj_tec0Mdjt4p_MMNZUCRRq6XK8A/viewform?usp=header",
    email: "", // e.g. "mailto:pama@example.ca" — leave empty to hide email links
  };

  const NAV = [
    { id: "home", href: "index.html", label: "Home" },
    { id: "about", href: "about.html", label: "About" },
    { id: "events", href: "events.html", label: "Events" },
    { id: "team", href: "team.html", label: "Team" },
    { id: "resources", href: "resources.html", label: "Resources" },
    { id: "news", href: "news.html", label: "News" },
    { id: "logbook", href: "logbook.html", label: "Logbook" },
    { id: "join", href: "join.html", label: "Join" },
  ];

  const ICONS = {
    instagram: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".6" fill="currentColor"/></svg>',
    mail: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
    calendar: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4m8-4v4m-4 6v5m-2.5-2.5h5"/></svg>',
    pin: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    search: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  };
  window.PAMA = { ROOT, LINKS, ICONS, NAV };

  const logo = ROOT + "assets/img/pama-logo-white-sm.png";

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute("active") || "";
      const onJoin = active === "join";
      const items = NAV.map((n, i) => `
          <li><a class="nav-link" href="${ROOT + n.href}" style="--i:${i}"${n.id === active ? ' aria-current="page"' : ""}>
            <span class="nav-link__num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
            <span class="nav-link__mask"><span class="nav-link__label">${n.label}</span></span>
            <span class="nav-link__go i i-arrow" aria-hidden="true"></span>
          </a></li>`).join("");

      this.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header" data-header>
        <!-- the transition name sits on the capsule: on the header it would stop the capsule's backdrop blur -->
        <div class="site-header__inner" style="view-transition-name: site-header">
          <div class="site-header__left">
            <a class="brand" href="${ROOT}index.html" aria-label="PAMA — home"><img src="${logo}" alt="PAMA" width="70" height="17"></a>
            <div class="socials">
              <a href="${LINKS.instagram}" target="_blank" rel="noopener" aria-label="PAMA on Instagram">${ICONS.instagram}</a>
              ${LINKS.email ? `<a href="${LINKS.email}" aria-label="Email PAMA">${ICONS.mail}</a>` : ""}
            </div>
          </div>
          <div class="site-header__center">
            <a class="btn btn--sm" href="${onJoin ? LINKS.joinForm : ROOT + "join.html"}"${onJoin ? ' target="_blank" rel="noopener"' : ""}>Join now</a>
          </div>
          <div class="site-header__right">
            <button class="search-btn" type="button" data-palette-open aria-label="Search the site">${ICONS.search}<kbd aria-hidden="true">/</kbd></button>
            <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" data-menu-toggle>
              <span class="menu-toggle__words"><span>Menu</span><span aria-hidden="true">Close</span></span>
              <span class="menu-toggle__icon" aria-hidden="true"><span></span><span></span></span>
            </button>
          </div>
        </div>
      </header>
      <div class="nav-scrim" data-menu-scrim aria-hidden="true"></div>
      <div class="nav-drawer" id="site-menu" data-menu inert>
        <p class="nav-drawer__eyebrow"><span>Navigate</span><span>PAMA · U of L</span></p>
        <nav aria-label="Primary">
          <ol class="nav-list">${items}
          </ol>
        </nav>
        <div class="nav-drawer__foot">
          <a class="nav-drawer__next" href="${ROOT}events.html" data-teaser>
            <span class="nav-drawer__label nav-drawer__label--signal" data-teaser-kicker>Next up</span>
            <span class="nav-drawer__next-text"><span data-teaser-text>See what's on</span> <span class="i i-arrow" aria-hidden="true"></span></span>
          </a>
          <div>
            <p class="nav-drawer__label">Follow</p>
            <a class="nav-drawer__link" href="${LINKS.instagram}" target="_blank" rel="noopener">@uleth.pama <span class="i i-out" aria-hidden="true"></span></a>
          </div>
          <a class="btn btn--solid nav-drawer__cta" href="${onJoin ? LINKS.joinForm : ROOT + "join.html"}"${onJoin ? ' target="_blank" rel="noopener"' : ""}><span>Become a member</span> <span class="i i-arrow" aria-hidden="true"></span></a>
        </div>
      </div>`;
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      const year = new Date().getFullYear();
      const col = (ids) => NAV.filter((n) => ids.includes(n.id))
        .map((n) => `<li><a href="${ROOT + n.href}">${n.label}</a></li>`).join("");

      this.innerHTML = `
      <footer class="site-footer">
        <img class="footer-watermark" src="${ROOT}assets/img/pama-logo-white.png" alt="" aria-hidden="true" loading="lazy">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <img src="${logo}" alt="PAMA" width="90" height="22" loading="lazy">
              <p>The Physics, Astronomy &amp; Mathematics Association — a student-run community at the University of Lethbridge for anyone curious about how the universe works.</p>
            </div>
            <div>
              <p class="footer-col__title">The club</p>
              <ul>${col(["about", "team", "news", "logbook"])}</ul>
            </div>
            <div>
              <p class="footer-col__title">Get involved</p>
              <ul>${col(["events", "resources", "join"])}<li><a href="${LINKS.joinForm}" target="_blank" rel="noopener"><span>Membership form</span> <span class="i i-out" aria-hidden="true"></span></a></li></ul>
            </div>
            <div>
              <p class="footer-col__title">Connect</p>
              <ul>
                <li><a href="${LINKS.instagram}" target="_blank" rel="noopener">Instagram <span class="i i-out" aria-hidden="true"></span></a></li>
                ${LINKS.email ? `<li><a href="${LINKS.email}">Email</a></li>` : ""}
                <li><span>University of Lethbridge</span><br>4401 University Dr W<br>Lethbridge, AB</li>
              </ul>
            </div>
          </div>
          <div class="footer-ack"><p>We acknowledge that the University of Lethbridge is located on the traditional territory of the Blackfoot Confederacy, in Treaty 7 territory, and we honour the Blackfoot people and their long-standing relationship with this land and its skies.</p><p class="footer-credit">Imagery: NASA, ESA, CSA, STScI, JPL-Caltech. Home: Bubble Nebula (NGC 7635).</p></div>
          <div class="footer-bottom">
            <span>© ${year} PAMA · <span>University of Lethbridge</span></span>
            <span class="lst" role="group" aria-label="Local sidereal time in Lethbridge">
              <span>49.68° N · 112.86° W</span>
              <span title="Local sidereal time — which part of the sky is overhead right now"><span>LST</span> <b data-lst>--:--:--</b></span>
            </span>
            <button class="motion-toggle" type="button" role="switch" aria-checked="true" data-motion-toggle><span>Motion</span> <b data-motion-state>On</b></button>
            <a href="#top" data-to-top>Back to top ↑</a>
          </div>
        </div>
      </footer>`;
    }
  }

  customElements.define("site-header", SiteHeader);
  customElements.define("site-footer", SiteFooter);

  // Fill data-link hrefs once the page is parsed
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-link]").forEach((a) => {
      const url = LINKS[a.dataset.link];
      if (url) a.href = url;
    });
  });
})();

// The site-wide search palette (press / or Ctrl/Cmd+K) loads on its own
(function () {
  const s = document.createElement("script");
  s.src = new URL("palette.js", document.currentScript.src).href;
  s.defer = true;
  document.head.appendChild(s);
})();
