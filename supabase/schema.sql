-- ============================================================
-- LMS TEMPLATE — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- 1. PROFILES (extends auth.users with role + display info)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'student');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CATEGORIES (fully configurable from admin panel — no hardcoded list)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 3. COURSES
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  thumbnail_url text,
  -- pricing: a course can be bought individually (price_myr) and/or included in subscription
  price_myr numeric(10,2) default 0,          -- 0 = free
  included_in_subscription boolean not null default true,
  is_published boolean not null default false,
  instructor_name text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 4. LESSONS / VIDEOS (each course has many lessons)
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  video_type text not null default 'youtube' check (video_type in ('youtube', 'bunny', 'direct_url')),
  video_url text not null,           -- youtube watch/embed URL, bunny video id/url, or direct mp4 url
  is_free_preview boolean not null default false, -- viewable without purchase (e.g. intro lesson)
  pdf_note_url text,                 -- optional downloadable PDF notes
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 5. SUBSCRIPTION PLANS (configurable pricing tiers)
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,                -- e.g. "Annual All-Access", "Lifetime"
  plan_type text not null check (plan_type in ('annual', 'lifetime', 'monthly')),
  price_myr numeric(10,2) not null,
  duration_days int,                 -- null = lifetime (no expiry)
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- 6. USER SUBSCRIPTIONS (active subscription per user, if any)
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  started_at timestamptz,
  expires_at timestamptz,            -- null = lifetime
  created_at timestamptz not null default now()
);

-- 7. COURSE PURCHASES (one-time per-course purchase, independent of subscription)
create table if not exists public.course_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  price_paid_myr numeric(10,2),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- 8. PAYMENT TRANSACTIONS (raw log of every Bayarcash payment intent/callback)
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  order_number text not null unique,     -- our internal order ref, sent to Bayarcash
  purchase_type text not null check (purchase_type in ('course', 'subscription')),
  reference_id uuid not null,            -- course_id or plan_id depending on purchase_type
  amount_myr numeric(10,2) not null,
  bayarcash_payment_intent_id text,
  bayarcash_status text,                 -- raw status string/code from callback
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  raw_callback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. LESSON PROGRESS (basic watched/completed tracking)
create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  last_watched_at timestamptz default now(),
  primary key (user_id, lesson_id)
);

-- 10. SITE NOTICES (the "tambah notis" requirement — admin-editable announcements)
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.course_purchases enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.notices enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles: user can read/update own row; admin can read/update all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- categories: public read, admin write
create policy "categories_public_read" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- courses: public read (published only), admin full access
create policy "courses_public_read_published" on public.courses
  for select using (is_published = true or public.is_admin());
create policy "courses_admin_write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

-- lessons: public can see metadata of free-preview lessons; full row visible if course purchased/subscribed (checked in app layer for video_url gating too)
create policy "lessons_public_read" on public.lessons for select using (true);
create policy "lessons_admin_write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

-- subscription plans: public read active plans, admin write
create policy "plans_public_read" on public.subscription_plans for select using (is_active = true or public.is_admin());
create policy "plans_admin_write" on public.subscription_plans for all using (public.is_admin()) with check (public.is_admin());

-- user_subscriptions: user sees own, admin sees all
create policy "user_subs_select_own_or_admin" on public.user_subscriptions
  for select using (auth.uid() = user_id or public.is_admin());
create policy "user_subs_admin_write" on public.user_subscriptions for all using (public.is_admin()) with check (public.is_admin());

-- course_purchases: user sees own, admin sees all
create policy "purchases_select_own_or_admin" on public.course_purchases
  for select using (auth.uid() = user_id or public.is_admin());
create policy "purchases_admin_write" on public.course_purchases for all using (public.is_admin()) with check (public.is_admin());

-- payment_transactions: user sees own, admin sees all. Writes only via service role (Netlify functions), never from browser.
create policy "tx_select_own_or_admin" on public.payment_transactions
  for select using (auth.uid() = user_id or public.is_admin());

-- lesson_progress: user manages own rows
create policy "progress_own" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notices: public read active, admin write
create policy "notices_public_read" on public.notices for select using (is_active = true or public.is_admin());
create policy "notices_admin_write" on public.notices for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- SEED DATA (placeholders — replace via Admin Panel later)
-- ============================================================
insert into public.subscription_plans (name, plan_type, price_myr, duration_days, sort_order) values
  ('Annual All-Access', 'annual', 99.00, 365, 1),
  ('Lifetime All-Access', 'lifetime', 399.00, null, 2)
on conflict do nothing;

insert into public.categories (name, slug, sort_order) values
  ('Video Kuliah', 'video-kuliah', 1),
  ('Ceramah', 'ceramah', 2),
  ('Kursus Atas Talian', 'kursus-atas-talian', 3)
on conflict (slug) do nothing;

insert into public.notices (title, body) values
  ('Selamat Datang', 'Ini demo LMS template — placeholder branding. Tukar kandungan ini dari Admin Panel.')
on conflict do nothing;

-- ============================================================
-- IMPORTANT: to make a user an admin after they register, run:
-- update public.profiles set role = 'admin' where id = 'THEIR-AUTH-USER-UUID';
-- (find the UUID in Supabase Dashboard > Authentication > Users)
-- ============================================================
