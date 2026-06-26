-- ============================================================
--  Doy por Venezuela — Esquema de base de datos (Supabase)
--  Ejecuta TODO este archivo en:  Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1) Tabla principal -----------------------------------------
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('ofrezco','necesito')),
  titulo      text not null,
  categoria   text not null,
  ropa        text default '',
  cantidad    text default '',
  pais        text default '',
  ciudad      text default '',
  dir         text default '',
  lat         double precision,
  lng         double precision,
  cc          text default '',
  tel         text not null,
  nombre      text default '',
  nota        text default '',
  estado      text not null default 'disponible' check (estado in ('disponible','tomado')),
  code        text not null,                 -- código privado para administrar (NUNCA se expone)
  created_at  timestamptz not null default now(),
  taken_at    timestamptz
);

create index if not exists items_created_idx on public.items (created_at desc);
create index if not exists items_estado_idx  on public.items (estado);

-- 2) Seguridad: nadie toca la tabla directo ------------------
alter table public.items enable row level security;
revoke all on public.items from anon, authenticated;

-- 3) Vista pública (igual a la tabla pero SIN el campo 'code')
create or replace view public.items_public as
  select id, tipo, titulo, categoria, ropa, cantidad, pais, ciudad, dir,
         lat, lng, cc, tel, nombre, nota, estado, created_at, taken_at
  from public.items;

grant select on public.items_public to anon, authenticated;

-- 4) Funciones (la única vía para crear/editar) --------------
--    Son SECURITY DEFINER: corren con permisos del dueño y validan las reglas.

-- Publicar
create or replace function public.publish_item(payload jsonb)
returns public.items_public
language plpgsql security definer set search_path = public as $$
declare new_id uuid; out public.items_public;
begin
  insert into public.items
    (tipo, titulo, categoria, ropa, cantidad, pais, ciudad, dir, lat, lng, cc, tel, nombre, nota, code)
  values
    (payload->>'tipo', payload->>'titulo', payload->>'categoria',
     coalesce(payload->>'ropa',''), coalesce(payload->>'cantidad',''),
     coalesce(payload->>'pais',''), coalesce(payload->>'ciudad',''), coalesce(payload->>'dir',''),
     nullif(payload->>'lat','')::double precision, nullif(payload->>'lng','')::double precision,
     coalesce(payload->>'cc',''), payload->>'tel',
     coalesce(payload->>'nombre',''), coalesce(payload->>'nota',''),
     payload->>'code')
  returning id into new_id;
  select * into out from public.items_public where id = new_id;
  return out;
end; $$;

