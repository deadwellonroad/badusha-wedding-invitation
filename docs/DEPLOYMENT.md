# Cloudflare Pages Deployment

This repository is a plain static HTML/CSS/JavaScript site. Only `public/` is deployed; `backend/`, `docs/`, `images/`, and `data/` must not be public site output.

## Required repository state

- Push this repository to GitHub.
- The production branch must be `main`.
- Confirm `public/index.html` exists at the top of the build output.
- Complete `docs/RSVP_SETUP.md` and commit the `/exec` endpoint before inviting guests.

## Cloudflare dashboard steps

1. Sign in to Cloudflare.
2. Open **Workers & Pages**.
3. Choose **Create** (some dashboard versions label this **Create application**).
4. Choose **Pages**.
5. Choose **Connect to Git**.
6. Select **GitHub**, install/authorize the Cloudflare Git integration if prompted, and select this repository.
7. In **Set up builds and deployments**, use:
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Root directory:** leave blank / repository root
   - **Build output directory:** `public`
   - **Build command:** leave blank. If the current UI requires a command, use `exit 0`.
8. Choose **Save and Deploy**.
9. Wait for the deployment to finish, then open the assigned `https://<project-name>.pages.dev/` address.

Cloudflare's current static HTML documentation supports a blank no-build configuration and also documents `exit 0` as the optional static build command. Git integration automatically deploys future pushes and creates preview deployments for non-production branches or pull requests.

Official references: [Cloudflare Pages static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [Git integration setup](https://developers.cloudflare.com/pages/get-started/git-integration/), and [GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/).

## Post-deployment verification

1. Open the `*.pages.dev` root and confirm the invitation loads.
2. Open `/admin.html` and confirm it remains outside the public invitation flow and is not indexed.
3. Open `/wedding.ics` and verify the calendar event.
4. Submit and update a real RSVP, then verify the central Sheet and dashboard.
5. Test the map and sharing buttons on a phone opened from WhatsApp.
6. Replace the relative social metadata in `public/index.html` with the verified absolute production values:

```html
<meta property="og:url" content="https://YOUR-PROJECT.pages.dev/">
<meta property="og:image" content="https://YOUR-PROJECT.pages.dev/assets/story/story_frame_06.webp">
<meta name="twitter:image" content="https://YOUR-PROJECT.pages.dev/assets/story/story_frame_06.webp">
```

Commit and push that change. A push to `main` triggers a new production deployment automatically.

## Expected URLs

- Invitation: `https://<project-name>.pages.dev/`
- Family dashboard: `https://<project-name>.pages.dev/admin.html`

Do not describe the site as deployed until both URLs have been opened and verified successfully.
