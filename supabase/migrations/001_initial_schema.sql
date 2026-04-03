-- Initial schema for Workspace (Notion Clone)
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspace Members
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member', 'guest')) default 'member',
  joined_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- Pages/Documents
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  parent_id uuid references public.pages(id) on delete cascade,
  title text default 'Untitled',
  icon text,
  cover_image text,
  content jsonb default '{}',
  is_archived boolean default false,
  is_published boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz
);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages(id) on delete cascade not null,
  block_id uuid,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  resolved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- File attachments
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages(id) on delete cascade,
  block_id uuid,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_pages_workspace on public.pages(workspace_id);
create index if not exists idx_pages_parent on public.pages(parent_id);
create index if not exists idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.pages enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;

-- RLS Policies

-- Profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Workspaces
create policy "Users can view workspaces they are members of"
  on public.workspaces for select
  to authenticated
  using (
    id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Users can create workspaces"
  on public.workspaces for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Workspace owners can update"
  on public.workspaces for update
  to authenticated
  using (owner_id = auth.uid());

create policy "Workspace owners can delete"
  on public.workspaces for delete
  to authenticated
  using (owner_id = auth.uid());

-- Workspace Members
create policy "Members can view workspace members"
  on public.workspace_members for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Workspace admins can manage members"
  on public.workspace_members for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
    or user_id = auth.uid()
  );

create policy "Workspace admins can update members"
  on public.workspace_members for update
  to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Workspace admins can remove members"
  on public.workspace_members for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
    or user_id = auth.uid()
  );

-- Pages
create policy "Workspace members can view pages"
  on public.pages for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
    or is_published = true
  );

create policy "Workspace members can create pages"
  on public.pages for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Workspace members can update pages"
  on public.pages for update
  to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Workspace members can delete pages"
  on public.pages for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- Comments
create policy "Workspace members can view comments"
  on public.comments for select
  to authenticated
  using (
    page_id in (
      select id from public.pages
      where workspace_id in (
        select workspace_id from public.workspace_members
        where user_id = auth.uid()
      )
    )
  );

create policy "Workspace members can create comments"
  on public.comments for insert
  to authenticated
  with check (
    page_id in (
      select id from public.pages
      where workspace_id in (
        select workspace_id from public.workspace_members
        where user_id = auth.uid()
      )
    )
  );

create policy "Users can update own comments"
  on public.comments for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own comments"
  on public.comments for delete
  to authenticated
  using (user_id = auth.uid());

-- Attachments
create policy "Workspace members can view attachments"
  on public.attachments for select
  to authenticated
  using (
    page_id in (
      select id from public.pages
      where workspace_id in (
        select workspace_id from public.workspace_members
        where user_id = auth.uid()
      )
    )
  );

create policy "Workspace members can upload attachments"
  on public.attachments for insert
  to authenticated
  with check (
    page_id in (
      select id from public.pages
      where workspace_id in (
        select workspace_id from public.workspace_members
        where user_id = auth.uid()
      )
    )
  );

-- Functions

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-add owner as workspace member
create or replace function public.handle_new_workspace()
returns trigger as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-adding workspace owner as member
drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- Update timestamps
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_workspaces_updated_at
  before update on public.workspaces
  for each row execute procedure public.update_updated_at();

create trigger update_pages_updated_at
  before update on public.pages
  for each row execute procedure public.update_updated_at();

create trigger update_comments_updated_at
  before update on public.comments
  for each row execute procedure public.update_updated_at();
