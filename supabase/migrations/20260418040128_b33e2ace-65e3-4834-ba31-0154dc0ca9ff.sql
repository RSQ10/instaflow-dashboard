-- DM Flows
create table public.dm_flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  trigger_keyword text not null default '',
  match_any_word boolean not null default false,
  require_follow boolean not null default true,
  follow_prompt text not null default 'Hey! Make sure you follow me first to get the link 💛 Reply ''DONE'' once you''ve followed!',
  ai_reply_template text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comment_triggers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  post_url text,
  trigger_keyword text not null default '',
  match_any_word boolean not null default false,
  reply_template text not null,
  send_dm boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  instagram_handle text not null,
  source text,
  followed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  instagram_handle text,
  instagram_connected boolean not null default false,
  subscription_plan text not null default 'free',
  updated_at timestamptz not null default now()
);

alter table public.dm_flows enable row level security;
alter table public.comment_triggers enable row level security;
alter table public.leads enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can view own flows" on public.dm_flows for select using (auth.uid() = user_id);
create policy "Users can insert own flows" on public.dm_flows for insert with check (auth.uid() = user_id);
create policy "Users can update own flows" on public.dm_flows for update using (auth.uid() = user_id);
create policy "Users can delete own flows" on public.dm_flows for delete using (auth.uid() = user_id);

create policy "Users can view own triggers" on public.comment_triggers for select using (auth.uid() = user_id);
create policy "Users can insert own triggers" on public.comment_triggers for insert with check (auth.uid() = user_id);
create policy "Users can update own triggers" on public.comment_triggers for update using (auth.uid() = user_id);
create policy "Users can delete own triggers" on public.comment_triggers for delete using (auth.uid() = user_id);

create policy "Users can view own leads" on public.leads for select using (auth.uid() = user_id);
create policy "Users can insert own leads" on public.leads for insert with check (auth.uid() = user_id);
create policy "Users can update own leads" on public.leads for update using (auth.uid() = user_id);
create policy "Users can delete own leads" on public.leads for delete using (auth.uid() = user_id);

create policy "Users can view own settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dm_flows_updated_at before update on public.dm_flows for each row execute function public.set_updated_at();
create trigger comment_triggers_updated_at before update on public.comment_triggers for each row execute function public.set_updated_at();
create trigger user_settings_updated_at before update on public.user_settings for each row execute function public.set_updated_at();