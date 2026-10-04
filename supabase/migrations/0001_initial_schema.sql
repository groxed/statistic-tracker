-- supabase/migrations/0001_initial_schema.sql

create schema if not exists public;

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'entry_type'
          and typnamespace = 'public'::regnamespace
    ) then
        create type public.entry_type as enum (
            'stat',
            'event'
        );
    end if;
end
$$;

create table if not exists public.stat_sets (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    description text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.entries (
    id uuid primary key default gen_random_uuid(),

    stat_set_id uuid not null
        references public.stat_sets(id)
        on delete cascade,

    entry_date date not null,

    entry_type public.entry_type not null default 'stat',

    value numeric,
    is_checkpoint boolean not null default false,
    event_name text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint entries_event_requires_name
        check (
            entry_type <> 'event'
            or event_name is not null
        ),

    constraint entries_event_cannot_have_value
        check (
            entry_type <> 'event'
            or value is null
        ),

    constraint entries_stat_requires_value
        check (
            entry_type <> 'stat'
            or value is not null
        ),

    constraint entries_event_cannot_be_checkpoint
        check (
            entry_type <> 'event'
            or is_checkpoint = false
        )
);

create index if not exists entries_stat_set_date_idx
    on public.entries (stat_set_id, entry_date);

create index if not exists entries_stat_set_date_desc_idx
    on public.entries (stat_set_id, entry_date desc);

create index if not exists entries_stat_set_type_idx
    on public.entries (stat_set_id, entry_type);

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists stat_sets_updated_at on public.stat_sets;

create trigger stat_sets_updated_at
before update on public.stat_sets
for each row
execute function public.update_updated_at();

drop trigger if exists entries_updated_at on public.entries;

create trigger entries_updated_at
before update on public.entries
for each row
execute function public.update_updated_at();

alter table public.stat_sets enable row level security;
alter table public.entries enable row level security;

-- Temporary development policies for a personal, unauthenticated app.
-- Replace these with authenticated ownership policies before deploying publicly.

drop policy if exists "Allow all access to stat_sets" on public.stat_sets;

create policy "Allow all access to stat_sets"
on public.stat_sets
for all
using (true)
with check (true);

drop policy if exists "Allow all access to entries" on public.entries;

create policy "Allow all access to entries"
on public.entries
for all
using (true)
with check (true);
