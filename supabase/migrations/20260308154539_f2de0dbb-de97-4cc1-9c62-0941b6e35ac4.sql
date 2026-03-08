
-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  approver_user_id UUID,
  leave_type TEXT NOT NULL DEFAULT '연차',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Applicant can see own requests
CREATE POLICY "lr_select_own" ON public.leave_requests FOR SELECT
  TO authenticated USING (applicant_user_id = auth.uid() OR is_store_member(auth.uid(), store_id));

-- Applicant can insert own requests
CREATE POLICY "lr_insert" ON public.leave_requests FOR INSERT
  TO authenticated WITH CHECK (applicant_user_id = auth.uid() AND is_store_member(auth.uid(), store_id));

-- Manager can update (approve/reject)
CREATE POLICY "lr_update" ON public.leave_requests FOR UPDATE
  TO authenticated USING (
    (applicant_user_id = auth.uid()) OR 
    (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role))
  );

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see own notifications
CREATE POLICY "notif_select" ON public.notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- Any authenticated user can insert (for cross-user notifications)
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (true);

-- Users can update own notifications (mark as read)
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  enable_all BOOLEAN NOT NULL DEFAULT true,
  enable_leave_request BOOLEAN NOT NULL DEFAULT true,
  enable_leave_result BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "np_select" ON public.notification_preferences FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "np_insert" ON public.notification_preferences FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "np_update" ON public.notification_preferences FOR UPDATE
  TO authenticated USING (user_id = auth.uid());
