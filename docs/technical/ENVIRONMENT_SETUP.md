# Environment Setup — DISTUDIO Photobooth

**Version:** 1.0  
**Date:** 2026-10-25

---

## Prerequisites

| Tool | Required Version | Verified |
|------|-----------------|---------|
| Node.js | >= 18.x | ✅ v24.14.1 |
| npm | >= 9.x | ✅ v11.11.0 |
| Modern browser | Chrome 100+, Safari 15+, Firefox 110+ | — |

---

## Project Initialization

```bash
# From project root (d:\Project\DISTUDIO\Code)
npx -y sv create . --template minimal --types jsdoc --no-add-ons

# Install Lucide Svelte for icons
npm install lucide-svelte
```

---

## Development

```bash
npm run dev
```

App available at: `http://localhost:5173`

> **Important:** Camera access requires a secure context. On localhost this works automatically. For LAN access from another device, use a self-signed certificate or expose via ngrok/Caddy with HTTPS.

---

## Build

```bash
npm run build      # Produces static/adapter output
npm run preview    # Serves production build locally
```

---

## Project Structure

```
d:\Project\DISTUDIO\Code\
├── docs/                    # Product and technical docs
├── src/
│   ├── app.html            # Root HTML shell
│   ├── app.css             # Global styles and design tokens
│   ├── routes/
│   │   └── +page.svelte   # Application root
│   └── lib/
│       ├── components/    # UI components
│       ├── stores/        # Svelte stores
│       └── utils/         # Camera, capture, canvas, export
├── static/                 # Static assets
├── svelte.config.js
├── vite.config.js
└── package.json
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not available on localhost | Ensure browser is Chrome/Firefox; Safari requires HTTPS |
| `getUserMedia is not a function` | App not served over HTTPS or localhost |
| Port 5173 in use | Run `npm run dev -- --port 5174` |
| Fonts not loading | Check internet connection; fonts loaded from Google CDN |
| Build fails | Run `npm install` first; check for missing files |
