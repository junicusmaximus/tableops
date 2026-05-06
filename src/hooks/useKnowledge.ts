import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useIsManager, useCurrentRole } from '@/hooks/useUserRole';

// ===== Types =====
export type KnowledgeArticle = {
  id: string; store_id: string; organization_id: string | null;
  title: string; category: string; summary: string | null;
  content: any; target_roles: string[]; importance: string; status: string;
  version: number; attachments: any; require_acknowledgement: boolean;
  created_by: string; created_at: string; updated_at: string;
};
export type Recipe = {
  id: string; store_id: string; organization_id: string | null;
  title: string; english_name: string | null; category: string; description: string | null;
  serving_size: string | null; batch_size: string | null; prep_method: string | null;
  cook_steps: any; cook_time: string | null; storage_method: string | null;
  expiry_rule: string | null; plating_guide: string | null; allergy_info: string[];
  warnings: string | null; photo_url: string | null; video_url: string | null;
  cost_info: any; visibility_scope: string; status: string; version: number;
  created_by: string; created_at: string; updated_at: string;
};
export type RecipeIngredient = {
  id: string; recipe_id: string; ingredient_id: string | null;
  ingredient_name: string; quantity: number | null; unit: string | null;
  memo: string | null; sort_order: number;
};
export type TrainingCourse = {
  id: string; store_id: string; title: string; description: string | null;
  training_type: string; target_roles: string[]; required: boolean;
  due_days: number | null; estimated_minutes: number | null; status: string;
  pass_threshold: number; allow_quiz_retry: boolean; created_by: string;
  created_at: string; updated_at: string;
};
export type CourseItem = {
  id: string; course_id: string; item_type: string; item_id: string | null;
  title: string | null; sort_order: number;
};
export type Assignment = {
  id: string; course_id: string; store_id: string; assigned_to_user_id: string;
  assigned_by: string; status: string; due_date: string | null;
  started_at: string | null; completed_at: string | null;
  quiz_score: number | null; acknowledged_at: string | null;
  created_at: string; updated_at: string;
};
export type QuizQuestion = {
  id: string; course_id: string; question_type: string; question: string;
  options: any; correct_answer: any; explanation: string | null;
  points: number; sort_order: number;
};
export type QuizAttempt = {
  id: string; course_id: string; user_id: string; answers: any;
  score: number; total_points: number; passed: boolean; submitted_at: string;
};

// ===== Permissions =====
export const useKnowledgePermissions = () => {
  const isManager = useIsManager();
  const role = useCurrentRole();
  return {
    canManage: isManager,
    canViewCost: isManager,
    canAssign: isManager,
    role,
  };
};

// ===== Articles =====
export const useArticles = (search?: string, category?: string) => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['knowledge-articles', profile?.store_id, search, category],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      let q = supabase.from('knowledge_articles').select('*')
        .eq('store_id', profile.store_id).order('updated_at', { ascending: false });
      if (category && category !== 'all') q = q.eq('category', category);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as KnowledgeArticle[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useArticle = (id?: string) => {
  return useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('knowledge_articles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as KnowledgeArticle | null;
    },
    enabled: !!id,
  });
};

export const useArticleMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const create = useMutation({
    mutationFn: async (input: Partial<KnowledgeArticle>) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('knowledge_articles').insert({
        store_id: profile.store_id,
        organization_id: profile.organization_id,
        created_by: user.id,
        title: input.title || '제목 없음',
        category: input.category || '기타',
        summary: input.summary || null,
        content: input.content || { steps: [] },
        target_roles: input.target_roles || ['ceo','owner','boss','manager','full_time','part_time'],
        importance: input.importance || 'normal',
        status: input.status || 'draft',
        require_acknowledgement: input.require_acknowledgement || false,
        attachments: input.attachments || [],
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-articles'] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<KnowledgeArticle> & { id: string; bumpVersion?: boolean }) => {
      const updates: any = { ...patch };
      if ((patch as any).bumpVersion) {
        delete updates.bumpVersion;
        const cur = await supabase.from('knowledge_articles').select('version').eq('id', id).single();
        updates.version = (cur.data?.version || 1) + 1;
      }
      const { data, error } = await supabase.from('knowledge_articles').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['knowledge-articles'] });
      qc.invalidateQueries({ queryKey: ['knowledge-article', vars.id] });
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-articles'] }),
  });
  return { create, update, remove };
};

