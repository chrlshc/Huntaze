-- AI Plans and Items
create table if not exists ai_plan (
  id uuid primary key,
  source varchar(32) not null,
  account_id varchar(128) not null,
  created_at timestamptz not null default now(),
  raw jsonb not null
);
create index if not exists idx_ai_plan_account_created on ai_plan(account_id, created_at desc);

create table if not exists ai_plan_item (
  id uuid primary key,
  plan_id uuid not null references ai_plan(id) on delete cascade,
  platform varchar(32) not null,
  scheduled_at timestamptz,
  content jsonb not null,
  status varchar(24) not null default 'scheduled'
);
create index if not exists idx_item_plan_platform on ai_plan_item(plan_id, platform);
create index if not exists idx_item_scheduled on ai_plan_item(scheduled_at);

-- Insight snapshots & summaries
create table if not exists insight_snapshot (
  id bigserial primary key,
  platform varchar(32) not null,
  account_id varchar(128) not null,
  period_start date not null,
  period_end date not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_snapshot_acc_platform on insight_snapshot(account_id, platform, period_end desc);

create table if not exists insight_summary (
  id bigserial primary key,
  platform varchar(32) not null,
  account_id varchar(128) not null,
  period text not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_summary_acc_platform on insight_summary(account_id, platform, created_at desc);

-- Transactional Outbox
create table if not exists events_outbox (
  id bigserial primary key,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  event_time timestamptz not null default now(),
  payload jsonb not null,
  sent_at timestamptz
);
create index if not exists idx_outbox_unsent on events_outbox(sent_at) where sent_at is null;