-- Marcar como "ya no disponible" (abierto a la comunidad)
create or replace function public.mark_taken(p_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.items set estado='tomado', taken_at=now() where id = p_id and estado='disponible';
$$;

-- Reabrir (requiere código del autor)
create or replace function public.reopen_item(p_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.items set estado='disponible', taken_at=null where id = p_id and code = p_code;
  return found;
end; $$;

-- Borrar (requiere código del autor)
create or replace function public.delete_item(p_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.items where id = p_id and code = p_code;
  return found;
end; $$;

grant execute on function public.publish_item(jsonb)        to anon, authenticated;
grant execute on function public.mark_taken(uuid)           to anon, authenticated;
grant execute on function public.reopen_item(uuid, text)    to anon, authenticated;
grant execute on function public.delete_item(uuid, text)    to anon, authenticated;

-- Listo. La app solo LEE de items_public y ESCRIBE vía estas 4 funciones.


-- ============================================================
--  Módulo "Personas" (encontrar personas)
--  La app LEE de personas_public (cédula enmascarada, sin 'code')
--  y ESCRIBE vía publish_persona / publish_personas_bulk /
--  set_persona_estado / delete_persona.
-- ============================================================

create table if not exists public.personas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  cedula      text default '',                 -- privado/completo (NUNCA se expone entero)
  estado      text not null default 'busca' check (estado in ('busca','ubicada')),
  cc          text default '',
  tel         text not null,
  ciudad      text default '',
  pais        text default '',
  nota        text default '',
  code        text not null,                   -- código privado para administrar
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists personas_created_idx on public.personas (created_at desc);
create index if not exists personas_estado_idx  on public.personas (estado);

alter table public.personas enable row level security;
revoke all on public.personas from anon, authenticated;

-- Enmascara la cédula: deja ver solo los últimos 4 dígitos
create or replace function public.mask_cedula(c text)
returns text language sql immutable as $$
  select case
    when c is null or btrim(c) = '' then ''
    when length(regexp_replace(c, '\D', '', 'g')) >= 4
      then '••••' || right(regexp_replace(c, '\D', '', 'g'), 4)
    else '••••'
  end;
$$;

create or replace view public.personas_public as
  select id, nombre, public.mask_cedula(cedula) as cedula, estado,
         cc, tel, ciudad, pais, nota, created_at, updated_at
  from public.personas;

grant select  on public.personas_public to anon, authenticated;
grant execute on function public.mask_cedula(text) to anon, authenticated;

create or replace function public.publish_persona(payload jsonb)
returns public.personas_public
language plpgsql security definer set search_path = public as $$
declare new_id uuid; out public.personas_public;
begin
  insert into public.personas (nombre, cedula, estado, cc, tel, ciudad, pais, nota, code)
  values (
    payload->>'nombre',
    coalesce(payload->>'cedula',''),
    coalesce(nullif(payload->>'estado',''),'busca'),
    coalesce(payload->>'cc',''),
    payload->>'tel',
    coalesce(payload->>'ciudad',''),
    coalesce(payload->>'pais',''),
    coalesce(payload->>'nota',''),
    payload->>'code'
  ) returning id into new_id;
  select * into out from public.personas_public where id = new_id;
  return out;
end; $$;

-- Publicar VARIAS de golpe (bloque).
-- payload = { code, estado, ciudad, pais, cc, personas:[{nombre,cedula,tel,cc?,estado?,nota?}...] }
create or replace function public.publish_personas_bulk(payload jsonb)
returns setof public.personas_public
language plpgsql security definer set search_path = public as $$
declare item jsonb; new_ids uuid[] := '{}'; nid uuid;
begin
  for item in select * from jsonb_array_elements(coalesce(payload->'personas','[]'::jsonb))
  loop
    if coalesce(btrim(item->>'nombre'),'') = '' or coalesce(btrim(item->>'tel'),'') = '' then
      continue;
    end if;
    insert into public.personas (nombre, cedula, estado, cc, tel, ciudad, pais, nota, code)
    values (
      item->>'nombre',
      coalesce(item->>'cedula',''),
      coalesce(nullif(item->>'estado',''), nullif(payload->>'estado',''), 'busca'),
      coalesce(nullif(item->>'cc',''), payload->>'cc', ''),
      item->>'tel',
      coalesce(nullif(item->>'ciudad',''), payload->>'ciudad', ''),
      coalesce(nullif(item->>'pais',''), payload->>'pais', ''),
      coalesce(item->>'nota',''),
      payload->>'code'
    ) returning id into nid;
    new_ids := array_append(new_ids, nid);
  end loop;
  return query select * from public.personas_public where id = any(new_ids) order by created_at desc;
end; $$;

create or replace function public.set_persona_estado(p_id uuid, p_code text, p_estado text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_estado not in ('busca','ubicada') then return false; end if;
  update public.personas set estado = p_estado, updated_at = now()
   where id = p_id and code = p_code;
  return found;
end; $$;

create or replace function public.delete_persona(p_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.personas where id = p_id and code = p_code;
  return found;
end; $$;

grant execute on function public.publish_persona(jsonb)               to anon, authenticated;
grant execute on function public.publish_personas_bulk(jsonb)         to anon, authenticated;
grant execute on function public.set_persona_estado(uuid, text, text) to anon, authenticated;
grant execute on function public.delete_persona(uuid, text)           to anon, authenticated;
