/* ==========================================================================
   Site chrome — header, particle menu and footer, shared by every page.
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
    { id: "join", href: "join.html", label: "Join" },
  ];

  const ICONS = {
    instagram: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".6" fill="currentColor"/></svg>',
    mail: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
    calendar: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4m8-4v4m-4 6v5m-2.5-2.5h5"/></svg>',
    pin: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  };
  window.PAMA = { ROOT, LINKS, ICONS };

  const logo = ROOT + "assets/img/pama-logo-white-sm.png";
  const langSwitch = `
    <div class="lang" role="group" aria-label="Language" data-i18n-attr="aria-label:ui.language">
      <button type="button" data-lang="en" aria-pressed="true" lang="en" aria-label="English">EN</button><span aria-hidden="true">/</span><button type="button" data-lang="fr" aria-pressed="false" lang="fr" aria-label="Français">FR</button>
    </div>`;

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute("active") || "";
      const onJoin = active === "join";
      const items = NAV.map((n, i) => `
        <a class="menu__item" href="${ROOT + n.href}" style="--i:${i}"${n.id === active ? ' aria-current="page"' : ""}>
          <span class="menu__label"><span class="menu__num" aria-hidden="true">0${i + 1}</span><span data-i18n="nav.${n.id}">${n.label}</span></span>
          <span class="menu__dot" aria-hidden="true"></span>
        </a>`).join("");

      this.innerHTML = `
      <a class="skip-link" href="#main" data-i18n="ui.skip">Skip to content</a>
      <header class="site-header" data-header style="view-transition-name: site-header">
        <div class="site-header__inner">
          <div class="site-header__left">
            <a class="brand" href="${ROOT}index.html" aria-label="PAMA — home" data-i18n-attr="aria-label:ui.home"><img src="${logo}" alt="PAMA" width="70" height="17"></a>
            <div class="socials">
              <a href="${LINKS.instagram}" target="_blank" rel="noopener" aria-label="PAMA on Instagram" data-i18n-attr="aria-label:ui.instagram">${ICONS.instagram}</a>
              ${LINKS.email ? `<a href="${LINKS.email}" aria-label="Email PAMA" data-i18n-attr="aria-label:ui.email">${ICONS.mail}</a>` : ""}
            </div>
          </div>
          <div class="site-header__center">
            <a class="btn btn--sm" href="${onJoin ? LINKS.joinForm : ROOT + "join.html"}"${onJoin ? ' target="_blank" rel="noopener"' : ""} data-i18n="ui.joinNow">Join now</a>
          </div>
          <div class="site-header__right">
            ${langSwitch}
            <nav class="menu" aria-label="Primary" data-i18n-attr="aria-label:ui.primaryNav" data-menu>
              <button class="menu__toggle" type="button" aria-expanded="false" aria-controls="site-menu">
                <span data-i18n="ui.menu">Menu</span><span class="menu__bars" aria-hidden="true"><span></span><span></span></span>
              </button>
              <div class="menu__panel" id="site-menu">
                ${items}
                <div class="menu__lang">${langSwitch}</div>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <div class="menu-veil" data-menu-veil></div>`;
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      const year = new Date().getFullYear();
      const col = (ids) => NAV.filter((n) => ids.includes(n.id))
        .map((n) => `<li><a href="${ROOT + n.href}" data-i18n="nav.${n.id}">${n.label}</a></li>`).join("");

      this.innerHTML = `
      <footer class="site-footer">
        <img class="footer-watermark" src="${ROOT}assets/img/pama-logo-white.png" alt="" aria-hidden="true" loading="lazy">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <img src="${logo}" alt="PAMA" width="90" height="22" loading="lazy">
              <p data-i18n="footer.about">The Physics, Astronomy &amp; Mathematics Association — a student-run community at the University of Lethbridge for anyone curious about how the universe works.</p>
            </div>
            <div>
              <p class="footer-col__title" data-i18n="footer.explore">Explore</p>
              <ul>${col(["home", "about", "events", "team"])}</ul>
            </div>
            <div>
              <p class="footer-col__title" data-i18n="footer.involved">Get involved</p>
              <ul>${col(["resources", "news", "join"])}<li><a href="${LINKS.joinForm}" target="_blank" rel="noopener" data-i18n="footer.form">Membership form</a></li></ul>
            </div>
            <div>
              <p class="footer-col__title" data-i18n="footer.connect">Connect</p>
              <ul>
                <li><a href="${LINKS.instagram}" target="_blank" rel="noopener">Instagram</a></li>
                ${LINKS.email ? `<li><a href="${LINKS.email}" data-i18n="footer.email">Email</a></li>` : ""}
                <li><span data-i18n="footer.uni">University of Lethbridge</span><br>4401 University Dr W<br>Lethbridge, AB</li>
              </ul>
            </div>
          </div>
          <div class="footer-ack"><p data-i18n="footer.ack">We acknowledge that the University of Lethbridge is located on the traditional territory of the Blackfoot Confederacy, in Treaty 7 territory, and we honour the Blackfoot people and their long-standing relationship with this land and its skies.</p><p class="footer-credit" data-i18n="footer.imagery">Imagery: NASA, ESA, CSA, STScI, JPL-Caltech. Home: Bubble Nebula (NGC 7635).</p></div>
          <div class="footer-bottom">
            <span>© ${year} PAMA · <span data-i18n="footer.uni">University of Lethbridge</span></span>
            <span class="lst" role="group" aria-label="Local sidereal time in Lethbridge" data-i18n-attr="aria-label:footer.lstLabel">
              <span data-i18n="footer.coords">49.68° N · 112.86° W</span>
              <span data-i18n-attr="title:footer.lstTitle" title="Local sidereal time — which part of the sky is overhead right now"><span data-i18n="footer.lst">LST</span> <b data-lst>--:--:--</b></span>
            </span>
            <a href="#top" data-to-top data-i18n="footer.top">Back to top ↑</a>
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
      else if (a.dataset.link === "email") a.hidden = true;
    });
  });
})();
