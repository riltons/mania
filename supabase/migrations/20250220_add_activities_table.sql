-- Create activities table
create table if not exists public.activities (
    id uuid default gen_random_uuid() primary key,
    type text not null,
    description text not null,
    metadata jsonb default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete cascade not null
);

-- Drop existing policies
drop policy if exists "Users can view activities" on public.activities;
drop policy if exists "Authenticated users can create activities" on public.activities;

-- Add RLS policies
alter table public.activities enable row level security;

-- Policy to allow users to view activities
create policy "Users can view activities"
    on public.activities
    for select
    using (true);

-- Policy to allow authenticated users to create activities
create policy "Authenticated users can create activities"
    on public.activities
    for insert
    with check (auth.uid() = created_by);

-- Drop existing indexes
drop index if exists activities_created_by_idx;
drop index if exists activities_type_idx;
drop index if exists activities_created_at_idx;

-- Add indexes
create index activities_created_by_idx on public.activities(created_by);
create index activities_type_idx on public.activities(type);
create index activities_created_at_idx on public.activities(created_at desc);