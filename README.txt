Deep Deep Sleep Code Shop — V210 Stable Preview Hotfix
Base: deepdeepsleep-editor-v210-ready.zip

Changed only editor preview behavior:
1. Active editor iframe no longer reloads on every keystroke after its first document load.
2. Central preview no longer removes/reapplies transform/scale on every input.
3. Older V192/V205 editor preview hooks route to the V210 central preview engine.
4. Preview iframe height follows the complete rendered content so long code can scroll vertically in the left preview.
5. HANS X. FROST RORAIMA house-thread uses the complete .dds-rora-preview-shell, including its top and bottom, instead of measuring only .ddsh-roraima.

Unchanged from V210:
- style.css
- cloud-config.js
- cloud-bridge.js
- navigation/loading architecture
- right-side editor controls
