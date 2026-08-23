-- ==========================================================
-- SUPABASE AUTH & USER PROFILES SCHEMA FOR NUMEROLOGY APP
-- ==========================================================

-- 1. Create public.profiles table (Linked to auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Create public.user_numerology_profiles table (Multi-profiles saved on cloud)
create table if not exists public.user_numerology_profiles (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    birth_date text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.user_numerology_profiles enable row level security;

-- 4. Policies for profiles
create policy "Users can view own profile" 
on public.profiles for select 
using (auth.uid() = id);

create policy "Users can insert own profile" 
on public.profiles for insert 
with check (auth.uid() = id);

create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- 5. Policies for user_numerology_profiles
create policy "Users can view own numerology profiles" 
on public.user_numerology_profiles for select 
using (auth.uid() = user_id);

create policy "Users can insert own numerology profiles" 
on public.user_numerology_profiles for insert 
with check (auth.uid() = user_id);

create policy "Users can update own numerology profiles" 
on public.user_numerology_profiles for update 
using (auth.uid() = user_id);

create policy "Users can delete own numerology profiles" 
on public.user_numerology_profiles for delete 
using (auth.uid() = user_id);

-- 6. Trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
