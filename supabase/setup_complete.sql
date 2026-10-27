-- =========================================================================
-- MiCollections — Complete Database Setup (Schema + Seed Data)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yixzvnwerwcfzdhmjgyi/sql/new
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
  for select using (auth.uid() = user_id or user_id is null);

-- Order Items: Anyone can insert, users can view
create policy "Anyone can insert order items" on public.order_items
  for insert with check (true);

create policy "Users can view order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where public.orders.id = public.order_items.order_id
      and (public.orders.user_id = auth.uid() or public.orders.user_id is null)
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

-- =========================================================================
-- Seed Data
-- =========================================================================

-- Insert Categories
insert into public.categories (id, name, blurb, art, colors) values
('wears', 'Wears', 'Dresses, hoodies and everyday pieces for her, him and everyone.', array['dress','hoodie','dress'], array['violet','black','orchid']),
('abayas', 'Abayas', 'Flowing, modest and made to turn heads. Open, butterfly and set styles.', array['abaya','abaya','abaya'], array['black','lilac','plum']),
('shoes', 'Shoes', 'Chunky sneakers, court classics and block heels for every step.', array['sneaker','heel','sneaker'], array['violet','black','ivory']),
('bags', 'Bags', 'Totes that carry the day and chain bags that finish the look.', array['tote','crossbody','tote'], array['plum','black','lilac']),
('jewellery', 'Jewellery', 'Layered chains, pearl drops and stackable rings. Send a screenshot for custom finds.', array['necklace','earrings','ring'], array['gold','silver','gold']),
('electronics', 'Electronics', 'Smart watches, earbuds, power banks and creator lighting.', array['watch','earbuds','ledpanel'], array['black','ivory','black']),
('kitchen', 'Kitchen', 'Pot sets, silicone tools and bottles that make cooking a joy.', array['pot','spoons','bottles'], array['black','violet','orchid']),
('home', 'Household & Care', 'Perfume sets, storage, cushions, candles and everyday care.', array['perfume','cushion','basket'], array['orchid','lilac','gold'])
on conflict (id) do nothing;

