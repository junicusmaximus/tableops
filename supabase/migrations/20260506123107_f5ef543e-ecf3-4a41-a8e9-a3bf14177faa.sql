
-- ============ TABLES ============

CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT '기타',
  description text,
  template_schema jsonb NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
  status text NOT NULL DEFAULT 'active', -- draft|active|archived
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.document_templates(id) ON DELETE SET NULL,
  store_id uuid NOT NULL,
  title text NOT NULL,
  category text,
  document_schema jsonb NOT NULL DEFAULT '{"blocks":[]}'::jsonb, -- snapshot at send time
  sender_user_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL,
  recipient_name text NOT NULL,
  status text NOT NULL DEFAULT 'sent', -- draft|sent|viewed|in_progress|completed|rejected|expired|cancelled
  due_date date,
  sent_at timestamptz DEFAULT now(),
  viewed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.document_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  field_id text NOT NULL,
  value jsonb,
  filled_by uuid NOT NULL,
  filled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, field_id)
);

CREATE TABLE public.document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  signer_user_id uuid NOT NULL,
  signer_name text NOT NULL,
  signature_method text NOT NULL, -- draw|typed
  signature_image_url text,
  typed_name text,
  consent_accepted boolean NOT NULL DEFAULT false,
  consent_text text NOT NULL,
  consent_text_version text NOT NULL DEFAULT 'v1',
  consent_accepted_at timestamptz NOT NULL DEFAULT now(),
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  document_version_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.document_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid,
  actor_name text,
  actor_role text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.final_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.document_requests(id) ON DELETE CASCADE,
  final_html text NOT NULL,
  final_pdf_url text,
  document_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dt_store ON public.document_templates(store_id);
CREATE INDEX idx_dr_store ON public.document_requests(store_id);
CREATE INDEX idx_dr_recipient ON public.document_requests(recipient_user_id);
CREATE INDEX idx_dr_sender ON public.document_requests(sender_user_id);
CREATE INDEX idx_dfv_request ON public.document_field_values(request_id);
CREATE INDEX idx_dal_request ON public.document_audit_logs(request_id);

-- ============ TRIGGERS ============

CREATE TRIGGER trg_dt_updated BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dr_updated BEFORE UPDATE ON public.document_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS ============

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_documents ENABLE ROW LEVEL SECURITY;

-- templates: managers manage in their store, all members can read active
CREATE POLICY dt_select ON public.document_templates FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));
CREATE POLICY dt_insert ON public.document_templates FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY dt_update ON public.document_templates FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY dt_delete ON public.document_templates FOR DELETE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

-- requests: managers see all in store, employees see only theirs
CREATE POLICY dr_select ON public.document_requests FOR SELECT TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR sender_user_id = auth.uid()
    OR (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role))
  );
CREATE POLICY dr_insert ON public.document_requests FOR INSERT TO authenticated
  WITH CHECK (
    is_store_member(auth.uid(), store_id)
    AND has_role_or_higher(auth.uid(), 'manager'::app_role)
    AND sender_user_id = auth.uid()
  );
CREATE POLICY dr_update ON public.document_requests FOR UPDATE TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role))
  );

-- field_values: only recipient can insert/update, recipient + managers can read
CREATE POLICY dfv_select ON public.document_field_values FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_requests dr
    WHERE dr.id = document_field_values.request_id
      AND (dr.recipient_user_id = auth.uid()
           OR dr.sender_user_id = auth.uid()
           OR (is_store_member(auth.uid(), dr.store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role)))
  ));
CREATE POLICY dfv_insert ON public.document_field_values FOR INSERT TO authenticated
  WITH CHECK (
    filled_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.document_requests dr WHERE dr.id = request_id AND dr.recipient_user_id = auth.uid())
  );
CREATE POLICY dfv_update ON public.document_field_values FOR UPDATE TO authenticated
  USING (filled_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.document_requests dr WHERE dr.id = request_id AND dr.recipient_user_id = auth.uid() AND dr.status NOT IN ('completed','cancelled','expired')));

-- signatures: insert by signer only, no update/delete (locked)
CREATE POLICY ds_select ON public.document_signatures FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_requests dr
    WHERE dr.id = document_signatures.request_id
      AND (dr.recipient_user_id = auth.uid()
           OR dr.sender_user_id = auth.uid()
           OR (is_store_member(auth.uid(), dr.store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role)))
  ));
CREATE POLICY ds_insert ON public.document_signatures FOR INSERT TO authenticated
  WITH CHECK (signer_user_id = auth.uid());

-- audit logs: insert by anyone with access; read by sender/recipient/managers
CREATE POLICY dal_select ON public.document_audit_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_requests dr
    WHERE dr.id = document_audit_logs.request_id
      AND (dr.recipient_user_id = auth.uid()
           OR dr.sender_user_id = auth.uid()
           OR (is_store_member(auth.uid(), dr.store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role)))
  ));
CREATE POLICY dal_insert ON public.document_audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.document_requests dr WHERE dr.id = request_id
      AND (dr.recipient_user_id = auth.uid() OR dr.sender_user_id = auth.uid()
           OR (is_store_member(auth.uid(), dr.store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role)))
  ));

-- final docs: insert only, no update (locked)
CREATE POLICY fd_select ON public.final_documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_requests dr
    WHERE dr.id = final_documents.request_id
      AND (dr.recipient_user_id = auth.uid()
           OR dr.sender_user_id = auth.uid()
           OR (is_store_member(auth.uid(), dr.store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role)))
  ));
CREATE POLICY fd_insert ON public.final_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.document_requests dr WHERE dr.id = request_id AND dr.recipient_user_id = auth.uid()
  ));

-- ============ STORAGE BUCKET (signatures, private) ============

INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "signatures_owner_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "signatures_owner_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "signatures_manager_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'signatures' AND has_role_or_higher(auth.uid(), 'manager'::app_role));
