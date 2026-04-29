-- Agile Electric CRM — run this in Supabase SQL editor

create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  empresa       text not null default '',
  tipo_proyecto text not null default '',
  zona          text not null default '',
  escala        text not null default 'Chica <30k USD',
  canal         text not null default 'WhatsApp',
  estado        text not null default 'Nuevo',
  fecha_ingreso date not null default current_date,
  ultimo_contacto date,
  notas         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at
  before update on leads
  for each row execute procedure update_updated_at();

-- Enable real-time
alter publication supabase_realtime add table leads;

-- Allow anon read/write (no auth for now)
alter table leads enable row level security;
create policy "allow all anon" on leads for all to anon using (true) with check (true);
