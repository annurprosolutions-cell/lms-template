-- Site branding settings (singleton row) so admin can configure
-- logo, site name, hero text and footer org name without touching code.

create table if not exists public.site_settings (
  id int primary key default 1,
    site_name text not null default 'LMS Demo',
      logo_url text default '',
        hero_title text not null default 'Tajuk Utama Anda Di Sini',
          hero_subtitle text not null default 'Belajar sendiri, dimana-mana, bila-bila masa.',
            footer_org_name text not null default 'Nama Organisasi Anda',
              updated_at timestamptz not null default now(),
                constraint site_settings_singleton check (id = 1)
                );

                insert into public.site_settings (id) values (1) on conflict (id) do nothing;

                alter table public.site_settings enable row level security;

                create policy "site_settings_select_all" on public.site_settings for select using (true);

                create policy "site_settings_update_admin" on public.site_settings for update using (public.is_admin()) with check (public.is_admin());

                create policy "site_settings_insert_admin" on public.site_settings for insert with check (public.is_admin());