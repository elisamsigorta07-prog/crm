-- Private bucket only. File access is authorized on the server with getUser()
-- and server-controlled CRM app_metadata. No anonymous or broad authenticated
-- storage policies are added. Browser uploads use a single-path signed token.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('policy-documents', 'policy-documents', false, 20971520, array['application/pdf', 'application/json'])
on conflict (id) do nothing;
