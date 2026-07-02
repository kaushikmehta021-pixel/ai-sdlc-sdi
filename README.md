# Snip CLI

Zero-dependency Node.js CLI for the [Snip](https://github.com/kaushikmehta021-pixel/ai-sdlc-sdi) URL shortener.

Requires **Node.js ≥ 18** (global `fetch`).

## Quick start

```sh
# Run directly
node cli.js help

# Shell wrappers — no install needed
./snip help          # bash / zsh (chmod +x snip first)
.\snip.cmd help      # Windows Command Prompt
.\snip.ps1 help      # PowerShell

# Or install globally
npm install -g .
snip help
```

## Commands

| Command | Description |
|---|---|
| `snip add <url>` | Shorten a URL; prints the returned short link |
| `snip ls` | List all links — aligned code / hits / URL table |
| `snip open <code>` | Open a short link in the default OS browser |
| `snip help` | Show usage |

### Examples

```sh
snip add https://example.com/very/long/path
# → http://localhost:3000/aB3xYz

snip ls
# CODE    HITS  URL
# ------  ----  --------------------------------------------------
# aB3xYz     3  https://example.com/very/long/path

snip open aB3xYz
# Opening: https://example.com/very/long/path
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `SNIP_API` | `http://localhost:3000` | Backend base URL |

```sh
SNIP_API=https://snip.example.com snip ls
```

## Error handling

Bad input, unknown codes, and unreachable backends all print to **stderr** and exit with code **1**.
