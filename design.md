# Snip Design System

Borrowed visual language: dark-first, warm gradient glow, pill-shaped chat input,
generous breathing room. Inspired by lovable.dev's aesthetic.

---

## Color tokens

```
--bg            #09090b    near-black zinc (page canvas)
--surface       #18181b    zinc-900 (cards, input bg)
--surface-hi    #27272a    zinc-800 (hover states, raised surface)

--text          #fafafa    almost white (primary text)
--muted         #71717a    zinc-500 (labels, captions, sublines)
--placeholder   #52525b    zinc-600 (input placeholder)

--accent-1      #fb923c    orange-400
--accent-2      #f472b6    pink-400
--accent-3      #a78bfa    violet-400
--accent-grad   linear-gradient(135deg, #fb923c, #f472b6, #a78bfa)

--glow-a        rgba(251,146, 60,0.18)   orange tint (hero glow, left)
--glow-b        rgba(244,114,182,0.14)   pink tint   (hero glow, centre)
--glow-c        rgba(167,139,250,0.10)   violet tint (hero glow, right)

--border        rgba(255,255,255,0.08)   subtle card / input border
--border-focus  rgba(255,255,255,0.20)   focused input border
```

---

## Shadows & glow

```
--shadow-card   0 1px 3px rgba(0,0,0,.5), 0 0 0 1px var(--border)
--shadow-glow   0 0 60px 0 rgba(244,114,182,0.15)   (ambient around pill input)
```

Hero background glow (pseudo-element, `position:absolute; inset:0; z-index:0`):
```css
radial-gradient(ellipse 70% 50% at 30% 60%, var(--glow-a), transparent),
radial-gradient(ellipse 60% 50% at 70% 50%, var(--glow-b), transparent),
radial-gradient(ellipse 50% 60% at 50% 80%, var(--glow-c), transparent)
```

---

## Typography

```
--font          'Inter', system-ui, -apple-system, sans-serif
--text-hero     clamp(2rem, 5vw, 3.5rem)   bold, ls -0.03em, gradient fill
--text-sub      1.125rem                   muted colour, normal weight
--text-body     0.9375rem
--text-sm       0.8125rem
--text-xs       0.75rem                    table headers (uppercase, ls 0.04em)
```

---

## Spacing

```
--space-xs  0.5rem
--space-sm  1rem
--space-md  1.5rem
--space-lg  2.5rem
--space-xl  4rem
```

---

## Border radii

```
--radius-pill   9999px   (URL input, button, pill wrapper)
--radius-card   16px     (cards, notices)
--radius-btn    9999px   (same as pill — buttons are always fully rounded)
```

---

## Element mapping

| Snip element         | Design role             | Key rules |
|---|---|---|
| `<header class="hero">` | Page hero | Centered, `padding-top: --space-xl`; `::before` = glow backdrop |
| `h1` in hero | Bold headline | Fluid `--text-hero`; gradient `background-clip: text` |
| `<p>` in hero | Muted subline | `--muted` colour, `--text-sub` size |
| `<section class="input-hero">` | Chat-style input zone | No card chrome; pill row is the centerpiece |
| `.pill-row` | The pill input container | `--surface` bg, `1px solid --border`, `--radius-pill`, `--shadow-glow` |
| `.pill-input` | URL text field | Transparent bg, no border/outline, full flex-grow |
| `.pill-btn` | Primary action | Gradient fill, `--radius-btn`, `font-weight:600` |
| `.notice--error` | Inline API/validation error | Dim red bg + border, `#fca5a5` text |
| `.notice--success` | Returned short link | Dim green bg + border, `#86efac` text |
| `<section class="card">` | Links table container | `--surface` bg, `--border`, `--radius-card`, `--shadow-card` |
| `.card-title` | Section label | Uppercase, `--text-xs`, `--muted` colour |
| `table thead` | Column headers | `--muted`, uppercase, `0.75rem` |
| `table tbody tr:hover` | Row highlight | `background: --surface-hi` |
