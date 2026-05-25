-- 0009_marketplace.sql
-- Introduces the Vendorship Marketplace primitives:
--   venues          — physical spaces with compliance limits
--   vendors         — marketplace listings (caterers, rentals, etc.)
--   layout_assets   — vendor items placed at coordinates on a layout
-- Plus an optional venue_id on layouts.
--
-- Depends on 0001_layouts.sql for public.set_updated_at().
--
-- Open architectural decisions (see review notes alongside this migration):
--   - vendors.user_id assumes each vendor is its own auth.users account.
--     If vendors are admin-curated, drop user_id and use a different RLS model.
--   - layout_assets stores asset_name as free text. A real implementation
--     will need a public.vendor_items catalog and a FK from layout_assets
--     into it. Out of scope for v0.
--   - venues.compliance fields are the three most common; rename or add
--     per the jurisdictions you actually serve.

-- =====================================================================
-- 1. venues
-- =====================================================================
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  fire_code_capacity integer check (fire_code_capacity is null or fire_code_capacity > 0),
  ada_required_seats integer not null default 0 check (ada_required_seats >= 0),
  max_per_table integer check (max_per_table is null or max_per_table > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index venues_user_id_idx on public.venues (user_id);

alter table public.venues enable row level security;

create policy "Users can view their own venues"
  on public.venues for select
  using (auth.uid() = user_id);

create policy "Users can insert their own venues"
  on public.venues for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own venues"
  on public.venues for update
  using (auth.uid() = user_id);

create policy "Users can delete their own venues"
  on public.venues for delete
  using (auth.uid() = user_id);

create trigger venues_set_updated_at
  before update on public.venues
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- 2. vendors  (MARKETPLACE — read-cross-tenant, write-own-only)
-- =====================================================================
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  -- The auth user who owns this vendor listing. Each vendor account
  -- creates and manages their own row.
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vendor_type text not null check (vendor_type in (
    'catering',
    'rental',
    'flowers',
    'av',
    'staffing',
    'other'
  )),
  description text,
  contact_email text,
  contact_phone text,
  service_area text,
  -- Draft vs published. Only published vendors are discoverable by
  -- non-owner authenticated users.
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendors_user_id_idx on public.vendors (user_id);
create index vendors_published_idx on public.vendors (is_published) where is_published;
create index vendors_type_idx on public.vendors (vendor_type) where is_published;

alter table public.vendors enable row level security;

-- Discovery surface: any signed-in user can see published listings.
create policy "Authenticated users can view published vendors"
  on public.vendors for select
  to authenticated
  using (is_published = true);

-- A vendor sees their own listings regardless of publish state (drafts).
create policy "Vendors can view their own listings"
  on public.vendors for select
  using (auth.uid() = user_id);

create policy "Vendors can insert their own listings"
  on public.vendors for insert
  with check (auth.uid() = user_id);

create policy "Vendors can update their own listings"
  on public.vendors for update
  using (auth.uid() = user_id);

create policy "Vendors can delete their own listings"
  on public.vendors for delete
  using (auth.uid() = user_id);

create trigger vendors_set_updated_at
  before update on public.vendors
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- 3. layout_assets
-- =====================================================================
-- Placements of vendor items on a layout. Access is governed by the
-- LAYOUT's owner, not the vendor's owner — the layout's user is the
-- "customer" placing items in their plan.
create table public.layout_assets (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.layouts(id) on delete cascade,
  -- ON DELETE RESTRICT: don't allow a vendor to disappear out from under
  -- a layout that's referencing them. CLAUDE.md "never silently drop data."
  -- Surface the layout_assets count when a vendor tries to delete.
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  asset_name text not null,
  -- Coordinate matches the seating algorithm's "row,column" position
  -- shape (see src/lib/seating/geometry.ts positionKey()).
  position_row integer not null check (position_row >= 0),
  position_column integer not null check (position_column >= 0),
  rotation_degrees integer not null default 0
    check (rotation_degrees in (0, 90, 180, 270)),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Two assets shouldn't occupy the exact same coordinate on the same
  -- layout. (If they should, drop this constraint and add a z_index.)
  unique (layout_id, position_row, position_column)
);

create index layout_assets_layout_id_idx on public.layout_assets (layout_id);
create index layout_assets_vendor_id_idx on public.layout_assets (vendor_id);

alter table public.layout_assets enable row level security;

-- Access via the parent layout's owner.
create policy "Users can view assets on their own layouts"
  on public.layout_assets for select
  using (exists (
    select 1 from public.layouts l
    where l.id = layout_id and l.user_id = auth.uid()
  ));

create policy "Users can insert assets on their own layouts"
  on public.layout_assets for insert
  with check (exists (
    select 1 from public.layouts l
    where l.id = layout_id and l.user_id = auth.uid()
  ));

create policy "Users can update assets on their own layouts"
  on public.layout_assets for update
  using (exists (
    select 1 from public.layouts l
    where l.id = layout_id and l.user_id = auth.uid()
  ));

create policy "Users can delete assets on their own layouts"
  on public.layout_assets for delete
  using (exists (
    select 1 from public.layouts l
    where l.id = layout_id and l.user_id = auth.uid()
  ));

create trigger layout_assets_set_updated_at
  before update on public.layout_assets
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- 4. layouts.venue_id (optional)
-- =====================================================================
-- ON DELETE SET NULL: deleting a venue must not silently destroy any
-- layouts that were drafted against it (CLAUDE.md invariant). The
-- layout keeps its grid; the venue link goes null.
alter table public.layouts
  add column venue_id uuid references public.venues(id) on delete set null;

create index layouts_venue_id_idx on public.layouts (venue_id);

notify pgrst, 'reload schema';
