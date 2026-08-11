# RSVP Setup

The invitation works without a central endpoint so the interface can be developed and tested, but those fallback replies exist only in the visitor's browser. Complete this setup before sharing the invitation.

## Create the family Sheet and backend

1. Sign in to the Google account that should own the RSVP list.
2. Create a blank Google Sheet.
3. In the Sheet, choose **Extensions → Apps Script**.
4. Replace the sample code with the complete contents of `backend/rsvp-backend.gs` and save.
5. In Apps Script, open **Project Settings → Script properties**.
6. Add `ADMIN_USERNAME` with the family login username.
7. Add `ADMIN_PASSWORD` with a new password used only for this wedding dashboard.
8. Choose **Deploy → New deployment**.
9. Beside **Select type**, choose **Web app**.
10. Set **Execute as** to the deploying family account.
11. Set access to **Anyone** / **Anyone with the link** as shown by the account's Apps Script UI. Anonymous guests must be able to submit without signing into Google.
12. Deploy and authorize the Sheet access requested by Google.
13. Copy the production Web App URL ending in `/exec` (not the development `/dev` URL).
14. Paste it into `public/assets/rsvp-config.js` as the `endpoint` value.
15. Commit and push that configuration change so Cloudflare Pages redeploys it.

The backend creates an `RSVP` tab with `timestamp`, `name`, `attendance`, `guestCount`, and `phone` columns. Declines always store `0`. A repeat response updates the matching normalized phone number or family/name instead of adding another row. A script lock prevents simultaneous submissions from creating avoidable duplicates.

## Test before sending invitations

1. Open the `/exec` URL in a browser and confirm it returns an online status.
2. Submit an accepted RSVP with three guests.
3. Submit the same phone number again with four guests; confirm the same Sheet row updates.
4. Submit a declined RSVP and confirm the Sheet stores zero guests.
5. Open `/admin.html`, sign in with the Script Property credentials, and verify the totals and rows.
6. Test Refresh, Search, attendance filtering, tappable phone numbers, and CSV export.

## Security model

This is lightweight access control for a private family list, not high-security authentication. The production Sheet read is checked server-side by Apps Script using Script Properties, and `admin.html` is marked `noindex`, but the static admin client and its network traffic are inspectable. Do not reuse the dashboard password for email, banking, or any other account. The JSONP compatibility fallback may place the login values in a request URL, which is another reason to use a unique low-value password.

The local preview login preserves the previous project's client-side hash solely for offline testing. When a real endpoint is configured, Apps Script credentials are authoritative.

Official references: [Apps Script Web Apps](https://developers.google.com/apps-script/guides/web) and [Properties Service](https://developers.google.com/apps-script/guides/properties).
