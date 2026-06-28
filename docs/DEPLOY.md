# Deploying to Firebase Hosting

This app is a static Vite build (`dist/`), so hosting is simple: build, then deploy
the folder to Firebase Hosting's global CDN. Configuration already lives in the repo:

- [`firebase.json`](../firebase.json) — serves `dist/`, rewrites all routes to
  `index.html` (single-page app), and sets long-lived immutable caching on the
  content-hashed files in `/assets/**`.
- [`.firebaserc`](../.firebaserc) — maps the `default` alias to the project id
  `ai-spend-inventory`.

## 1. Install the CLI and sign in

```bash
npm install -g firebase-tools
firebase login
```

`firebase login` opens a browser to authenticate with your Google account.

## 2. Create (initialise) the Firebase project

You only do this once. Project ids are **globally unique**, so `ai-spend-inventory`
may already be taken — if so, choose another id and update the `default` value in
[`.firebaserc`](../.firebaserc) to match.

**Option A — CLI:**

```bash
firebase projects:create ai-spend-inventory --display-name "AI Spend Inventory"
```

**Option B — Console:** create the project at
<https://console.firebase.google.com>, then confirm the id locally:

```bash
firebase use ai-spend-inventory   # or: firebase use --add
```

> Hosting is on the free Spark plan — no billing account required for this static
> site.

## 3. Build and deploy

```bash
npm run build                    # type-check + bundle into dist/
firebase deploy --only hosting
```

After a successful deploy the CLI prints the live URLs:

- `https://<project-id>.web.app`
- `https://<project-id>.firebaseapp.com`

## 4. Share a preview before going live (optional)

Preview channels give you a temporary, shareable URL without touching production —
handy for sending the dashboard round for review:

```bash
firebase hosting:channel:deploy review --expires 7d
```

## 5. Custom domain (optional)

In the Firebase console → **Hosting → Add custom domain**, follow the DNS
verification steps, and Firebase provisions an SSL certificate automatically.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Error: Failed to get Firebase project ai-spend-inventory` | The id doesn't exist or you're signed into the wrong account. Run `firebase projects:list`, then `firebase use --add`. |
| Deploy succeeds but the page is blank | Make sure you ran `npm run build` first so `dist/` exists and is current. |
| `403`/permission errors | Re-run `firebase login --reauth`, or confirm your account has the **Editor/Owner** role on the project. |
| Project id already taken | Pick a new id, create it, and update `default` in `.firebaserc`. |

## Re-deploying

Every subsequent release is just:

```bash
npm run build && firebase deploy --only hosting
```
