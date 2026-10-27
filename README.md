# 🛍️ MiCollections — Full-Stack Next.js E-Commerce

> **Every variety. One home.**  
> A high-conversion, full-stack e-commerce store based in FCT Abuja, Nigeria, built with Next.js App Router, Tailwind CSS, Supabase (Database & Auth), and Paystack Payment Gateway.

---

## ✨ Features

- **⚡ Next.js App Router & TypeScript**: Modular architecture with server and client components.
- **🎨 Bespoke Visual Design**: Glassmorphic floating pill navigation, dark/light theme toggle, 3D interactive floating hero cards, sticky category cards, and responsive mobile drawers.
- **🖼️ 23 Procedural Vector Illustrations**: Code-generated multi-angle SVG illustrations with cursor hover zoom lens for all products (dresses, abayas, sneakers, watches, kitchen sets, perfume, etc.).
- **🔐 Supabase Authentication**: User registration, login, and persistent sessions via `@supabase/ssr` cookies.
- **🗄️ Supabase PostgreSQL Backend**: Full relational database schema with Row Level Security (RLS) for profiles, categories, products, orders, and order items.
- **💳 Paystack Payment Gateway**: Online checkout supporting Naira Debit Cards, USSD, Apple Pay, and Bank Transfers, backed by verified webhooks (`/api/webhooks/paystack`) and sandbox fallback testing.
- **📱 WhatsApp Business Integration**:
  - Floating 24/7 WhatsApp assistant with quick questions
  - Direct "Order on WhatsApp" links with pre-filled items and totals
  - "Send a Screenshot" custom sourcing request banner
  - Automated WhatsApp order confirmation links with order reference pills.
- **🛒 Shopping Experience**:
  - Live search overlay with keyboard shortcuts (`/` or `Ctrl+K`)
  - Wishlist saving with animated counters
  - Slide-over cart drawer with upsells and free shipping progress bar (for orders over ₦100,000)
  - Full 3-step checkout with delivery options for Abuja doorstep, nationwide courier, and pickup
  - Order success screen with celebratory canvas confetti and live tracking timeline.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase and Paystack credentials:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (From Supabase Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Paystack (From Paystack Dashboard -> Settings -> API Keys)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# WhatsApp Support
NEXT_PUBLIC_WHATSAPP_PHONE=2348145736483
NEXT_PUBLIC_WHATSAPP_DISPLAY=+234 814 573 6483
NEXT_PUBLIC_SUPPORT_EMAIL=siyakamariam33@gmail.com
```
*(Note: If environment variables are omitted or placeholder, the app automatically runs in sandbox mode with static catalog data and test checkouts so development is never blocked!)*

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Setup (1-Click)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql) to create the tables, RLS policies, and user triggers.
4. Paste and run the contents of [`supabase/seed.sql`](./supabase/seed.sql) to populate all 28 authentic products and 8 categories.
5. In **Authentication -> URL Configuration**, add your site URL (`http://localhost:3000` for local or `https://your-app.vercel.app` for production).

---

## 💳 Paystack Webhook Setup

1. In your Paystack Dashboard, go to **Settings -> API Keys & Webhooks**.
2. Set your **Webhook URL** to:
   ```
   https://your-domain.vercel.app/api/webhooks/paystack
   ```
3. Whenever a payment is completed, Paystack will notify this endpoint, which automatically marks the order as `paid` and `confirmed` in your Supabase database.

---

## 📦 Pushing to GitHub & Deploying to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: MiCollections Next.js with Supabase & Paystack"
git branch -M main
git remote add origin https://github.com/your-username/MiCollection.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your `MiCollection` repository.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to `https://your-deployment-name.vercel.app`)
4. Click **Deploy**. Your e-commerce store is live! 🎉
