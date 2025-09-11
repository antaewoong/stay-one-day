-- Fix infinite recursion in influencers_own_access policy
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "influencers_own_access" ON influencers;

-- Create a simple policy using auth_user_id (no recursion, same access control)
CREATE POLICY "influencers_own_access" ON influencers
FOR ALL
TO authenticated
USING (auth_user_id = auth.uid() OR get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text]));