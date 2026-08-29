alter table organizations add column if not exists membership_status text not null default 'unclaimed'
  check (membership_status in ('unclaimed','applied','member','inactive'));

create table organization_billing (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  fiscal_year int not null,
  amount int not null,
  status text not null default 'unbilled'
    check (status in ('unbilled','invoiced','paid','overdue','waived')),
  invoiced_at timestamptz,
  paid_at timestamptz,
  payment_method text check (payment_method in ('bank_transfer','stripe','waived')),
  note text,
  created_at timestamptz default now(),
  unique (organization_id, fiscal_year)
);

alter table organization_billing enable row level security;
create policy "staff manage billing" on organization_billing
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('staff'))
  );

create or replace function admin_issue_invoices(p_fiscal_year int, p_amount int)
returns void as $$
begin
  insert into organization_billing (organization_id, fiscal_year, amount, status, invoiced_at)
  select id, p_fiscal_year, p_amount, 'invoiced', now()
  from organizations
  where membership_status = 'member'
  on conflict (organization_id, fiscal_year) do nothing;
end;
$$ language plpgsql security definer;

create or replace function admin_deactivate_overdue(p_fiscal_year int)
returns void as $$
begin
  update organization_billing
  set status = 'overdue'
  where fiscal_year = p_fiscal_year and status = 'invoiced' and invoiced_at < now() - interval '90 days';

  update organizations
  set membership_status = 'inactive'
  where id in (
    select organization_id from organization_billing
    where fiscal_year = p_fiscal_year and status = 'overdue'
  );
end;
$$ language plpgsql security definer;
