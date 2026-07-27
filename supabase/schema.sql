-- Run this in Supabase Dashboard > SQL Editor.
create table if not exists public.faculty_profiles (id uuid primary key references auth.users(id) on delete cascade, role text not null default 'faculty' check (role = 'faculty'), created_at timestamptz not null default now());
create table if not exists public.cms_content (id bigint generated always as identity primary key, module text not null check (module in ('about', 'academics', 'admission', 'career', 'gallery')), title text not null, body text, image_url text, sort_order integer not null default 0, is_published boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create or replace function public.is_faculty() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.faculty_profiles where id = auth.uid()) $$;
create or replace function public.create_faculty_profile() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.faculty_profiles (id) values (new.id); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_faculty_profile();

alter table public.faculty_profiles enable row level security;
alter table public.cms_content enable row level security;
create policy "Faculty can see their profile" on public.faculty_profiles for select to authenticated using (id = auth.uid());
create policy "Everyone can read published content" on public.cms_content for select to anon, authenticated using (is_published = true);
create policy "Faculty can manage content" on public.cms_content for all to authenticated using (public.is_faculty()) with check (public.is_faculty());

insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true) on conflict (id) do update set public = true;
create policy "Anyone can view gallery images" on storage.objects for select to anon, authenticated using (bucket_id = 'gallery');
create policy "Faculty can upload gallery images" on storage.objects for insert to authenticated with check (bucket_id = 'gallery' and public.is_faculty());
create policy "Faculty can update gallery images" on storage.objects for update to authenticated using (bucket_id = 'gallery' and public.is_faculty());
create policy "Faculty can delete gallery images" on storage.objects for delete to authenticated using (bucket_id = 'gallery' and public.is_faculty());

-- In Authentication > Providers > Email, disable public sign-ups. Create/invite faculty from the Supabase Dashboard.
