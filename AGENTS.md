# CC-news — AGENTS.md

## What this is

A static news + horoscope site (`zh-Hant`/en) deployed to GitHub Pages. Single-page HTML/JS/CSS frontend, Node.js build script for data fetching. No framework, no backend server, no database.

## Repo structure at a glance

```
CC-news/                # repo root = publish root (no public/ subdir)
├── index.html          # main page
├── css/style.css       # styles
├── js/app.js           # frontend logic
├── scripts/fetch-data.js  # Node build script (ESM)
├── data/               # generated at build time
│   ├── news.json
│   └── horoscope.json
├── design.md           # Digital Newsprint design system spec
└── TASK_LIST.md        # project status (mostly complete)
```

No `README` exists. `design.md` and `TASK_LIST.md` are the primary docs.

## Commands

```bash
npm install          # installs fast-xml-parser (only dependency)
npm run build        # fetches 3 RSS feeds + generates horoscope → writes data/
npm run serve        # npx serve . (local preview on http://localhost:3000)
```

`"type": "module"` — build script uses ES module syntax.

No linter, formatter, typechecker, or test framework exists.

## CI/CD (GitHub Actions)

Defined in `.github/workflows/build.yml`:
- Triggers: every 6 hours (cron `0 */6 * * *`), push to `main`, manual dispatch
- Runs `npm ci` → `npm run build` → `touch .nojekyll` → deploys *entire repo root* to `gh-pages` branch via `peaceiris/actions-gh-pages`
- `publish_dir: .` — the full repo root is published (no subdirectory)
- `force_orphan: true` — `gh-pages` branch has no merge history
- Deployment branch: `gh-pages` (exists, contains built site)

## Data sources

| Source | Type | Language |
|---|---|---|
| Yahoo 國際新聞 (RSS) | `tw.news.yahoo.com/rss/` | zh |
| BBC World News (RSS) | `feeds.bbci.co.uk/news/world/rss.xml` | en |
| BBC 香港與亞太 (RSS) | `feeds.bbci.co.uk/news/world/asia/rss.xml` | zh |

Build script uses `fast-xml-parser` with `ignoreAttributes: false` for RSS/Atom parsing.
Uses `Promise.allSettled` — one failed source does not break the build.

Horoscope data is generated algorithmically (date-seeded PRNG), not from an external API.

## Frontend key details

- Language: `zh-Hant` (Traditional Chinese)
- 4 Google Fonts: Playfair Display, Source Serif 4, Outfit, JetBrains Mono
- Responsive breakpoints: 1024px, 720px, 540px
- Section nav uses IntersectionObserver for active state tracking
- News filterable by 4 category tabs (All / Yahoo International / BBC World / Hong Kong News)
- Articles limited to 30, sorted by `pubDate` descending
- Horoscope cards: click-to-expand detail view (love, career, wealth)

## Git conventions

Commits on `main` use emoji prefixes (🎉, ♻️, 📝, 📰, ✨, 💄, etc.).

## Deployment note

The CI action pushes the *entire repository root* (including `node_modules/`, `scripts/`, `design.md`, etc.) to the `gh-pages` branch. This is intentional for the `peaceiris/actions-gh-pages` approach — only needed files are served, but it means the gh-pages branch contains more than just the published site.
