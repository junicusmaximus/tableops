import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { SmartVariableConfig } from '@/lib/smartVariables';
import type { DocumentSchema } from '@/lib/documentTypes';

export const useTemplateVersions = (templateId: string | undefined) => {
  return useQuery({
    queryKey: ['doc-template-versions', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('document_template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!templateId,
  });
};

export const useActiveVersion = (templateId: string | undefined) => {
  return useQuery({
    queryKey: ['doc-active-version', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data: tpl } = await supabase
        .from('document_templates')
        .select('active_version_id')
        .eq('id', templateId)
        .maybeSingle();
      const vid = (tpl as any)?.active_version_id;
      if (!vid) return null;
      const { data: v } = await supabase
        .from('document_template_versions')
        .select('*')
        .eq('id', vid)
        .maybeSingle();
      return v;
    },
    enabled: !!templateId,
  });
};

// Check if any sent/signed request exists for this template
export const useTemplateUsage = (templateId: string | undefined) => {
  return useQuery({
    queryKey: ['doc-template-usage', templateId],
    queryFn: async () => {
      if (!templateId) return { used: false, count: 0 };
      const { count } = await supabase
        .from('document_requests')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', templateId);
      return { used: (count ?? 0) > 0, count: count ?? 0 };
    },
    enabled: !!templateId,
  });
};

interface SaveVersionInput {
  templateId: string;
  schema: DocumentSchema;
  variables: SmartVariableConfig[];
  // Force creation of a new version even if current is editable
  forceNewVersion?: boolean;
}

export const useSaveVersion = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ templateId, schema, variables, forceNewVersion }: SaveVersionInput) => {
      if (!user) throw new Error('인증 필요');

      // Check if active version is used
      const { count } = await supabase
        .from('document_requests')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', templateId);

      const hasUsage = (count ?? 0) > 0;
      const shouldCreateNew = forceNewVersion || hasUsage;

      const { data: tpl } = await supabase
        .from('document_templates')
        .select('active_version_id')
        .eq('id', templateId)
        .maybeSingle();

      let versionId = (tpl as any)?.active_version_id as string | undefined;

      if (shouldCreateNew || !versionId) {
        // Find max version number
        const { data: maxRow } = await supabase
          .from('document_template_versions')
          .select('version_number')
          .eq('template_id', templateId)
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextNum = ((maxRow as any)?.version_number ?? 0) + 1;

        const { data: newVer, error: e1 } = await supabase
          .from('document_template_versions')
          .insert({
            template_id: templateId,
            version_number: nextNum,
            template_schema: schema as any,
            smart_variable_schema: variables as any,
            status: 'active',
            created_by: user.id,
          })
          .select()
          .single();
        if (e1) throw e1;

        await supabase
          .from('document_templates')
          .update({ active_version_id: (newVer as any).id, template_schema: schema as any })
          .eq('id', templateId);

        // Save individual smart vars for query/reuse
        if (variables.length > 0) {
          await supabase.from('document_smart_variables').insert(
            variables.map((v) => ({
              template_version_id: (newVer as any).id,
              variable_key: v.variable_key,
              display_name: v.display_name,
              description: v.description ?? null,
              source_type: v.source_type,
              source_table: v.source_table ?? null,
              source_column: v.source_column ?? null,
              input_type: v.input_type,
              required: v.required,
              default_value: v.default_value ?? null,
              editable_by: v.editable_by,
              allow_manual_override: v.allow_manual_override,
              validation_rule: (v.validation_rule ?? null) as any,
              is_custom: v.is_custom,
              category: v.category,
            })),
          );
        }

        return { versionId: (newVer as any).id, isNewVersion: true, versionNumber: nextNum };
      } else {
        // Update existing version in place
        const { error: e2 } = await supabase
          .from('document_template_versions')
          .update({
            template_schema: schema as any,
            smart_variable_schema: variables as any,
          })
          .eq('id', versionId);
        if (e2) throw e2;

        // Replace smart vars
        await supabase.from('document_smart_variables').delete().eq('template_version_id', versionId);
        if (variables.length > 0) {
          await supabase.from('document_smart_variables').insert(
            variables.map((v) => ({
              template_version_id: versionId!,
              variable_key: v.variable_key,
              display_name: v.display_name,
              description: v.description ?? null,
              source_type: v.source_type,
              source_table: v.source_table ?? null,
              source_column: v.source_column ?? null,
              input_type: v.input_type,
              required: v.required,
              default_value: v.default_value ?? null,
              editable_by: v.editable_by,
              allow_manual_override: v.allow_manual_override,
              validation_rule: (v.validation_rule ?? null) as any,
              is_custom: v.is_custom,
              category: v.category,
            })),
          );
        }

        await supabase
          .from('document_templates')
          .update({ template_schema: schema as any })
          .eq('id', templateId);

        return { versionId, isNewVersion: false, versionNumber: null };
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['doc-template-versions', vars.templateId] });
      qc.invalidateQueries({ queryKey: ['doc-active-version', vars.templateId] });
      qc.invalidateQueries({ queryKey: ['doc-template', vars.templateId] });
      qc.invalidateQueries({ queryKey: ['doc-templates'] });
    },
  });
};
