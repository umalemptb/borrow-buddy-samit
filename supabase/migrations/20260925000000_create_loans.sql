-- ตาราง Loan ของ Borrow Buddy เวอร์ชัน 2 (ดู design.md ข้อ 4 และ 6)

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  friend_name text not null check (btrim(friend_name) <> ''),
  item_name text not null check (btrim(item_name) <> ''),
  borrowed_date date not null,
  due_date date not null check (due_date >= borrowed_date),
  returned_date date check (returned_date is null or returned_date >= borrowed_date),
  created_at timestamptz not null default now()
);

create index loans_owner_id_idx on public.loans (owner_id);

-- RLS: เห็นและแก้ได้เฉพาะ Loan ของบัญชีตัวเอง ไม่มี policy delete จึงลบไม่ได้
alter table public.loans enable row level security;

create policy "เจ้าของอ่าน Loan ของตัวเอง"
  on public.loans for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "เจ้าของเพิ่ม Loan ของตัวเอง"
  on public.loans for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "เจ้าของแก้ Loan ของตัวเอง"
  on public.loans for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ป้องกันซ้ำอีกชั้น: anon ไม่มีสิทธิ์ใด ๆ และ authenticated ลบไม่ได้
revoke all on public.loans from anon;
revoke delete, truncate on public.loans from authenticated;
