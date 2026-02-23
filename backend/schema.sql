-- Enable pgvector extension
create extension if not exists vector;

-- Users table (extends Supabase auth.users or standalone if custom)
create table if not exists users (
    id uuid references auth.users not null primary key,
    email text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Resources table
create table if not exists resources (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references users(id) on delete cascade not null,
    type text not null check (type in ('youtube', 'pdf')),
    title text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents for RAG (vector store)
create table if not exists documents (
    id uuid default gen_random_uuid() primary key,
    resource_id uuid references resources(id) on delete cascade not null,
    chunk_text text not null,
    embedding vector(1536) not null
);

-- Flashcards
create table if not exists flashcards (
    id uuid default gen_random_uuid() primary key,
    resource_id uuid references resources(id) on delete cascade not null,
    question text not null,
    answer text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quizzes
create table if not exists quizzes (
    id uuid default gen_random_uuid() primary key,
    resource_id uuid references resources(id) on delete cascade not null,
    question text not null,
    options jsonb not null,
    correct_answer text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat History
create table if not exists chat_history (
    id uuid default gen_random_uuid() primary key,
    resource_id uuid references resources(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant', 'system')),
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for vector similarity search
create index on documents using hnsw (embedding vector_cosine_ops);

-- Keep public.users synced with auth.users
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
