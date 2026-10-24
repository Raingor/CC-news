# Design System — AI Models News Hub

## Concept Overview

**"Digital Newsprint"** — A warm editorial/magazine-style interface inspired by high-end printed technology publications. Paper-yellow backgrounds, refined serif typography, and clean whitespace-heavy layout. Transforms a tech news dashboard into an editorial reading experience — like flipping through a printed technology journal.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#f5f0e6` | Page background — aged cream paper |
| `--surface` | `#faf6ef` | Card/masthead background — lighter paper |
| `--surface2` | `#efe8d8` | Badge/pill background — slightly darker |
| `--border` | `#d4c9b0` | Borders — warm beige |
| `--text` | `#2c2416` | Body text — warm brown-black |
| `--text2` | `#8a7a64` | Secondary text — muted warm brown |
| `--accent` | `#c43a24` | Accent — deep magazine masthead red |
| `--link` | `#8b3a2a` | Link color — dark brick red |
| `--green` | `#3a7a4a` | Status OK |
| `--teal` | `#3a7a8a` | Language badge (zh) |
| `--red` | `#c43a24` | Error / FAIL |

---

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Logo / Masthead | Playfair Display | 800 italic | `h1` site title |
| Article headlines | Playfair Display | 700 | Article titles in cards |
| Body text | Source Serif 4 | 400 | Article descriptions |
| UI labels | Outfit | 500–600 | Controls, status, section headers |
| Data / Meta | JetBrains Mono | 400–500 | Source names, dates, counts |

- Base font size: `16px`
- Body line-height: `1.7`
- Article title: `22px` (desktop), `16px` (mobile)
- UI labels: `10–12px`, uppercase, letter-spaced

---

## Layout

- **Container max-width**: `1200px`, centered with `24px` side padding
- **Article grid**: 3 columns (`repeat(3, 1fr)`), `20px` gap
- **Responsive breakpoints**:
  - `≤720px`: single column layout, stacked controls
  - `≤540px`: 1-column article grid, smaller fonts
- **Header**: Full-width masthead with decorative bottom border (2px solid text color)
- **Cards**: Rounded corners (`6px`), subtle border, hover shadow lift

---

## Components

### Masthead Header
- Supertitle label ("AI INTELLIGENCE") in 11px Outfit uppercase, accent red
- Title in Playfair Display 800 italic, 36px
- Status indicator with pulsing green dot
- Article count in JetBrains Mono
- Refresh button with rotating SVG icon on loading

### Controls Bar
- Sticky at top, subtle bottom border
- Search input with italic placeholder
- Language toggle pills (All / EN / 中文) — segmented control style
- Source filter pills with underline hover animation
- Source status line (OK/FAIL count)

### Article Cards
- Headline in Playfair Display 700, linked
- Meta line: source (JetBrains Mono, uppercase, accent red), language badge, date
- Description in Source Serif 4, clamped to 2 lines
- Fade-in stagger animation on load (`0.03s` delay per item)

### Animation
- Article items: `fadeIn + translateY(8px)` over `0.35s`, staggered
- Source pills: underline expand on hover (`::after` pseudo-element)
- Status dot: gentle pulse (`2s` ease-in-out)
- Refresh button: spin animation on loading
- Article card hover: subtle border color shift + box-shadow

---

## Voice & Tone

- Editorial, refined, warm
- Tech intelligence presented with magazine gravitas
- Chinese/English bilingual support with clear language labeling
- Error states shown gracefully but minimally (toast, source status)
