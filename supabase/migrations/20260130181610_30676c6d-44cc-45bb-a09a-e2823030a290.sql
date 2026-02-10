-- Fix the permissive RLS policy for activity_logs insert
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;

-- Create proper insert policy - any authenticated user can log their own actions
CREATE POLICY "Users can insert own activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() = performed_by_user_id);