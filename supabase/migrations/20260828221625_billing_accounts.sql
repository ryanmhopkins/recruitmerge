create table if not exists public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  subscription_status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_accounts enable row level security;
revoke all on table public.billing_accounts from anon, authenticated;
grant select on table public.billing_accounts to authenticated;

drop policy if exists "Users can read their billing account" on public.billing_accounts;
create policy "Users can read their billing account"
on public.billing_accounts for select
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists billing_accounts_subscription_status_idx
on public.billing_accounts (subscription_status);
