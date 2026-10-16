-- ============================================================
--  Dispensa Smart — schema del database (Supabase / PostgreSQL)
--  Copia TUTTO e incollalo in Supabase > SQL Editor > Run.
--  Si può rieseguire senza danni.
-- ============================================================

-- quello che c'è in casa
create table if not exists inventario (
  id         text primary key,
  nome       text not null,
  voci       jsonb not null default '[]',   -- a quali voci del piano conta (la prima è la sua)
  luogo      text not null default 'frigo', -- frigo | dispensa
  qty        numeric not null default 0,
  unita      text not null default 'pz',    -- g | pz
  g_pz       numeric,                       -- peso di un pezzo, se si conta a pezzi
  ean        text,
  manuale    boolean not null default false,
  scadenza   date,
  creato_da  text,
  aggiornato timestamptz default now()
);

-- prodotti già scansionati: la seconda volta basta un tap
create table if not exists prodotti (
  id         text primary key,              -- il codice a barre
  nome       text not null,
  marca      text,
  voci       jsonb not null default '[]',
  luogo      text,
  conf_qty   numeric,
  conf_unita text,
  usato      timestamptz default now()
);

-- prodotti senza codice aggiunti da voi all'elenco a tap
create table if not exists catalogo (
  id     text primary key,
  nome   text not null,
  gruppo text,
  luogo  text,
  voci   jsonb not null default '[]',
  unita  text not null default 'pz',
  passo  numeric,
  g_pz   numeric
);

-- lista della spesa (le voci "piano:..." le gestisce l'app da sola)
create table if not exists spesa (
  id         text primary key,
  nome       text not null,
  voce       text,
  qty_txt    text,
  motivo     text,
  urgenza    text,                          -- urgente | entro | dopo
  data_serve date,
  origine    text,                          -- piano | mano
  prende     text,                          -- max | vale
  fatto      boolean not null default false,
  creato_da  text,
  creato     timestamptz default now()
);

-- pasti segnati come fatti o saltati (id = "AAAA-MM-GG|Pranzo")
create table if not exists pasti (
  id      text primary key,
  data    date not null,
  pasto   text not null,
  stato   text not null,                    -- fatto | saltato | max | vale
  chi     text,
  quando  timestamptz default now(),
  scalato jsonb                             -- cosa era stato tolto da casa, per poterlo rimettere
);

-- avvisi già spediti: evita che i due telefoni (o il controllo automatico) mandino doppioni
create table if not exists avvisi (
  id      text primary key,
  inviato timestamptz default now(),
  da      text
);

-- il piano alimentare caricato dall'app (dai PDF o da piano.json): una riga "attuale".
-- dati vuoto = piano svuotato; nessuna riga = si usa piano.json pubblicato con l'app
create table if not exists piano (
  id         text primary key,
  dati       jsonb,
  aggiornato timestamptz default now(),
  da         text
);

-- ------------------------------------------------------------
--  Permessi: app privata fra voi due, raggiungibile solo da chi ha il link.
--  Come per Fanta Mondiale, lettura e scrittura con la chiave pubblica "anon".
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['inventario','prodotti','catalogo','spesa','pasti','avvisi','piano'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "accesso app" on %I', t);
    execute format('create policy "accesso app" on %I for all using (true) with check (true)', t);
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
