-- Display names are untrusted profile data and are never used for authorization.
create function public.family_member_names(fid uuid)
returns table(user_id uuid, display_name text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_member(fid) then raise exception 'Sem acesso'; end if;
 return query
 select m.user_id,
   coalesce(nullif(pg_catalog.left(pg_catalog.btrim(u.raw_user_meta_data->>'full_name'),100),''),
            nullif(pg_catalog.left(pg_catalog.btrim(u.raw_user_meta_data->>'name'),100),''),
            'Adulto')
 from public.members m join auth.users u on u.id=m.user_id
 where m.family_id=fid;
end $$;
revoke all on function public.family_member_names(uuid) from public, anon;
grant execute on function public.family_member_names(uuid) to authenticated;
