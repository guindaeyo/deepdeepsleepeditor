DEEP DEEP SLEEP CODE SHOP — V214

Fix only: V213 lazy-loader EDIT click race.
- Landing page stays fast; local script.js is still lazy-loaded.
- First EDIT click is held until script.js finishes loading and handlers are bound.
- The original click is replayed automatically once.
- Commission EDIT waits for deferred commission installers before replay.

Replace the five main files: index.html, style.css, script.js, cloud-config.js, cloud-bridge.js
Then Ctrl+F5 once.