-- Insert Products
insert into public.products (id, name, cat, price, was, art, colors, sizes, badge, "desc", feat) values
(1, 'Ankara Wrap Midi Dress', 'wears', 18500, null, 'dress', array['violet','orchid','black'], array['S','M','L','XL'], 'New', 'A flattering wrap silhouette with a cinched waist and a skirt that moves when you do. Made for church, brunch and everything after.', array['Soft, breathable fabric','Wrap front with tie waist','Midi length','Available in S to XL']),
(2, 'Oversized Unisex Hoodie', 'wears', 14000, null, 'hoodie', array['black','violet','ivory'], array['S','M','L','XL','XXL'], null, 'Heavyweight fleece with a roomy fit, deep hood and kangaroo pocket. One hoodie for both genders, easy to layer.', array['Brushed fleece lining','Drawstring hood','Kangaroo pocket','Unisex relaxed fit']),
(3, 'Pleated Satin Dress', 'wears', 21000, 25000, 'dress', array['lilac','ivory','plum'], array['S','M','L','XL'], 'Sale', 'Fluid satin with a soft sheen and a dressy drape. A reliable pick for weddings, dinners and photo days.', array['Satin finish','Flared skirt','Concealed back zip','Dry clean or gentle hand wash']),
(4, 'Nida Open Abaya with Belt', 'abayas', 32000, null, 'abaya', array['black','plum','ivory'], array['52','54','56','58'], 'New', 'Premium nida fabric that stays cool and falls beautifully. Worn open or belted, with wide sleeves and neat cuffs.', array['Premium nida fabric','Detachable belt','Wide sleeves with cuffs','Length sizes 52 to 58']),
(5, 'Dubai Butterfly Abaya', 'abayas', 38500, null, 'abaya', array['lilac','black','orchid'], array['52','54','56','58'], 'Trending', 'The butterfly cut with generous, flowing sleeves that open like wings. Light, graceful and unmistakably Dubai.', array['Butterfly sleeve cut','Lightweight crepe','Free-flowing fit','Length sizes 52 to 58']),
(6, 'Embroidered Prayer Abaya Set', 'abayas', 29000, null, 'abaya', array['ivory','plum','black'], array['One size'], null, 'A two-piece prayer set in soft, breathable fabric with delicate embroidery at the hem. Comfortable for long wear.', array['Two-piece set','Hand-finished embroidery','Soft breathable fabric','Travel friendly']),
(7, 'Chunky Street Sneakers', 'shoes', 28000, null, 'sneaker', array['violet','black','ivory'], array['38','39','40','41','42','43','44','45'], 'New', 'A chunky sole, cushioned insole and a clean upper that goes with jeans, joggers or a skirt. Comfortable all day.', array['Cushioned insole','Non-slip chunky sole','Padded collar','Unisex sizing 38 to 45']),
(8, 'Block Heel Pumps', 'shoes', 19500, null, 'heel', array['black','lilac','ivory'], array['36','37','38','39','40','41','42'], null, 'A stable block heel with an ankle strap that holds you steady from the first dance to the last.', array['Stable block heel','Adjustable ankle strap','Padded footbed','Sizes 36 to 42']),
(9, 'Classic Court Sneakers', 'shoes', 22500, 27000, 'sneaker', array['ivory','black','lilac'], array['38','39','40','41','42','43','44'], 'Sale', 'The clean low-top everyone keeps coming back to. Easy to style, easy to wipe clean.', array['Low-top cut','Wipe-clean upper','Flexible sole','Sizes 38 to 44']),
(10, 'Structured Everyday Tote', 'bags', 24000, null, 'tote', array['plum','black','lilac'], null, 'New', 'A roomy structured tote with sturdy handles and a smart interior. Fits a laptop, lunch and everything else.', array['Fits a 14 inch laptop','Sturdy double handles','Inner zip pocket','Wipe-clean finish']),
(11, 'Mini Chain Crossbody Bag', 'bags', 16500, null, 'crossbody', array['black','orchid','ivory'], null, null, 'Small enough for the essentials, polished enough for an evening out. Chain strap with an adjustable drop.', array['Gold-tone chain strap','Magnetic flap closure','Fits phone, cards, lipstick','Adjustable strap']),
(12, 'Quilted Evening Bag', 'bags', 19000, null, 'crossbody', array['lilac','black','plum'], null, null, 'Soft quilting and a gleaming clasp for dinners, weddings and nights that matter.', array['Quilted texture','Detachable chain','Satin lining','Gold-tone hardware']),
(13, 'Layered Gold Necklace Set', 'jewellery', 7500, null, 'necklace', array['gold','silver'], null, 'New', 'Three delicate chains in graduated lengths with a stone pendant. Wear them together or on their own.', array['Three layered chains','Stone pendant','Tarnish-resistant finish','Adjustable length']),
(14, 'Pearl Drop Earrings', 'jewellery', 5000, null, 'earrings', array['gold','silver'], null, null, 'Lustrous faux pearls on a slim drop. Light enough for all day, dressy enough for any night.', array['Lightweight drop','Hypoallergenic posts','Pearl finish','Gift box ready']),
(15, 'Stackable Stone Ring Set', 'jewellery', 6000, null, 'ring', array['gold','silver'], array['6','7','8','9'], null, 'A set of rings made to be stacked, mixed and swapped. Dainty bands with one statement stone.', array['Set of rings','Mix and stack','Statement stone','Sizes 6 to 9']),
(16, 'Ultra 2 Smart Watch', 'electronics', 25000, null, 'watch', array['black','violet','ivory'], null, 'Popular', 'The Ultra 2 smart watch with a bright display, call and message alerts, fitness tracking and swappable straps. Message us for the full colour range.', array['Bright always-ready display','Call and message alerts','Fitness and sleep tracking','Swappable straps']),
(17, 'Pro LED Light Kit', 'electronics', 8000, null, 'ledpanel', array['black'], null, null, 'A creator-ready LED light kit for content, product shots, video calls and live selling. Lights and prices vary, so message us for the set you need.', array['Dimmable panel','Adjustable stand','Great for content creators','Multiple kits available']),
(18, 'Wireless Earbuds', 'electronics', 14500, null, 'earbuds', array['ivory','black'], null, null, 'True wireless earbuds with a pocket charging case, clear calls and deep bass.', array['Bluetooth connection','Charging case included','Touch controls','Clear call microphone']),
(19, '20,000mAh Power Bank', 'electronics', 17000, 20000, 'powerbank', array['black','violet','ivory'], null, 'Sale', 'Keep every device alive through long days and light-out nights. Fast output and a live battery display.', array['20,000mAh capacity','Fast charging output','Digital level display','Charges several devices']),
(20, 'Non-stick Pot & Pan Set', 'kitchen', 40000, null, 'pot', array['black','violet'], null, 'Popular', 'A complete set with 18, 20 and 22 cm pots and a 24 cm pan, glass-style lids and a spatula. Non-stick, easy to clean and made for everyday cooking.', array['Pots 18, 20 and 22 cm','24 cm frying pan','Non-stick coating','Heat-safe handles']),
(21, '5in1 Silicone Spoon Set', 'kitchen', 6000, null, 'spoons', array['black','violet'], null, null, 'Five silicone cooking tools with sturdy wooden-look handles that will not scratch your pots.', array['Five tools in one set','Heat-resistant silicone','Gentle on non-stick','Easy to wash']),
(22, '4in1 Motivational Bottle Set', 'kitchen', 12000, null, 'bottles', array['violet','orchid'], null, 'New', 'Four bottles in graduated sizes with time markers to keep you hydrated. For both genders, kids and adults.', array['Four sizes in one set','Hourly time markers','Leak-proof lids','BPA-free plastic']),
(23, 'Gift Package Perfume Set', 'home', 10000, null, 'perfume', array['orchid','violet','gold'], null, 'Gift', 'A gift package of mini perfumes in a presentation box. Ready to give or keep for yourself.', array['Multiple fragrances','Presentation gift box','Travel friendly sizes','Great for gifting']),
(24, 'Hair Gummies Duo', 'home', 8000, null, 'gummies', array['orchid','lilac'], null, null, 'Strawberry-flavoured gummy supplements in a twin pack. Message us for ingredients, sizes and current price ranges.', array['Twin pack','Strawberry flavour','Chewable gummies','Ask us for full details']),
(25, 'Manicure & Tongue Scraper Kit', 'home', 2000, null, 'nailkit', array['silver','black'], null, null, 'A compact grooming kit with manicure tools and a stainless tongue scraper. Prices range from 2,000 to 3,500 depending on the set.', array['Manicure tools','Tongue scraper included','Compact carry pouch','Several sets available']),
(26, 'Woven Storage Basket Set', 'home', 13000, null, 'basket', array['gold','ivory'], null, null, 'Sturdy woven baskets in two sizes for laundry, toys, towels and everything that needs a home.', array['Two nesting sizes','Sturdy woven build','Carry handles','Fits shelves and wardrobes']),
(27, 'Plush Cushion Pair', 'home', 11500, null, 'cushion', array['violet','lilac','ivory'], null, 'New', 'Two plush, fillable-soft cushions that make any sofa or bed look finished.', array['Set of two','Soft plush cover','Hidden zip','Machine washable cover']),
(28, 'Scented Candle Trio', 'home', 7000, null, 'candles', array['lilac','ivory','plum'], null, null, 'Three jar candles in graduated sizes for a calm, warm room.', array['Three jar sizes','Long, even burn','Soft fragrance','Reusable jars'])
on conflict (id) do nothing;
