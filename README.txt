V250 — FOR PROFILE / CODE002 M.Moodboard only

Fix the mismatch between the actual 1100px Moodboard artboard and the
1750px iframe canvas used by V249. The mismatch made the artwork appear
on the left half while the rest of the preview looked blank.

- Fit using the existing data-moodboard-canvas-width (1100px).
- Preserve centered placement, vertical scroll with hidden scrollbar.
- Keep other editors, Controls, save and cloud scripts unchanged.
- JavaScript syntax checked with node --check.
- Visual browser testing was not performed.
