DELETE FROM public.user_roles
WHERE user_id = '6ce56a7f-a929-4083-9663-b914ef3e1483'::uuid
  AND role = 'candidate'::app_role;