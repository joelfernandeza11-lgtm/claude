-- Business Management Tool — run this in Supabase SQL editor

-- Daily financial records (one per day, upsertable)
create table if not exists registros_diarios (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null default current_date,
  facturacion   numeric(12,2) not null default 0,
  ganancia      numeric(12,2) not null default 0,
  notas         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(fecha)
);

drop trigger if exists registros_diarios_updated_at on registros_diarios;
create trigger registros_diarios_updated_at
  before update on registros_diarios
  for each row execute procedure update_updated_at();

alter publication supabase_realtime add table registros_diarios;
alter table registros_diarios enable row level security;
create policy "allow all anon" on registros_diarios for all to anon using (true) with check (true);


-- Cumulative costs by category
create table if not exists costos (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null default current_date,
  categoria     text not null,
  descripcion   text not null,
  monto         numeric(12,2) not null,
  created_at    timestamptz not null default now()
);

alter publication supabase_realtime add table costos;
alter table costos enable row level security;
create policy "allow all anon" on costos for all to anon using (true) with check (true);


-- Supplier orders / purchase orders
create table if not exists pedidos (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null default current_date,
  proveedor     text not null default '',
  descripcion   text not null,
  monto         numeric(12,2) not null default 0,
  tipo          text not null default 'inversion',  -- 'gasto' | 'inversion'
  estado        text not null default 'pendiente',  -- 'pendiente' | 'recibido' | 'cancelado'
  created_at    timestamptz not null default now()
);

alter publication supabase_realtime add table pedidos;
alter table pedidos enable row level security;
create policy "allow all anon" on pedidos for all to anon using (true) with check (true);
