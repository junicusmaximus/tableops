
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'brand_admin', 'store_manager', 'shift_leader', 'staff');

-- 2. Core tables
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  employment_type TEXT DEFAULT 'full_time',
  hire_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

CREATE TABLE public.user_store_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_profile_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'checked_in',
  is_late BOOLEAN DEFAULT false,
  is_early_leave BOOLEAN DEFAULT false,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  work_hours NUMERIC(5,2),
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.break_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_log_id UUID NOT NULL REFERENCES public.attendance_logs(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_at TIMESTAMPTZ,
  duration_minutes NUMERIC(5,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_employee_profiles_user_id ON public.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_store_id ON public.employee_profiles(store_id);
CREATE INDEX idx_user_store_roles_user_id ON public.user_store_roles(user_id);
CREATE INDEX idx_user_store_roles_store_id ON public.user_store_roles(store_id);
CREATE INDEX idx_attendance_logs_user_id ON public.attendance_logs(user_id);
CREATE INDEX idx_attendance_logs_store_id ON public.attendance_logs(store_id);
CREATE INDEX idx_attendance_logs_date ON public.attendance_logs(date);
CREATE INDEX idx_break_logs_attendance ON public.break_logs(attendance_log_id);

-- 4. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendance_logs_updated_at BEFORE UPDATE ON public.attendance_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Security definer helper functions (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_store_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.user_store_roles WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_brand_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ep.brand_id FROM public.employee_profiles ep WHERE ep.user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ep.organization_id FROM public.employee_profiles ep WHERE ep.user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_store_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id UUID, _min_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_store_roles
    WHERE user_id = _user_id AND role <= _min_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_employee_profile_id(_user_id UUID, _store_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employee_profiles WHERE user_id = _user_id AND store_id = _store_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_store_member(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND store_id = _store_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- 6. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_store_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- organizations: members can read their org, super_admin can do all
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_org_ids(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "org_insert" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "org_update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "org_delete" ON public.organizations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- brands: brand members can read
CREATE POLICY "brand_select" ON public.brands FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_brand_ids(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "brand_manage" ON public.brands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'brand_admin'));

-- stores: store members can read
CREATE POLICY "store_select" ON public.stores FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_store_ids(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "store_manage" ON public.stores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'brand_admin'));

-- employee_profiles: own profile or store member with higher role
CREATE POLICY "ep_select" ON public.employee_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_member(auth.uid(), store_id));

CREATE POLICY "ep_insert" ON public.employee_profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role_or_higher(auth.uid(), 'store_manager'));

CREATE POLICY "ep_update" ON public.employee_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role_or_higher(auth.uid(), 'store_manager'));

-- user_store_roles: own roles or store members can see
CREATE POLICY "usr_select" ON public.user_store_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_member(auth.uid(), store_id));

CREATE POLICY "usr_manage" ON public.user_store_roles FOR ALL TO authenticated
  USING (public.has_role_or_higher(auth.uid(), 'store_manager'));

-- attendance_logs: own logs or store member
CREATE POLICY "att_select" ON public.attendance_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_member(auth.uid(), store_id));

CREATE POLICY "att_insert" ON public.attendance_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "att_update" ON public.attendance_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role_or_higher(auth.uid(), 'shift_leader'));

-- break_logs: through attendance_logs access
CREATE POLICY "brk_select" ON public.break_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.attendance_logs al WHERE al.id = attendance_log_id AND (al.user_id = auth.uid() OR public.is_store_member(auth.uid(), al.store_id))));

CREATE POLICY "brk_insert" ON public.break_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.attendance_logs al WHERE al.id = attendance_log_id AND al.user_id = auth.uid()));

CREATE POLICY "brk_update" ON public.break_logs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.attendance_logs al WHERE al.id = attendance_log_id AND al.user_id = auth.uid()));

-- 8. Auto-create employee profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- No auto-creation; profiles are created when assigned to a store
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
