-- NEXA · owner-only accounts
-- Run once in Supabase → SQL Editor. Replace the email if the owner changes.
-- Every new user (email sign-up, magic link or OAuth) is rejected unless it is the owner,
-- so the public sign-up page cannot be used to create other accounts.

create or replace function public.nexa_owner_only()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) <> 'yasmeenmh.90@gmail.com' then
    raise exception 'NEXA is private: sign-ups are limited to the owner.';
  end if;
  return new;
end;
$$;

drop trigger if exists nexa_owner_only on auth.users;
create trigger nexa_owner_only
  before insert on auth.users
  for each row execute function public.nexa_owner_only();
