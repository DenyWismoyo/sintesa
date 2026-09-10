'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { tenantService } from '@/services/tenant.service';
import { Tenant, TeamMember, StartupProduct, StartupMilestone, TenantMonev, TenantKPI, MentoringSession, TenantRevenue } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase'; 
import { getAppId } from '@/lib/appId';

export function useTenants() {
  const queryClient = useQueryClient();

  const triggerCacheRebuild = async () => {
    try {
      const appId = getAppId();
      const rebuildTenantMasterCache = httpsCallable(functions, 'rebuildTenantMasterCache');
      
      rebuildTenantMasterCache({ appId }).then(() => {
        console.log("[CACHE] Cache Master Tenant berhasil diperbarui.");
      }).catch(err => {
        console.error("[CACHE ERROR] Gagal memperbarui Cache Master Tenant", err);
      });
    } catch (error) {
      console.error("[CACHE ERROR] Terjadi kesalahan trigger", error);
    }
  };

  // QUERY: MENGAMBIL SELURUH TENANT DARI CACHE (1 Read)
  const {
    data: allTenants = [],
    isLoading: loadingAll,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['allTenants'],
    queryFn: tenantService.getAllTenants,
    staleTime: 1000 * 60 * 2, // 2 menit agar tidak refetch berlebihan tiap window focus tapi tetap responsif
  });

  const { data: tenantData, isLoading: loading, error: queryError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['tenants'],
    queryFn: ({ pageParam }) => tenantService.getPaginatedTenants(20, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined, getNextPageParam: (lastPage) => lastPage.lastVisible,
    staleTime: 1000 * 60 * 30, refetchOnWindowFocus: false,
  });

  const tenants = tenantData?.pages.flatMap(page => page.tenants) || [];

  const useTenantProfile = (identifier: string | null | undefined) => useQuery({ 
    queryKey: ['tenantProfile', identifier], 
    queryFn: async () => {
      if (!identifier) return null;
      if (identifier.includes('@')) {
        return await tenantService.getTenantByEmail(identifier);
      }
      const userDoc = await getDoc(doc(db, 'users', identifier));
      if (userDoc.exists() && userDoc.data().tenantId) {
        const tenantDoc = await getDoc(doc(db, 'tenants', userDoc.data().tenantId));
        if (tenantDoc.exists()) {
          return { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
        }
      }
      return null;
    }, 
    enabled: !!identifier, 
    staleTime: 1000 * 60 * 30 
  });

  const addMutation = useMutation({ 
    mutationFn: async ({ id, data }: { id?: string; data: Partial<Tenant> }) => {
    },
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['allTenants'] }); 
        queryClient.invalidateQueries({ queryKey: ['tenants'] }); 
        triggerCacheRebuild();
    } 
  });

  const updateMutation = useMutation({ 
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tenant> }) => tenantService.updateTenant(id, data), 
    onSuccess: (_, variables) => { 
        queryClient.setQueryData(['allTenants'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((tenant: any) =>
            tenant.id === variables.id ? { ...tenant, ...variables.data } : tenant
          );
        });

        queryClient.invalidateQueries({ queryKey: ['tenants'] }); 
        queryClient.invalidateQueries({ queryKey: ['tenantProfile'] }); 
        triggerCacheRebuild(); 
    } 
  });

  const removeMutation = useMutation({ 
    mutationFn: async (id: string) => tenantService.deleteTenant(id), 
    onSuccess: (_, deletedId) => { 
        queryClient.setQueryData(['allTenants'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter((t: any) => t.id !== deletedId);
        });
        queryClient.invalidateQueries({ queryKey: ['tenants'] }); 
        triggerCacheRebuild();
    } 
  });

  const addTenant = async (data: Omit<Tenant, 'id' | 'createdAt'>, logoFile?: File | null, docFile?: File | null) => {
    try {
      const docRef = await tenantService.createTenant(data);
      const newTenantId = docRef.id;

      let logoUrl = '';
      let legalDocUrl = '';
      const uploadTasks = [];
      if (logoFile) uploadTasks.push(tenantService.uploadFile(newTenantId, logoFile, 'logos').then(url => logoUrl = url));
      if (docFile) uploadTasks.push(tenantService.uploadFile(newTenantId, docFile, 'documents').then(url => legalDocUrl = url));
      await Promise.all(uploadTasks);
      
      if (logoUrl || legalDocUrl) {
        await tenantService.updateTenant(newTenantId, { 
          ...(logoUrl ? { logoUrl } : {}),
          ...(legalDocUrl ? { legalDocUrl } : {})
        });
      }

      queryClient.invalidateQueries({ queryKey: ['allTenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      triggerCacheRebuild();

      return { success: true };
    } catch (err: any) { return { success: false, error: err.message }; }
  };

  const submitCuration = async (tenantData: Omit<Tenant, 'id' | 'createdAt'>, productData: any) => {
    try {
      await tenantService.submitCurationApplication(tenantData, productData);
      queryClient.invalidateQueries({ queryKey: ['allTenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      triggerCacheRebuild();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateTenant = async (id: string, data: Partial<Tenant>, logoFile?: File | null, docFile?: File | null, pitchDeckFile?: File | null, coverImageFile?: File | null) => {
    try {
      let { logoUrl, legalDocUrl, pitchDeckUrl, coverImageUrl } = data;
      const uploadTasks = [];
      if (logoFile) uploadTasks.push(tenantService.uploadFile(id, logoFile, 'logos').then(url => logoUrl = url));
      if (docFile) uploadTasks.push(tenantService.uploadFile(id, docFile, 'documents').then(url => legalDocUrl = url));
      if (pitchDeckFile) uploadTasks.push(tenantService.uploadFile(id, pitchDeckFile, 'documents').then(url => pitchDeckUrl = url));
      if (coverImageFile) uploadTasks.push(tenantService.uploadFile(id, coverImageFile, 'covers').then(url => coverImageUrl = url));
      await Promise.all(uploadTasks);

      const finalData = { ...data };
      if (logoUrl !== undefined) finalData.logoUrl = logoUrl;
      if (legalDocUrl !== undefined) finalData.legalDocUrl = legalDocUrl;
      if (pitchDeckUrl !== undefined) finalData.pitchDeckUrl = pitchDeckUrl;
      if (coverImageUrl !== undefined) finalData.coverImageUrl = coverImageUrl;

      await updateMutation.mutateAsync({ id, data: finalData });
      return { success: true };
    } catch (err: any) { return { success: false, error: err.message }; }
  };

  const removeTenant = async (id: string) => { try { await removeMutation.mutateAsync(id); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };

  return { 
    tenants, 
    loading, 
    allTenants, 
    loadingAll,
    refetchAll,
    error: queryError ? queryError.message : null, 
    fetchNextPage, hasNextPage, isFetchingNextPage, 
    addTenant, submitCuration, updateTenant, removeTenant, useTenantProfile 
  };
}

export function useTenantTeam(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: teamMembers = [], isLoading } = useQuery({ queryKey: ['tenantTeam', tenantId], queryFn: () => tenantId ? tenantService.getTeamMembers(tenantId) : [], enabled: !!tenantId });
  const addMember = useMutation({ mutationFn: (data: Omit<TeamMember, 'id'>) => tenantService.addTeamMember(tenantId!, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantTeam', tenantId] }) });
  const updateMember = useMutation({ mutationFn: ({ memberId, data }: { memberId: string, data: Partial<TeamMember> }) => tenantService.updateTeamMember(tenantId!, memberId, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantTeam', tenantId] }) });
  const removeMember = useMutation({ mutationFn: (memberId: string) => tenantService.deleteTeamMember(tenantId!, memberId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantTeam', tenantId] }) });
  return { teamMembers, isLoading, addMember, updateMember, removeMember };
}

export function useTenantProducts(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ['tenantProducts', tenantId], queryFn: () => tenantId ? tenantService.getStartupProducts(tenantId) : [], enabled: !!tenantId });
  
  const addProduct = useMutation({ mutationFn: (data: Omit<StartupProduct, 'id'>) => tenantService.addStartupProduct(tenantId!, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantProducts', tenantId] }) });
  
  const updateProduct = useMutation({ mutationFn: ({ productId, data }: { productId: string, data: Partial<StartupProduct> }) => tenantService.updateStartupProduct(tenantId!, productId, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantProducts', tenantId] }) });
  
  const removeProduct = useMutation({ mutationFn: (productId: string) => tenantService.deleteStartupProduct(tenantId!, productId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantProducts', tenantId] }) });
  return { products, isLoading, addProduct, updateProduct, removeProduct };
}

export function useTenantMilestones(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: milestones = [], isLoading } = useQuery({ queryKey: ['tenantMilestones', tenantId], queryFn: () => tenantId ? tenantService.getMilestones(tenantId) : [], enabled: !!tenantId });
  const addMilestone = useMutation({ mutationFn: (data: Omit<StartupMilestone, 'id'>) => tenantService.addMilestone(tenantId!, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantMilestones', tenantId] }) });
  const updateMilestone = useMutation({ mutationFn: ({ milestoneId, data }: { milestoneId: string, data: Partial<StartupMilestone> }) => tenantService.updateMilestone(tenantId!, milestoneId, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantMilestones', tenantId] }) });
  const removeMilestone = useMutation({ mutationFn: (milestoneId: string) => tenantService.deleteMilestone(tenantId!, milestoneId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantMilestones', tenantId] }) });
  return { milestones, isLoading, addMilestone, updateMilestone, removeMilestone };
}

export function useTenantMonev(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: monevs = [], isLoading } = useQuery({ queryKey: ['tenantMonevs', tenantId], queryFn: () => tenantId ? tenantService.getMonevs(tenantId) : [], enabled: !!tenantId });
  const addMonev = useMutation({ mutationFn: (data: Omit<TenantMonev, 'id'>) => tenantService.addMonev(tenantId!, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantMonevs', tenantId] }) });
  const removeMonev = useMutation({ mutationFn: (monevId: string) => tenantService.deleteMonev(tenantId!, monevId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantMonevs', tenantId] }) });
  return { monevs, isLoading, addMonev, removeMonev };
}

export function useTenantKPI(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: kpis = [], isLoading } = useQuery({ queryKey: ['tenantKPIs', tenantId], queryFn: () => tenantId ? tenantService.getKPIs(tenantId) : [], enabled: !!tenantId });
  const addKPI = useMutation({ mutationFn: (data: Omit<TenantKPI, 'id'>) => tenantService.addKPI(tenantId!, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tenantKPIs', tenantId] }); queryClient.invalidateQueries({ queryKey: ['tenants'] }); } });
  const removeKPI = useMutation({ mutationFn: (kpiId: string) => tenantService.deleteKPI(tenantId!, kpiId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantKPIs', tenantId] }) });
  return { kpis, isLoading, addKPI, removeKPI };
}

export function useTenantMentoring(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading } = useQuery({ queryKey: ['tenantMentoring', tenantId], queryFn: () => tenantId ? tenantService.getMentoringSessions(tenantId) : [], enabled: !!tenantId });
  const addSession = useMutation({ mutationFn: (data: Omit<MentoringSession, 'id'>) => tenantService.addMentoringSession(tenantId!, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantMentoring', tenantId] }) });
  const updateSession = useMutation({ mutationFn: ({ sessionId, data }: { sessionId: string, data: Partial<MentoringSession> }) => tenantService.updateMentoringSession(tenantId!, sessionId, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantMentoring', tenantId] }) });
  const removeSession = useMutation({ mutationFn: (sessionId: string) => tenantService.deleteMentoringSession(tenantId!, sessionId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantMentoring', tenantId] }) });
  return { sessions, isLoading, addSession, updateSession, removeSession };
}

export function useTenantRevenue(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: revenues = [], isLoading } = useQuery({ 
    queryKey: ['tenantRevenues', tenantId], 
    queryFn: () => tenantId ? tenantService.getTenantRevenues(tenantId) : [], 
    enabled: !!tenantId 
  });
  
  const addRevenue = useMutation({ mutationFn: (data: Omit<TenantRevenue, 'id'>) => tenantService.addTenantRevenue(tenantId!, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantRevenues', tenantId] }) });
  const removeRevenue = useMutation({ mutationFn: (revenueId: string) => tenantService.deleteTenantRevenue(tenantId!, revenueId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenantRevenues', tenantId] }) });
  
  return { revenues, isLoading, addRevenue, removeRevenue };
}