// ===== Recipes =====
export const useRecipes = (search?: string, category?: string) => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['recipes', profile?.store_id, search, category],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      let q = supabase.from('recipe_books').select('*').eq('store_id', profile.store_id)
        .order('updated_at', { ascending: false });
      if (category && category !== 'all') q = q.eq('category', category);
      if (search) q = q.or(`title.ilike.%${search}%,english_name.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Recipe[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useRecipe = (id?: string) => {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      if (!id) return null;
      const [rb, ri, rv] = await Promise.all([
        supabase.from('recipe_books').select('*').eq('id', id).maybeSingle(),
        supabase.from('recipe_ingredients').select('*').eq('recipe_id', id).order('sort_order'),
        supabase.from('recipe_versions').select('*').eq('recipe_id', id).order('version_number', { ascending: false }),
      ]);
      if (rb.error) throw rb.error;
      return {
        recipe: rb.data as Recipe | null,
        ingredients: (ri.data ?? []) as RecipeIngredient[],
        versions: (rv.data ?? []) as any[],
      };
    },
    enabled: !!id,
  });
};

export const useRecipeMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const create = useMutation({
    mutationFn: async (input: Partial<Recipe> & { ingredients?: Partial<RecipeIngredient>[] }) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');
      const { ingredients, ...recipe } = input;
      const { data, error } = await supabase.from('recipe_books').insert({
        store_id: profile.store_id,
        organization_id: profile.organization_id,
        created_by: user.id,
        title: recipe.title || '제목 없음',
        category: recipe.category || '기타',
        description: recipe.description || null,
        serving_size: recipe.serving_size || null,
        batch_size: recipe.batch_size || null,
        prep_method: recipe.prep_method || null,
        cook_steps: recipe.cook_steps || [],
        cook_time: recipe.cook_time || null,
        storage_method: recipe.storage_method || null,
        expiry_rule: recipe.expiry_rule || null,
        plating_guide: recipe.plating_guide || null,
        allergy_info: recipe.allergy_info || [],
        warnings: recipe.warnings || null,
        photo_url: recipe.photo_url || null,
        video_url: recipe.video_url || null,
        cost_info: recipe.cost_info || {},
        visibility_scope: recipe.visibility_scope || 'all',
        status: recipe.status || 'draft',
        english_name: recipe.english_name || null,
      }).select().single();
      if (error) throw error;
      if (ingredients && ingredients.length > 0) {
        const rows = ingredients.map((ing, idx) => ({
          recipe_id: data.id,
          ingredient_name: ing.ingredient_name || '',
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          memo: ing.memo ?? null,
          sort_order: idx,
        }));
        const { error: e2 } = await supabase.from('recipe_ingredients').insert(rows);
        if (e2) throw e2;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, ingredients, bumpVersion, ...patch }: Partial<Recipe> & { id: string; ingredients?: Partial<RecipeIngredient>[]; bumpVersion?: boolean }) => {
      const updates: any = { ...patch };
      if (bumpVersion) {
        const cur = await supabase.from('recipe_books').select('version').eq('id', id).single();
        updates.version = (cur.data?.version || 1) + 1;
      }
      const { error } = await supabase.from('recipe_books').update(updates).eq('id', id);
      if (error) throw error;
      if (ingredients) {
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
        if (ingredients.length > 0) {
          const rows = ingredients.map((ing, idx) => ({
            recipe_id: id,
            ingredient_name: ing.ingredient_name || '',
            quantity: ing.quantity ?? null,
            unit: ing.unit ?? null,
            memo: ing.memo ?? null,
            sort_order: idx,
          }));
          const { error: e2 } = await supabase.from('recipe_ingredients').insert(rows);
          if (e2) throw e2;
        }
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['recipe', vars.id] });
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
      const { error } = await supabase.from('recipe_books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
  return { create, update, remove };
};

// ===== Training Courses =====
export const useCourses = () => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['training-courses', profile?.store_id],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase.from('training_courses').select('*')
        .eq('store_id', profile.store_id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrainingCourse[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useCourse = (id?: string) => {
  return useQuery({
    queryKey: ['training-course', id],
    queryFn: async () => {
      if (!id) return null;
      const [c, items, qs] = await Promise.all([
        supabase.from('training_courses').select('*').eq('id', id).maybeSingle(),
        supabase.from('training_course_items').select('*').eq('course_id', id).order('sort_order'),
        supabase.from('quiz_questions').select('*').eq('course_id', id).order('sort_order'),
      ]);
      if (c.error) throw c.error;
      return {
        course: c.data as TrainingCourse | null,
        items: (items.data ?? []) as CourseItem[],
        questions: (qs.data ?? []) as QuizQuestion[],
      };
    },
    enabled: !!id,
  });
};

export const useCourseMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const create = useMutation({
    mutationFn: async (input: Partial<TrainingCourse>) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('training_courses').insert({
        store_id: profile.store_id,
        created_by: user.id,
        title: input.title || '교육명 없음',
        description: input.description || null,
        training_type: input.training_type || '신입 직원 교육',
        target_roles: input.target_roles || ['full_time','part_time'],
        required: input.required || false,
        due_days: input.due_days ?? 7,
        estimated_minutes: input.estimated_minutes ?? 30,
        status: input.status || 'draft',
        pass_threshold: input.pass_threshold ?? 60,
        allow_quiz_retry: input.allow_quiz_retry ?? true,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-courses'] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<TrainingCourse> & { id: string }) => {
      const { error } = await supabase.from('training_courses').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['training-courses'] });
      qc.invalidateQueries({ queryKey: ['training-course', vars.id] });
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('training_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-courses'] }),
  });
  const addItem = useMutation({
    mutationFn: async (input: Partial<CourseItem>) => {
      const { error } = await supabase.from('training_course_items').insert({
        course_id: input.course_id!,
        item_type: input.item_type || 'manual',
        item_id: input.item_id ?? null,
        title: input.title ?? null,
        sort_order: input.sort_order ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['training-course', v.course_id] }),
  });
  const removeItem = useMutation({
    mutationFn: async ({ id, course_id: _ }: { id: string; course_id: string }) => {
      const { error } = await supabase.from('training_course_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['training-course', v.course_id] }),
  });
  const addQuestion = useMutation({
    mutationFn: async (input: Partial<QuizQuestion>) => {
      const { error } = await supabase.from('quiz_questions').insert({
        course_id: input.course_id!,
        question_type: input.question_type || 'multiple_choice',
        question: input.question || '',
        options: input.options || [],
        correct_answer: input.correct_answer ?? null,
        explanation: input.explanation ?? null,
        points: input.points ?? 10,
        sort_order: input.sort_order ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['training-course', v.course_id] }),
  });
  const removeQuestion = useMutation({
    mutationFn: async ({ id, course_id: _ }: { id: string; course_id: string }) => {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['training-course', v.course_id] }),
  });
  return { create, update, remove, addItem, removeItem, addQuestion, removeQuestion };
};

// ===== Assignments =====
export const useMyAssignments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('training_assignments').select('*, training_courses(title, training_type, required)')
        .eq('assigned_to_user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
};

export const useStoreAssignments = () => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['store-assignments', profile?.store_id],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase.from('training_assignments')
        .select('*, training_courses(title, required), employee_profiles!training_assignments_assigned_to_user_id_fkey(full_name)')
        .eq('store_id', profile.store_id).order('created_at', { ascending: false });
      if (error) {
        // Fallback if FK alias not present
        const f = await supabase.from('training_assignments').select('*').eq('store_id', profile.store_id).order('created_at', { ascending: false });
        if (f.error) throw f.error;
        return f.data ?? [];
      }
      return data ?? [];
    },
    enabled: !!profile?.store_id,
  });
};

export const useAssignmentMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const assign = useMutation({
    mutationFn: async ({ courseId, userIds, dueDate }: { courseId: string; userIds: string[]; dueDate?: string | null }) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');
      const rows = userIds.map((uid) => ({
        course_id: courseId,
        store_id: profile.store_id,
        assigned_to_user_id: uid,
        assigned_by: user.id,
        status: 'not_started',
        due_date: dueDate || null,
      }));
      const { error } = await supabase.from('training_assignments').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-assignments'] });
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
    },
  });
  const updateStatus = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; status?: string; started_at?: string; completed_at?: string; quiz_score?: number; acknowledged_at?: string }) => {
      const { error } = await supabase.from('training_assignments').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      qc.invalidateQueries({ queryKey: ['store-assignments'] });
    },
  });
  return { assign, updateStatus };
};

// ===== Quiz =====
export const useQuizAttempts = (courseId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['quiz-attempts', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return [];
      const { data, error } = await supabase.from('quiz_attempts').select('*')
        .eq('course_id', courseId).eq('user_id', user.id).order('submitted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuizAttempt[];
    },
    enabled: !!courseId && !!user,
  });
};

export const useSubmitQuiz = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ courseId, answers, score, totalPoints, passed }: { courseId: string; answers: any; score: number; totalPoints: number; passed: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('quiz_attempts').insert({
        course_id: courseId, user_id: user.id, answers, score, total_points: totalPoints, passed,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz-attempts'] }),
  });
};

// ===== Acknowledgements =====
export const useAcknowledgements = (articleId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['acks', articleId, user?.id],
    queryFn: async () => {
      if (!articleId) return [];
      const { data, error } = await supabase.from('manual_acknowledgements').select('*')
        .eq('article_id', articleId).order('acknowledged_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!articleId,
  });
};

export const useAcknowledgeArticle = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ articleId, version }: { articleId: string; version: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('manual_acknowledgements').insert({
        article_id: articleId, article_version: version, user_id: user.id,
        signature_method: 'click',
        user_agent: navigator.userAgent,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['acks', v.articleId] }),
  });
};

// ===== Constants =====
export const ARTICLE_CATEGORIES = ['오픈 준비','마감 절차','홀 서비스','주방 운영','고객 응대','클레임 대응','위생 관리','안전 관리','POS 사용법','예약 응대','알레르기 응대','직원 규칙','기타'];
export const RECIPE_CATEGORIES = ['메인 메뉴','사이드','소스','드레싱','디저트','음료','전처리','제조 품목','기타'];
export const TRAINING_TYPES = ['신입 직원 교육','홀 서비스 교육','주방 교육','위생 교육','안전 교육','알레르기 응대 교육','POS 사용 교육','고객 클레임 대응 교육','매장별 교육'];
export const ALLERGENS = ['난류','우유','메밀','땅콩','대두','밀','고등어','게','새우','돼지고기','복숭아','토마토','아황산류','호두','닭고기','쇠고기','오징어','조개류','잣'];
