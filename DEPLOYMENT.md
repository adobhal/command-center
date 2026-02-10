# Deploying Command Center to a Public Website

## Option 1: Vercel (Recommended for Next.js)

Vercel is the easiest way to deploy this app—zero config for Next.js.

### Quick deploy

1. **Push your code to GitHub** (if not already):
   ```bash
   git add -A && git commit -m "Ready for deployment" && git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** → Sign in with GitHub.

3. **Import your repo** → New Project → Select `command-center` → Deploy.

4. **Add environment variables** (Project Settings → Environment Variables):

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `NEXTAUTH_SECRET` | Yes | Generate: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | Yes | Set after deploy: `https://your-app.vercel.app` |
   | `DATABASE_URL` | For full features | PostgreSQL connection string |

5. **Redeploy** after setting env vars (Vercel → Deployments → ⋮ → Redeploy).

### Database for showcase

- **With free DB (recommended):** Use [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres) (free tiers). Create a project, copy the connection string, add as `DATABASE_URL`.
- **Without DB:** The app can run for UI showcase—landing, dashboard, and navigation load. APIs return fallback data. Auth and real data will not work (auth config requires a DB).

### Your live URL

After deployment: `https://command-center-xxx.vercel.app` (or your custom domain).

---

## Option 2: Netlify

1. Connect your GitHub repo at [netlify.com](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add Next.js plugin (Netlify detects it).
5. Set `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and  `DATABASE_URL` in Site settings → Environment variables.

---

## Option 3: Railway / Render

For full-stack with database:
- **Railway:** Connect repo, add PostgreSQL, set env vars.
- **Render:** Connect repo, add PostgreSQL, set env vars.

---

## Checklist before going live

- [ ] Set `NEXTAUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`)
- [ ] Generate a strong `NEXTAUTH_SECRET` and add it
- [ ] Add `DATABASE_URL` if you want real data
- [ ] Optional: Add `OPENAI_API_KEY` for AI insights
- [ ] Ensure `.env.local` is in `.gitignore` (it is by default)
