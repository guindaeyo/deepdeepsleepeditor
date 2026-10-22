DEEP DEEP SLEEP CODE SHOP — V213 INTERACTIVE-FIRST

Files to upload/replace:
- index.html
- style.css
- script.js
- cloud-config.js
- cloud-bridge.js

What changed in V213 (performance only):
- The 1.2 MB local enhancement script is no longer executed on the home page at startup.
- It loads on the first Roleplay / Profile / Review / Commission / Edit interaction.
- Direct editor/protected/view deep-links still load the enhancement script immediately.
- Draft/BBCode/word-counter setup is lazy per active editor instead of scanning every editor at startup.
- Existing V212 preview behavior and cloud files are retained.

After replacing files, hard refresh once (Ctrl+F5).
