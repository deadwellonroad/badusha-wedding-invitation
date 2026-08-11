# Production Test Record

Tested locally on 11 August 2026 over HTTP before the production commit.

## Passed automated checks

- JavaScript syntax: public invitation, admin dashboard, test script, and Apps Script backend.
- Authoritative names, date, time, venue, Hijri date, families, addresses, countdown target, and map URL.
- Six desktop and six mobile story references with no missing frame.
- All 37 deployable local URLs returned HTTP 200, including the root, admin page, calendar, manifest, icons, scripts, styles, and images.
- Every WebP and PNG decoded successfully.
- No Google Apps Script source exists under `public/`.
- No clear-text legacy password or hard-coded backend credential exists under `public/`.
- Calendar start/end timezone, title, location, and map URL.
- Backend validation, decline-to-zero rule, Script Property credentials, Sheet lock, and upsert logic.

Run the repeatable audit with:

```text
node tests/audit.mjs
```

## Passed browser checks

- Opening invitation at 360×800, 390×844, 430×932, 768×1024, 1366×768, and 1920×1080.
- No horizontal overflow at any tested viewport; both opening actions remain inside short screens.
- Opening button unlocks scrolling, hides the gate, and exposes the invitation.
- Hero, family section, groom-first ordering, Arabic blessing, portrait, reception, venue image, countdown, RSVP, and closing/share sections render responsively.
- Mobile selected only the 1080×1920 story sources; desktop selected only the 1920×1080 sources.
- All six story states were reached by native scrolling with crossfades and no scroll lock.
- Initial mobile load requested only the responsive hero plus CSS/JS/config/favicon; story, portrait, and venue images were requested only after scrolling near them.
- Decline disables the guest control and sets its value to `0`.
- Invalid name and phone inputs show field validation plus a visible form error state.
- Decline submission produced a success state.
- Re-submitting the same family as accepted with three guests updated the local record rather than creating a second dashboard row.
- Admin login, five metrics, infographic, mobile response card, search, attendance filter, refresh, and logout.
- Reconciled local dashboard result: 1 response, 1 accepted, 3 expected people, 0 declined, average party size 3.0.
- No unexpected console errors; the only console message is the intentional setup warning for the unconfigured `/exec` endpoint.

The CSS reduced-motion branch was source-audited: it removes transitions, converts the sticky story into six normally scrolling figures, and keeps every frame caption visible.

## Final-host checks still required

- Google Apps Script accepted/update/decline tests against the real Sheet.
- Production admin authentication against Script Properties.
- CSV file download in a normal phone/desktop browser. The in-app test browser did not expose its Blob download event, although the control and generator code loaded without errors.
- Native operating-system share sheet. The WhatsApp URL and copy fallback code were verified, but an automated browser cannot complete a real share-sheet handoff.
- Cloudflare response headers, absolute Open Graph URL/image, WhatsApp unfurl, and live `*.pages.dev` URLs.

These checks require the family-owned Apps Script deployment and Cloudflare authorization described in `RSVP_SETUP.md` and `DEPLOYMENT.md`.
