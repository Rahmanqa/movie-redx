# 🎬 REDX CINEMA - Production Deployment & Monetization Manual

This guide provides step-by-step instructions for running **REDX CINEMA** locally, launching it live on the internet using GitHub and Render.com for free, and setting up high-revenue monetization (VPN affiliate deals, clean banner networks, and dual audio movie streaming).

---

## 🚀 Part 1: Run Locally on Windows 11 (PowerShell)

### Step 1: Install Dependencies
Open PowerShell in the project directory (`c:\Movies\Movie site`) and run:
```powershell
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```powershell
Copy-Item .env.example .env.local
```

### Step 3: Run the Development Server
```powershell
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
You can immediately browse movies, search, switch between **English and Hindi audio**, select subtitles, and test the custom player.

---

## 🌐 Part 2: Deploy 100% Free to Render.com via GitHub

Render offers free web application hosting with automated HTTPS, custom domain support, and continuous deployment from GitHub.

### Step 1: Initialize Git and Push to GitHub
1. Create an account on [GitHub.com](https://github.com) if you haven't already.
2. Create a new public or private repository named `redx-cinema`.
3. In PowerShell, run:
```powershell
git init
git add .
git commit -m "Initial commit for REDX CINEMA production release"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/redx-cinema.git
git push -u origin main
```

### Step 2: Connect and Deploy on Render.com
1. Go to [Render.com](https://render.com) and log in.
2. Click **New +** &rarr; **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your `redx-cinema` repository.
4. Configure the settings:
   - **Name**: `redx-cinema`
   - **Region**: Closest to your target audience (e.g. Frankfurt, Oregon, Singapore)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following Environment Variables:
   - `NEXT_PUBLIC_SITE_URL` = `https://redx-cinema.onrender.com`
   - `NEXT_PUBLIC_APP_NAME` = `REDX CINEMA`
   - `ADMIN_SECRET_KEY` = `your_strong_admin_secret_key`
   - `ADMIN_EMAIL` = `admin@redxcinema.com`
   - `NEXT_PUBLIC_ADS_ENABLED` = `true`
   - `NEXT_PUBLIC_PRE_ROLL_ENABLED` = `true`
6. Click **Create Web Service**.
Render will build your Next.js application and provide your live URL (e.g. `https://redx-cinema.onrender.com`).

---

## 🗄️ Part 3: Connecting Supabase PostgreSQL (Optional but Recommended)

REDX CINEMA comes with an intelligent hybrid data engine that runs out of the box with offline seed data. To enable cloud user authentication and remote database sync:

1. Create a free account at [Supabase.com](https://supabase.com).
2. Create a new project named `redx-cinema`.
3. Go to the **SQL Editor** tab in Supabase dashboard.
4. Open [`supabase/migrations/00001_initial_schema.sql`](file:///c:/Movies/Movie%20site/supabase/migrations/00001_initial_schema.sql), copy the entire SQL script, paste it into the Supabase SQL editor, and click **Run**.
5. Open [`supabase/seed.sql`](file:///c:/Movies/Movie%20site/supabase/seed.sql), copy and run it in the SQL Editor to seed the bilingual movies and ad placements.
6. Go to **Project Settings &rarr; API** in Supabase and copy:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
7. Add these keys to your Render environment variables or `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## 💰 Part 4: How to Monetize and Make Money from REDX Cinema

You can generate substantial recurring revenue from your streaming audience using legal, high-converting monetization channels:

### 1. 🛡️ High-Ticket VPN & Security Affiliates ($30 - $80+ per sale)
- **Why it works**: Viewers streaming cinema online frequently look for fast, buffer-free VPNs for privacy.
- **Where to sign up**:
  - [NordVPN Affiliate Program](https://nordvpn.com/affiliate/)
  - [ExpressVPN Affiliates](https://www.expressvpn.com/affiliates)
  - [Surfshark Affiliates](https://surfshark.com/affiliate)
- **How to place**: Open `/admin/ads` in your REDX Admin panel and paste your affiliate link in the **Pre-Roll Sponsor** and **Under-Player Banner** slots. Every user who signs up earns you $30 to $80 direct commission!

### 2. 📺 High-CPM Clean Ad Banners ($2 to $6 per 1,000 views)
- Sign up with publisher ad networks:
  - **Monetag** (clean banners, native pop/push, high mobile fill rates)
  - **Adsterra** (instant approval, high CPM)
  - **Google AdSense** (for site content once custom domain is connected)
- Paste your banner graphics and target links into the **Top Leaderboard** and **Under Player** placements in `/admin/ads`.

### 3. 🍿 Amazon Associates Streaming Gear
- Sign up for the [Amazon Associates Program](https://affiliate-program.amazon.com).
- Recommend Soundbars, 4K Smart TVs, and Fire TV streaming sticks in the under-player placement. Earn 4% to 10% on every electronic purchase made through your links.

---

## 🔒 Part 5: Admin Security & Credentials

To access your administrative command center:
1. Visit `https://your-site.onrender.com/admin` or `http://localhost:3000/admin`.
2. Login with `admin@redxcinema.com`.
3. The admin dashboard allows you to:
   - Add new movies with English and Hindi audio stream URLs.
   - Upload or link VTT subtitles.
   - Change sponsor ads, CTA buttons, and skip timers.
   - Add your TMDB API key for automatic poster and overview synchronization.
