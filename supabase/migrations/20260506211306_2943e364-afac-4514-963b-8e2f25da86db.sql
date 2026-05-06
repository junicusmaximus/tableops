
-- ===== knowledge_articles =====
CREATE TABLE public.knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  organization_id uuid,
  title text NOT NULL,
  category text NOT NULL DEFAULT '기타',
  summary text,
  content jsonb NOT NULL DEFAULT '{"steps":[]}'::jsonb,
  target_roles text[] NOT NULL DEFAULT ARRAY['ceo','owner','boss','manager','full_time','part_time'],
  importance text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  require_acknowledgement boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ka_store ON public.knowledge_articles(store_id, status);
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ka_select ON public.knowledge_articles FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));
CREATE POLICY ka_insert ON public.knowledge_articles FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role) AND created_by = auth.uid());
CREATE POLICY ka_update ON public.knowledge_articles FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY ka_delete ON public.knowledge_articles FOR DELETE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE TRIGGER ka_set_updated BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== recipe_books =====
CREATE TABLE public.recipe_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  organization_id uuid,
  title text NOT NULL,
  english_name text,
  category text NOT NULL DEFAULT '기타',
  description text,
  serving_size text,
  batch_size text,
  prep_method text,
  cook_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  cook_time text,
  storage_method text,
  expiry_rule text,
  plating_guide text,
  allergy_info text[] NOT NULL DEFAULT '{}',
  warnings text,
  photo_url text,
  video_url text,
  cost_info jsonb DEFAULT '{}'::jsonb,
  visibility_scope text NOT NULL DEFAULT 'all',
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rb_store ON public.recipe_books(store_id, status);
ALTER TABLE public.recipe_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY rb_select ON public.recipe_books FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));
CREATE POLICY rb_insert ON public.recipe_books FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role) AND created_by = auth.uid());
CREATE POLICY rb_update ON public.recipe_books FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY rb_delete ON public.recipe_books FOR DELETE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE TRIGGER rb_set_updated BEFORE UPDATE ON public.recipe_books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== recipe_ingredients =====
CREATE TABLE public.recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  ingredient_id uuid,
  ingredient_name text NOT NULL,
  quantity numeric,
  unit text,
  memo text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ri_recipe ON public.recipe_ingredients(recipe_id);
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY ri_select ON public.recipe_ingredients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipe_books r WHERE r.id = recipe_ingredients.recipe_id AND public.is_store_member(auth.uid(), r.store_id)));
CREATE POLICY ri_insert ON public.recipe_ingredients FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipe_books r WHERE r.id = recipe_ingredients.recipe_id AND public.is_store_member(auth.uid(), r.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));
CREATE POLICY ri_update ON public.recipe_ingredients FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipe_books r WHERE r.id = recipe_ingredients.recipe_id AND public.is_store_member(auth.uid(), r.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));
CREATE POLICY ri_delete ON public.recipe_ingredients FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipe_books r WHERE r.id = recipe_ingredients.recipe_id AND public.is_store_member(auth.uid(), r.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));

-- ===== recipe_versions =====
CREATE TABLE public.recipe_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  change_log text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rv_recipe ON public.recipe_versions(recipe_id, version_number DESC);
ALTER TABLE public.recipe_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rv_select ON public.recipe_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipe_books r WHERE r.id = recipe_versions.recipe_id AND public.is_store_member(auth.uid(), r.store_id)));
CREATE POLICY rv_insert ON public.recipe_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipe_books r WHERE r.id = recipe_versions.recipe_id AND public.is_store_member(auth.uid(), r.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));

-- ===== training_courses =====
CREATE TABLE public.training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  training_type text NOT NULL DEFAULT '신입 직원 교육',
  target_roles text[] NOT NULL DEFAULT ARRAY['full_time','part_time'],
  required boolean NOT NULL DEFAULT false,
  due_days integer DEFAULT 7,
  estimated_minutes integer DEFAULT 30,
  status text NOT NULL DEFAULT 'draft',
  pass_threshold integer NOT NULL DEFAULT 60,
  allow_quiz_retry boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tc_select ON public.training_courses FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));
