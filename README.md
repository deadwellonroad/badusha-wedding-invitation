# Mohamed Badusha & Mumthas Nadeera — Wedding Invitation

Production-ready static wedding invitation for the reception on Sunday, 30 August 2026 at Planet Auditorium.

Production site: https://badusha-wedding-invitation.pages.dev/

## Project structure

- `public/` — the only Cloudflare Pages deployment output; contains `index.html`, `admin.html`, the calendar file, styles, scripts, and optimized images.
- `backend/` — Google Apps Script source for the family-owned RSVP Sheet. Never deploy this folder as static content.
- `docs/` — deployment, RSVP setup, audit, testing, and exact image allocation notes.
- `images/` — original high-resolution source photographs and story frames, retained locally outside the public site and Git history; production WebP derivatives are committed under `public/`.
- `data/` — obsolete handoff copies and the previous release ZIP; intentionally excluded from Git because it contains superseded code and legacy credentials.

There is no build step or paid dependency. To preview locally, serve `public/` with any static HTTP server. Do not open the files directly with `file://` when testing sharing, downloads, or browser security behavior.

Start with [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/RSVP_SETUP.md](docs/RSVP_SETUP.md).
