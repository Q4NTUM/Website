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
| Colours, fonts, spacing           | `assets/css/style.css` → `:root` tokens        |
| Page text                         | the page's `.html` file                        |

### Add an event

Copy an existing entry in `data.js`. Write times as local Lethbridge time, `"2026-10-08 18:00"`; daylight saving is handled for you. Past events move to the archive automatically. Every event also gets its own shareable page, `event.html?id=THE-ID`, with a boarding-pass ticket, a map (from `venues`), a "what to bring" list (optional `bring: [...]`, otherwise a default per category) and add-to-calendar buttons.

### Add a logbook photo

Save two JPEGs in `assets/img/logbook/`: `NAME-800.jpg` (800 px on the long side, for the grid) and `NAME-1600.jpg` (for the full-screen viewer). Then add an entry to `gallery` in `data.js` with `src: "NAME"`, the 800-size `w`/`h`, a date, title, place, credit and caption. The eight current photos are NASA placeholders — replace them with members' shots.

### Built-in extras

- **Tonight's sky** (Events page, `assets/js/sky.js`): sunset, darkness, moon, planets and the next visible ISS pass, computed live for Lethbridge. The ISS uses CelesTrak orbital elements and the satellite.js library, both fetched only on that page; if they're unreachable it links to Heavens-Above instead.
- **Search** (`assets/js/palette.js`): press `/` or Ctrl/Cmd+K, or use the search button in the header.
- **Motion switch** in the footer: pauses every animation (also honoured automatically when a visitor's system asks for reduced motion).
- **Join sound**: clicking any link to the membership form plays `assets/audio/its-happening.mp3` once, at 35% volume. Change the file or the volume at `JOIN_SOUND` / `JOIN_VOLUME` in `main.js`. If the file is missing, nothing plays.

### Add a page

Copy `about.html`, then change the `<title>`, the `active="…"` attribute on `<site-header>`, and the content. Add the page to `NAV` in `chrome.js`.

The site is English only. Visitors who want another language can use their browser's built-in translate option.

## Before launch

- Replace placeholder content: history, rooms, event dates and the faculty advisor. Search for "TBA" and "Placeholder".
- Set `LINKS.email` in `chrome.js` once the club address exists.
- The site is served from the root of **ulethpama.space** (see `CNAME`). `404.html` uses absolute `/…` URLs and redirects old links such as `Team.html` and `/Website/…`.
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
