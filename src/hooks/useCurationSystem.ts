// Lokasi file: src/hooks/useCurationSystem.ts
// React Query Hooks untuk Sintesa Universal AI Curation & Assessment Engine

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { curationService } from '@/services/curation.service';
import {
  CurationTemplate,
  CurationAssessment,
  CurationToken,
  CurationDomain,
  CuratorAssessment,
} from '@/types/curation.types';
import { toast } from 'sonner';

export function useCurationTemplates(domain?: CurationDomain) {
  return useQuery({
    queryKey: ['curation_templates', domain || 'ALL'],
    queryFn: () => curationService.getTemplates(domain),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurationTemplateDetail(templateId?: string | null) {
  return useQuery({
    queryKey: ['curation_template', templateId],
    queryFn: () => (templateId ? curationService.getTemplateById(templateId) : null),
    enabled: Boolean(templateId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurationAssessments(domain?: CurationDomain, status?: string) {
  return useQuery({
    queryKey: ['curation_assessments', domain || 'ALL', status || 'ALL'],
    queryFn: () => curationService.getAssessments(domain, status),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCurationTokens() {
  return useQuery({
    queryKey: ['curation_tokens'],
    queryFn: () => curationService.getTokens(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurationMutations() {
  const queryClient = useQueryClient();

  const saveTemplateMutation = useMutation({
    mutationFn: (template: CurationTemplate) => curationService.saveTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curation_templates'] });
      queryClient.invalidateQueries({ queryKey: ['curation_template'] });
      toast.success('Template instrumen kurasi berhasil disimpan!');
    },
    onError: (err: any) => {
      toast.error('Gagal menyimpan template: ' + err.message);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => curationService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curation_templates'] });
      toast.success('Template berhasil dihapus.');
    },
    onError: (err: any) => {
      toast.error('Gagal menghapus template: ' + err.message);
    },
  });

  const updateValidationMutation = useMutation({
    mutationFn: ({
      assessmentId,
      curatorData,
      isFinal,
    }: {
      assessmentId: string;
      curatorData: CuratorAssessment;
      isFinal: boolean;
    }) => curationService.updateCuratorValidation(assessmentId, curatorData, isFinal),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['curation_assessments'] });
      toast.success(
        vars.isFinal
          ? 'Hasil kurasi berhasil divalidasi final & dikunci!'
          : 'Draf evaluasi kurator berhasil disimpan.'
      );
    },
    onError: (err: any) => {
      toast.error('Gagal memvalidasi kurasi: ' + err.message);
    },
  });

  const syncToCatalogMutation = useMutation({
    mutationFn: ({ assessment, catalogPrice }: { assessment: CurationAssessment; catalogPrice: number }) =>
      curationService.syncToCatalogProduct(assessment, catalogPrice),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['curation_assessments'] });
      toast.success(res.message);
    },
    onError: (err: any) => {
      toast.error('Gagal mempromosikan ke E-Katalog: ' + err.message);
    },
  });

  const syncToAlumniMutation = useMutation({
    mutationFn: (assessment: CurationAssessment) => curationService.syncToAlumniProfile(assessment),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['alumnis'] });
      queryClient.invalidateQueries({ queryKey: ['curation_assessments'] });
      toast.success(res.message);
    },
    onError: (err: any) => {
      toast.error('Gagal menyinkronkan profil alumni: ' + err.message);
    },
  });

  const syncToTenantMutation = useMutation({
    mutationFn: (assessment: CurationAssessment) => curationService.syncToTenantIncubation(assessment),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['curation_assessments'] });
      toast.success(res.message);
    },
    onError: (err: any) => {
      toast.error('Gagal menyinkronkan inkubasi tenant: ' + err.message);
    },
  });

  const createTokenMutation = useMutation({
    mutationFn: (tokenData: Omit<CurationToken, 'id' | 'usedCount' | 'createdAt'>) =>
      curationService.createToken(tokenData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curation_tokens'] });
      toast.success('Token batch asesmen berhasil diterbitkan!');
    },
    onError: (err: any) => {
      toast.error('Gagal membuat token: ' + err.message);
    },
  });

  return {
    saveTemplate: saveTemplateMutation,
    deleteTemplate: deleteTemplateMutation,
    updateValidation: updateValidationMutation,
    syncToCatalog: syncToCatalogMutation,
    syncToAlumni: syncToAlumniMutation,
    syncToTenant: syncToTenantMutation,
    createToken: createTokenMutation,
  };
}

