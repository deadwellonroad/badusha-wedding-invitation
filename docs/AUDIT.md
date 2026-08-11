# Project Audit

Audit date: 11 August 2026

## Files found before production work

The workspace contained two top-level groups:

- `data/` — `index.html`, `admin.html`, `README_CODEX.md`, `CODEX_DEPLOY_PROMPT.txt`, and `wedding_invite_READY_FOR_CODEX.zip`.
- `images/` — three explicitly named photographs, six 1920×1080 desktop story PNGs, and six 1080×1920 mobile story PNGs.

The loose HTML and handoff documents in `data/` are byte-for-byte copies of files inside the ZIP. The ZIP is therefore the only prior packaged release, not a second newer implementation.

The ZIP contained:

- `public/index.html`, `public/admin.html`, `_headers`, `favicon.svg`, `wedding.ics`, and RSVP configuration.
- a Google Apps Script backend.
- deployment, RSVP, frame-replacement, and test notes.
- three WebP photographs and twelve WebP story assets.

No repository metadata, package manager, framework, local font files, additional calendar files, or hidden project version was present. The working folder was not a Git repository and had no Git remote.

## Canonical versus obsolete assets

The three loose, explicitly named photographs are newer and higher-resolution than the packaged WebP copies. They are the canonical sources for the hero, closing portrait, and venue.

The loose numbered story sets are the final six-frame sequence. They match the required narrative and preferred aspect ratios. In the packaged release:

- desktop frame 03 duplicated frame 02;
- desktop frames 04 and 05 duplicated each other and were very short 1536×256 composites;
- desktop frame 06 was another 1536×256 placeholder composite;
- multiple mobile frames were repeated split-screen work-world placeholders.

Those packaged frames are obsolete and are not used in production.

## Previous functionality

The previous invitation used a full-screen opening gate, an editorial family section, an Islamic blessing transition, a 650-viewport-height sticky six-frame story, a reception section, countdown, RSVP form, sharing, and a separate admin page.

RSVP submissions were saved locally and optionally posted to a Google Apps Script `/exec` endpoint. Local and Sheet responses were upserted by normalized phone number or name. The decline path stored zero guests, although the old visual control displayed `1` while disabled. The old POST used `no-cors`, so it could not inspect the backend response.

The old admin page used a client-side hash as lightweight access control and sent credentials to the Apps Script to read the central Sheet, with a JSONP fallback. Its dashboard already included summary counts, charts, search, filter, refresh, tappable phone links, and CSV export.

## Production decisions

- Keep plain HTML, CSS, and JavaScript; no framework or build tool.
- Separate public invitation, admin, and shared RSVP configuration.
- Keep backend source outside `public/` and move admin credentials to Apps Script Script Properties.
- Preserve the proven sticky-scroll story concept with requestAnimationFrame throttling and a complete reduced-motion layout.
- Load only the mobile or desktop story source selected by `<picture>` and lazy-load every story image below the fold.
- Retain all original source images outside the deployment folder and Git history. The originals contain embedded editing metadata; the stripped production WebP derivatives are the shareable repository assets.

See [IMAGE_ALLOCATION.md](IMAGE_ALLOCATION.md) for the exact file mapping.
