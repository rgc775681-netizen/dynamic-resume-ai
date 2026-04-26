
-- Drop old permissive insert policy
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;

-- Only allow inserting the candidate role for yourself; recruiter role can only belong to the hardcoded admin
CREATE POLICY "Users can self-assign candidate role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    role = 'candidate'::app_role
    OR (role = 'recruiter'::app_role AND user_id = '6ce56a7f-a929-4083-9663-b914ef3e1483'::uuid)
  )
);

-- Safety trigger: even if policy is bypassed, prevent any non-admin from getting recruiter role
CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'recruiter'::app_role
     AND NEW.user_id <> '6ce56a7f-a929-4083-9663-b914ef3e1483'::uuid THEN
    RAISE EXCEPTION 'Recruiter role is reserved for the admin account';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_admin_trigger ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trigger
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();

-- Auto-assign candidate role on new signup so users go straight to candidate dashboard
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  -- Everyone except the admin gets the candidate role automatically
  IF NEW.id <> '6ce56a7f-a929-4083-9663-b914ef3e1483'::uuid THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'candidate'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Make sure the trigger that calls handle_new_user exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
