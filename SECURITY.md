# Security Policy — aRacer Lab

## Dependency Management

All runtime dependencies are version-pinned (no `^` or `~`) in `package.json`.
The lockfile (`pnpm-lock.yaml`) is committed to ensure reproducibility and
includes integrity hashes for every package in the dependency tree.

## Package Manager

pnpm v11 is required. pnpm v11 ships the following security controls by default:

| Control | Default | Effect |
|---|---|---|
| `strict-dep-builds` | `true` | Blocks all lifecycle scripts (preinstall / postinstall) in dependencies unless explicitly allowed |
| `minimum-release-age` | `1440` min (24h) | Prevents resolving package versions published within the last 24 hours |
| `blockExoticSubdeps` | `true` | Blocks exotic sub-dependencies |

Install command for CI/CD:
```
pnpm install --frozen-lockfile
```

## Build-time vs Runtime

Build-time tooling (Vite, Tailwind, oxc) does **not** ship to users.
Runtime bundle includes only: React 18.3.1, ReactDOM 18.3.1, Leaflet 1.9.4
(plus application code).

## Content Security Policy

CSP is enforced via `vercel.json` headers:
- `script-src`: `'self'` only — no eval, no inline scripts
- `style-src`: `'self'` + Google Fonts inline
- `img-src`: `'self'` + OpenStreetMap tile servers + `data:` + `blob:`
- `connect-src`: `'self'` only — no external API calls
- `frame-ancestors`: `'none'`

## External Runtime Requests

After deployment, the only external network requests from the app are:
1. **Google Fonts** — JetBrains Mono / IBM Plex Sans (font loading only)
2. **OpenStreetMap tile servers** — map tiles for Track Map view (when GPS data is loaded)

No analytics, no telemetry, no external APIs.

## Reporting

Issues: open at github.com/countZeroNine/aracerLabo/issues
