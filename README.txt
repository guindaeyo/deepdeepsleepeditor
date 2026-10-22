DEEP DEEP SLEEP EDITOR — V193 TRUE CENTRAL PREVIEW

Replace these files together:
- index.html
- style.css
- script.js
- cloud-config.js
- cloud-bridge.js

V193 preview rules:
- every editor iframe is intercepted centrally
- first load only: one real srcdoc navigation
- typing: DOM morph only, no iframe reload
- width measured once and kept stable while typing
- no zoom reset / no scale pulse on keystrokes
- full code width fits horizontally
- long code scrolls vertically inside preview
- scrollbar remains invisible
- BBCode renders in preview

After upload, hard refresh once (Ctrl+F5).
