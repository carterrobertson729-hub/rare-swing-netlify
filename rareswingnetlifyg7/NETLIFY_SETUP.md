# Rare Swing on Netlify, with accounts and payments

Accounts and Stripe need Netlify to build the server pieces, so this version must be deployed from GitHub
(dragging a folder onto Netlify Drop only works for the game without accounts).

## 1. Put the files on GitHub
Make a NEW repo (for example `rare-swing-netlify`) and upload everything inside the unzipped folder to the top of it.
`index.html`, `netlify.toml`, `package.json` and the `netlify` and `functions` folders must be at the top level.

## 2. Connect it to Netlify
Netlify > Add new site > Import an existing project > GitHub > pick the repo.
Leave the build command empty. Publish directory: `.` (a single dot). Functions directory: `netlify/functions`
(these are already in `netlify.toml`, so the form usually fills itself in). Deploy.
Accounts work right away. Storage is built in (Netlify Blobs), so there is nothing to create.

## 3. Add your Stripe keys (never in GitHub or chat)
Site configuration > Environment variables > Add a variable:
- `STRIPE_SECRET_KEY` = your Stripe secret key. Use the sk_test_ key first. Mark it Secret.
- `STRIPE_WEBHOOK_SECRET` = the whsec_ value from step 4. Mark it Secret.
Then Deploys > Trigger deploy so the site picks them up.

## 4. Tell Stripe where to send payment news
Stripe (Test mode) > Developers > Webhooks > Add endpoint:
- URL: `https://YOUR-SITE.netlify.app/api/webhook`
- Event: `checkout.session.completed`
Copy its Signing secret into `STRIPE_WEBHOOK_SECRET`.

## 5. Try it
Make an account, open Coins, buy a pack with the test card 4242 4242 4242 4242 (any future date, any CVC).

The daily list refresh (`.github/workflows/daily-refresh.yml`) works the same: it updates files in GitHub and Netlify redeploys.
