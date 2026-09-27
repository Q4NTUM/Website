# PAMA website

Website for the **Physics, Astronomy & Mathematics Association** at the University of Lethbridge.
It uses plain HTML, CSS and JavaScript, with no build step and no frameworks.

## Preview locally

On Windows, no install needed:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8080. Any other static server also works, for example `python -m http.server` or VS Code Live Server.

## Where things live

| To change…                        | Edit                                           |
|-----------------------------------|------------------------------------------------|
| Events (dates, titles, rooms)     | `assets/js/data.js` → `events`                 |
| News posts                        | `assets/js/data.js` → `news`                   |
| Equation of the week              | `assets/js/data.js` → `equations`              |
| Navigation, Instagram, form, email | `assets/js/chrome.js` → `NAV` and `LINKS`      |
| Header / footer markup            | `assets/js/chrome.js`                          |
| French text                       | `assets/js/fr.js` (keys match `data-i18n="…"`) |
| Colours, fonts, spacing           | `assets/css/style.css` → `:root` tokens        |
| Page text                         | the page's `.html` file                        |

### Add an event

Copy an existing entry in `data.js`. Write times as local Lethbridge time, `"2026-10-08 18:00"`; daylight saving is handled for you. Past events move to the archive automatically. The French `fr: { … }` block is optional.

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
- The site is served from the root of **ulethpama.space** (see `CNAME`). `404.html` uses `<base href="/">` and redirects old links such as `Team.html` and `/Website/…`.
- Have a fluent speaker proofread `fr.js`.
- Optional: add real event photos and exec portraits, and a 1200×630 `og.jpg` for link previews.
