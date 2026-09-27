# PAMA website

Website for the **Physics, Astronomy & Mathematics Association** at the University of Lethbridge.
It uses plain HTML, CSS and JavaScript, with no build step and no frameworks.

## Preview locally

On Windows, no install needed:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8080 (or the port set in `serve.ps1`). Any other static server also works, for example `python -m http.server` or VS Code Live Server.

## Where things live

| To change…                        | Edit                                           |
|-----------------------------------|------------------------------------------------|
| Events (dates, titles, rooms)     | `assets/js/data.js` → `events`                 |
| News posts                        | `assets/js/data.js` → `news`                   |
| Equation of the week              | `assets/js/data.js` → `equations`              |
| Problem of the week               | `assets/js/data.js` → `problems`               |
| Logbook photos                    | `assets/js/data.js` → `gallery` + `assets/img/logbook/` |
| Event venues and maps             | `assets/js/data.js` → `venues`                 |
| Navigation, Instagram, form, email | `assets/js/chrome.js` → `NAV` and `LINKS`      |
| Header / footer markup            | `assets/js/chrome.js`                          |
| French text                       | `assets/js/fr.js` (keys match `data-i18n="…"`) |
| Colours, fonts, spacing           | `assets/css/style.css` → `:root` tokens        |
| Page text                         | the page's `.html` file                        |

### Add an event

Copy an existing entry in `data.js`. Write times as local Lethbridge time, `"2026-10-08 18:00"`; daylight saving is handled for you. Past events move to the archive automatically. The French `fr: { … }` block is optional. Every event also gets its own shareable page, `event.html?id=THE-ID`, with a boarding-pass ticket, a map (from `venues`), a "what to bring" list (optional `bring: [...]`, otherwise a default per category) and add-to-calendar buttons.

### Add a logbook photo

Save two JPEGs in `assets/img/logbook/`: `NAME-800.jpg` (800 px on the long side, for the grid) and `NAME-1600.jpg` (for the full-screen viewer). Then add an entry to `gallery` in `data.js` with `src: "NAME"`, the 800-size `w`/`h`, a date, title, place, credit and caption. The eight current photos are NASA placeholders — replace them with members' shots.

### Built-in extras

- **Tonight's sky** (Events page, `assets/js/sky.js`): sunset, darkness, moon, planets and the next visible ISS pass, computed live for Lethbridge. The ISS uses CelesTrak orbital elements and the satellite.js library, both fetched only on that page; if they're unreachable it links to Heavens-Above instead.
- **Search** (`assets/js/palette.js`): press `/` or Ctrl/Cmd+K, or use the search button in the header.
- **Motion switch** in the footer: pauses every animation (also honoured automatically when a visitor's system asks for reduced motion).

### Add a page

Copy `about.html`, then change the `<title>`, the `active="…"` attribute on `<site-header>`, and the content. Add the page to `NAV` in `chrome.js`.

### Translations

English text lives in the HTML. Any element with `data-i18n="some.key"` is swapped for `window.PAMA_FR["some.key"]` when a visitor picks FR. If a key is missing, the English stays, so editing English never breaks the page. Remember to update the French too.

- **Attributes:** `data-i18n-attr="aria-label:some.key|title:other.key"`.
- **Whole-element swap:** a `data-i18n` element's inner HTML is replaced as a whole. Don't put JS-filled children inside it; wrap only the text in a `<span data-i18n>`.
- **Placeholders:** strings rendered by JS can use `{n}` or `{title}`, as in `events.showing.one` and `events.showing.other`.
- **New page:** also add `nav.<id>` and `meta.<page>.title` / `meta.<page>.desc` to `fr.js`.
- **French typography:** use a non-breaking space (` `) before `:` and inside `« »`, and in times like `18 h`.
- **Picking the language:** the site reads `?lang=fr` in the URL first, then the visitor's saved choice, then the browser's language. `fr.js` only loads when French is needed.

## Before launch

- Replace placeholder content: history, rooms, event dates and the faculty advisor. Search for "TBA" and "Placeholder".
- Set `LINKS.email` in `chrome.js` once the club address exists.
- The site is served from the root of **ulethpama.space** (see `CNAME`). `404.html` uses absolute `/…` URLs and redirects old links such as `Team.html` and `/Website/…`.
- Have a fluent speaker proofread `fr.js`.
- Replace the placeholder logbook photos, and optionally add exec portraits. The link-preview image is `assets/img/og.jpg` (1200×630).
- Confirm the venue coordinates in `data.js` → `venues`.

## Page themes and image credits

Each page sets `data-theme` on `<body>`, which picks its accent colour (in `style.css`, "Page themes") and its animated sky effect (in `main.js` → `starfield()`). Hero photos live in `assets/img/bg/` and come from NASA's public image library (images.nasa.gov):

| Page | Image | Credit |
|---|---|---|
| Home | Bubble Nebula (NGC 7635) | NASA, ESA, Hubble Heritage Team |
| About | Cosmic Cliffs, Carina Nebula (NGC 3324) | NASA, ESA, CSA, STScI |
| Events | Pillars of Creation, Eagle Nebula (M16), infrared | NASA, ESA, Hubble Heritage Team |
| Team | Stephan's Quintet | NASA, ESA, CSA, STScI |
| Resources | Webb's First Deep Field (SMACS 0723) | NASA, ESA, CSA, STScI |
| News | Crab Nebula (M1) | NASA, ESA, J. Hester (ASU) |
| Join | The Pleiades (M45) | NASA/JPL-Caltech |
| Logbook | Star trails over Earth, from the ISS | NASA / Don Pettit |

Keep the on-page credit line when swapping images. Hero photos are 2560 px wide JPEGs (quality ~80), cut from the full-resolution originals — anything smaller looks soft on large or high-density screens.
