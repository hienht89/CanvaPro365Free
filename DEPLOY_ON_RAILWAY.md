# 🚀 Deploy CanvaPro365Free to Railway

## Complete Step-by-Step Guide for Non-Technical Users

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Setup Supabase](#2-setup-supabase)
3. [Deploy to Railway](#3-deploy-to-railway)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Get Your Website URL](#5-get-your-website-url)
6. [Connect Supabase to Railway](#6-connect-supabase-to-railway)
7. [Verify Deployment](#7-verify-deployment)
8. [Troubleshooting](#8-troubleshooting)
9. [Maintenance](#9-maintenance)
10. [Cost Information](#10-cost-information)

---

## 1. Prerequisites

### What You Need:
- ✅ **GitHub Account** (free) - [Create one here](https://github.com/signup)
- ✅ **Supabase Account** (free) - [Create one here](https://supabase.com)
- ✅ **This project's source code** (ZIP file or GitHub repo)

### Time Required:
- ⏱️ About **15-20 minutes** for first-time setup

---

## 2. Setup Supabase

Supabase is your database and authentication backend.

### Step 2.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign in with GitHub (recommended) or email
4. Click **"New Project"**
5. Fill in:
   - **Name**: `canvapro365free` (or any name you like)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
6. Click **"Create new project"**
7. ⏳ Wait 1-2 minutes for setup to complete

### Step 2.2: Get Your API Keys

1. In your Supabase project dashboard
2. Click **⚙️ Project Settings** (gear icon, bottom of sidebar)
3. Click **"API"** in the left menu
4. You'll see two important values:

   | Value | What it looks like |
   |-------|-------------------|
   | **Project URL** | `https://abcdefghijkl.supabase.co` |
   | **anon public key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...` |

5. 📝 **Copy both values** - you'll need them in Step 4!

### Step 2.3: Run Database Migrations

The project includes SQL migration files in `/supabase/migrations/`.

**Option A: Using Supabase Dashboard (Easier)**
1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy and paste content from each migration file in order:
   - `20251218040743_71c6dbc9-accc-4fe8-ba90-dcb6a389090a.sql`
   - `20251218040854_787110ab-5e87-415b-bee8-d961f1e986bd.sql`
   - `20251218071857_1c1b5251-d364-48db-9c5c-5fd34c34b724.sql`
   - `20251218191805_76b3e6d5-2a34-472b-8085-58c0f0fc18f5.sql`
   - `20251218193244_5a1075e4-afeb-497b-b50a-39ce2717edb8.sql`
   - `20251221074637_a34aea59-f7d6-4fea-a0ca-0ee52590fe13.sql`
4. Click **"Run"** for each one

**Option B: Using Supabase CLI (Advanced)**
```bash
npx supabase db push
```

---

## 3. Deploy to Railway

Railway hosts your website and makes it accessible online.

### Step 3.1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** (top right)
3. Choose **"Login with GitHub"** ✅ (recommended)
4. Authorize Railway to access GitHub
5. Complete any verification if prompted

### Step 3.2: Deploy the Project

**Method A: Deploy from GitHub (Recommended)**

1. First, upload this project to your GitHub:
   - Go to [github.com/new](https://github.com/new)
   - Name: `canvapro365free`
   - Keep it **Private** or **Public** (your choice)
   - Click **"Create repository"**
   - Upload all project files (drag & drop)

2. In Railway Dashboard:
   - Click **"+ New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your `canvapro365free` repository
   - Railway will auto-detect settings and start building

**Method B: Deploy by Upload (Simpler)**

1. In Railway Dashboard ([railway.app/dashboard](https://railway.app/dashboard))
2. Click **"+ New Project"**
3. Select **"Empty Project"**
4. Click on the empty project card
5. Click **"+ Add Service"** → **"Empty Service"**
6. In the service, go to **"Settings"** tab
7. Under **"Source"**, click **"Upload Repo"**
8. Drag & drop your project folder or select the ZIP file
9. Railway will start building automatically

### Step 3.3: Wait for Build

- ⏳ First build takes **3-5 minutes**
- You can watch progress in **"Deployments"** tab
- Status should change from "Building" → "Deploying" → "Success" ✅

---

## 4. Configure Environment Variables

⚠️ **This step is CRITICAL - your app won't work without it!**

### Step 4.1: Open Variables Settings

1. In Railway, click on your service
2. Go to **"Variables"** tab
3. You'll see an empty variables section

### Step 4.2: Add Required Variables

Click **"+ New Variable"** for each:

| Variable Name | Value | Where to get it |
|--------------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1...` | Supabase → Settings → API |

### Step 4.3: Quick Add Using RAW Editor

1. Click **"RAW Editor"** button
2. Paste this (replace with YOUR values):

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key
```

3. Click **"Update Variables"**
4. Railway will automatically redeploy with new settings

---

## 5. Get Your Website URL

### Step 5.1: Generate Public Domain

1. In Railway, go to your service
2. Click **"Settings"** tab
3. Scroll to **"Networking"** section
4. Find **"Public Networking"**
5. Click **"Generate Domain"**
6. You'll get a URL like: `canvapro365free-production.up.railway.app`

### Step 5.2: Copy Your URL

📝 Copy this URL - you'll need it for the next step!

Example: `https://your-app-name-production.up.railway.app`

---

## 6. Connect Supabase to Railway

For authentication to work, Supabase needs to know your Railway URL.

### Step 6.1: Update Supabase URL Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to your Railway URL:
   ```
   https://your-app-name-production.up.railway.app
   ```

### Step 6.2: Add Redirect URLs

In the same **URL Configuration** page, add these to **Redirect URLs**:

```
https://your-app-name-production.up.railway.app
https://your-app-name-production.up.railway.app/*
https://your-app-name-production.up.railway.app/admin/*
```

Click **"Save"** after adding each one.

---

## 7. Verify Deployment

### Checklist:

- [ ] Open your Railway URL in browser
- [ ] Homepage loads correctly
- [ ] Can switch languages (if enabled)
- [ ] Admin login works at `/admin`
- [ ] No console errors (F12 → Console)

### Test URLs:

| Page | URL |
|------|-----|
| Homepage | `https://your-app.up.railway.app/` |
| Admin Login | `https://your-app.up.railway.app/admin` |
| About Page | `https://your-app.up.railway.app/about` |

---

## 8. Troubleshooting

### ❌ Build Failed

**Check build logs:**
1. Railway → Deployments tab
2. Click failed deployment
3. View logs for error message

**Common causes:**
- Missing environment variables
- Syntax error in code
- npm dependency issues

**Fix:**
- Ensure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
- Redeploy after fixing

### ❌ White Screen / Nothing Loads

**Causes & Fixes:**
1. **Missing env vars** → Add variables in Railway
2. **Wrong Supabase URL** → Double-check the URL format
3. **Browser cache** → Hard refresh (Ctrl+Shift+R)

### ❌ Authentication Not Working

1. Check Supabase **URL Configuration**
2. Ensure Railway URL is in **Site URL**
3. Ensure Railway URL patterns are in **Redirect URLs**
4. Wait 1-2 minutes for changes to propagate

### ❌ Database Errors

1. Ensure migrations were run in Supabase
2. Check Supabase → Table Editor for tables
3. Verify RLS policies are set up

### 💡 View Logs

1. Railway → Your service
2. Click **"Deployments"** tab
3. Click **"View Logs"** on active deployment
4. Look for error messages

---

## 9. Maintenance

### Update Your App

**If using GitHub:**
1. Push new code to GitHub
2. Railway auto-detects and redeploys

**If using Upload:**
1. Railway → Settings → Source
2. Upload new code
3. Railway rebuilds automatically

### Rollback to Previous Version

1. Railway → Deployments tab
2. Find a working deployment
3. Click **⋮** menu → **"Rollback"**

### Restart Service

1. Railway → Settings
2. Click **"Restart"**

### View Deployment History

1. Railway → Deployments tab
2. See all past deployments with status

---

## 10. Cost Information

### Railway Free Tier

- 💰 **$5 free credits/month**
- ✅ No credit card required
- ✅ Enough for low-medium traffic sites
- ⚠️ Services may sleep after inactivity

### When to Upgrade

Consider upgrading if:
- Your site gets consistent traffic
- You need 24/7 uptime
- Free credits run out mid-month

### Upgrade Options

| Plan | Cost | Benefits |
|------|------|----------|
| Hobby | $5/month | No sleep, more resources |
| Pro | $20/month | Team features, priority support |

---

## ✅ Quick Reference Card

### Required Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1...
```

### Important URLs

| Service | URL |
|---------|-----|
| Railway Dashboard | railway.app/dashboard |
| Supabase Dashboard | supabase.com/dashboard |
| Your Website | `your-app.up.railway.app` |

### Support

- 📖 [Railway Docs](https://docs.railway.app)
- 📖 [Supabase Docs](https://supabase.com/docs)
- 🔧 [Railway Status](https://status.railway.app)
- 💬 Telegram: @sharecanvaprofree

---

## 🎉 Congratulations!

Your CanvaPro365Free website is now live!

**Next Steps:**
1. Create your first admin account
2. Add Canva Pro/Education links
3. Share with your community

---

**Version:** 5.5.0  
**Last Updated:** December 2024
