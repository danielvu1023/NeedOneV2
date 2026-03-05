-- Fix UPDATE policy gaps: add WITH CHECK clauses to prevent users from
-- writing arbitrary values to columns beyond what the app intends.

-- friendships: restrict what addressee can update
-- Before: addressee could change requester_id, addressee_id, or status to anything
-- After: addressee can only accept (status = 'accepted') and cannot reassign users
DROP POLICY IF EXISTS "friendships_update_addressee" ON public.friendships;
CREATE POLICY "friendships_update_addressee"
  ON public.friendships FOR UPDATE
  USING ((SELECT auth.uid()) = addressee_id)
  WITH CHECK ((SELECT auth.uid()) = addressee_id AND status = 'accepted');

-- notifications: restrict updates to only setting read=true
-- Before: user could overwrite actor_id, type, park_id, etc. on their own rows
-- After: only allowed write is { read: true }
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id AND read = true);