CREATE POLICY tc_insert ON public.training_courses FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role) AND created_by = auth.uid());
CREATE POLICY tc_update ON public.training_courses FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY tc_delete ON public.training_courses FOR DELETE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE TRIGGER tc_set_updated BEFORE UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== training_course_items =====
CREATE TABLE public.training_course_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id uuid,
  title text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tci_course ON public.training_course_items(course_id);
ALTER TABLE public.training_course_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tci_select ON public.training_course_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = training_course_items.course_id AND public.is_store_member(auth.uid(), c.store_id)));
CREATE POLICY tci_modify ON public.training_course_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = training_course_items.course_id AND public.is_store_member(auth.uid(), c.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = training_course_items.course_id AND public.is_store_member(auth.uid(), c.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));

-- ===== training_assignments =====
CREATE TABLE public.training_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  store_id uuid NOT NULL,
  assigned_to_user_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  due_date date,
  started_at timestamptz,
  completed_at timestamptz,
  quiz_score integer,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ta_user ON public.training_assignments(assigned_to_user_id, status);
CREATE INDEX idx_ta_course ON public.training_assignments(course_id);
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ta_select ON public.training_assignments FOR SELECT TO authenticated
  USING (assigned_to_user_id = auth.uid() OR (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));
CREATE POLICY ta_insert ON public.training_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role) AND assigned_by = auth.uid());
CREATE POLICY ta_update ON public.training_assignments FOR UPDATE TO authenticated
  USING (assigned_to_user_id = auth.uid() OR (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));
CREATE POLICY ta_delete ON public.training_assignments FOR DELETE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE TRIGGER ta_set_updated BEFORE UPDATE ON public.training_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== quiz_questions =====
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer jsonb NOT NULL,
  explanation text,
  points integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_qq_course ON public.quiz_questions(course_id);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY qq_select ON public.quiz_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = quiz_questions.course_id AND public.is_store_member(auth.uid(), c.store_id)));
CREATE POLICY qq_modify ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = quiz_questions.course_id AND public.is_store_member(auth.uid(), c.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = quiz_questions.course_id AND public.is_store_member(auth.uid(), c.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));

-- ===== quiz_attempts =====
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_qa_user ON public.quiz_attempts(user_id, course_id);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_select ON public.quiz_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = quiz_attempts.course_id AND public.is_store_member(auth.uid(), c.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));
CREATE POLICY qa_insert ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ===== manual_acknowledgements =====
CREATE TABLE public.manual_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  article_version integer NOT NULL,
  user_id uuid NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  signature_method text NOT NULL DEFAULT 'click',
  signature_data text
);
CREATE INDEX idx_ma_article ON public.manual_acknowledgements(article_id);
CREATE INDEX idx_ma_user ON public.manual_acknowledgements(user_id);
ALTER TABLE public.manual_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY ma_select ON public.manual_acknowledgements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.knowledge_articles a WHERE a.id = manual_acknowledgements.article_id AND public.is_store_member(auth.uid(), a.store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)));
CREATE POLICY ma_insert ON public.manual_acknowledgements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ===== notification preferences extension =====
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS enable_training boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_recipe_update boolean NOT NULL DEFAULT true;

-- ===== auto recipe version snapshot trigger =====
CREATE OR REPLACE FUNCTION public.snapshot_recipe_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ings jsonb;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published' OR OLD.version IS DISTINCT FROM NEW.version) THEN
    SELECT COALESCE(jsonb_agg(to_jsonb(ri.*) ORDER BY ri.sort_order), '[]'::jsonb)
      INTO _ings FROM public.recipe_ingredients ri WHERE ri.recipe_id = NEW.id;
    INSERT INTO public.recipe_versions (recipe_id, version_number, snapshot, created_by)
    VALUES (NEW.id, NEW.version, jsonb_build_object('recipe', to_jsonb(NEW), 'ingredients', _ings), COALESCE(NEW.created_by, auth.uid()));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER rb_snapshot_version
AFTER INSERT OR UPDATE ON public.recipe_books
FOR EACH ROW EXECUTE FUNCTION public.snapshot_recipe_version();
