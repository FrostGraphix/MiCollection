-- =========================================================================
-- MiCollections Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- Enable uuid extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  address text,
  state text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categories Table
create table if not exists public.categories (
  id text primary key,
  name text not null,
  blurb text not null,
  art text[] not null,
  colors text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Products Table
create table if not exists public.products (
  id integer primary key,
  name text not null,
  cat text references public.categories(id) on delete set null,
  price numeric not null,
  was numeric,
  art text not null,
  colors text[] not null,
  sizes text[],
  badge text,
  "desc" text not null,
  feat text[] not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Orders Table
create table if not exists public.orders (
  id text primary key, -- e.g. MC-XXXXXX
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text not null,
  email text not null,
  address text not null,
  state text not null,
  landmark text,
  delivery_label text not null,
  eta text not null,
  pay_label text not null,
  payment_method text not null, -- 'paystack', 'transfer', 'pod'
  payment_status text default 'pending' not null, -- 'pending', 'paid', 'failed'
  order_status text default 'received' not null, -- 'received', 'confirmed', 'shipped', 'delivered'
  subtotal numeric not null,
  fee numeric not null,
  discount numeric default 0 not null,
  total numeric not null,
  paystack_ref text,
  note text,
  carrier text,
  tracking_number text,
  rider_name text,
  rider_phone text,
  dispatch_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure explicit courier & dispatch columns exist if table was already created
alter table public.orders add column if not exists carrier text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists rider_name text;
alter table public.orders add column if not exists rider_phone text;
alter table public.orders add column if not exists dispatch_note text;

-- 5. Order Items Table
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  product_id integer references public.products(id) on delete set null,
  name text not null,
  price numeric not null,
  qty integer not null,
  art text not null,
  color text not null,
  opt text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- -------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles: Users can read and update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Categories & Products: Public read access
create policy "Categories are viewable by everyone" on public.categories
  for select using (true);

create policy "Products are viewable by everyone" on public.products
  for select using (is_active = true);

-- Orders: Users can read their own orders; public/guest can create orders
create policy "Anyone can insert orders" on public.orders
  for insert with check (true);

create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);

-- Order Items: Anyone can insert, users can view
create policy "Anyone can insert order items" on public.order_items
  for insert with check (true);

create policy "Users can view order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where public.orders.id = public.order_items.order_id
      and public.orders.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- Trigger to automatically create a profile on user signup
-- -------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
