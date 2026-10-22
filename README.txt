DEEP DEEP SLEEP CODE SHOP — V216

Performance hotfix from V215.

Changed only the local enhancement loader:
- Category navigation (Roleplay/Profile/Review/Commission) never loads the 1.2 MB local bundle.
- Normal navigation and core editors are not blocked.
- Local bundle loads only when an editor that actually depends on it is clicked, or when opening a direct editor hash.
- Preview/layout/BBCode/Cloud/Draft code is unchanged from V215.

Replace index.html, style.css, script.js, cloud-config.js, cloud-bridge.js together.
Then hard refresh once (Ctrl+F5).
