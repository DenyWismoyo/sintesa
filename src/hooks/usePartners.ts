// src/hooks/usePartners.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '@/services/partner.service';
import { partnershipService } from '@/services/partnership.service';
import { PartnerProfile, PartnerTier, TalentInvitation, PartnershipInquiry } from '@/types/partnership.types';
import { JobListing } from '@/types/job.types';

const STALE_5_MIN = 5 * 60 * 1000;

export function useMyPartnerProfile(uid?: string | null, knownPartnerId?: string | null) {
  return useQuery({
    queryKey: ['myPartnerProfile', uid, knownPartnerId],
    queryFn: () => partnerService.getPartnerByUser(uid!, knownPartnerId),
    enabled: Boolean(uid),
    staleTime: STALE_5_MIN,
  });
}

export function useAllPartners(enabled: boolean = true) {
  return useQuery({
    queryKey: ['allPartners'],
    queryFn: () => partnerService.getAllPartners(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function usePartnershipInquiries(enabled: boolean = true) {
  return useQuery({
    queryKey: ['partnershipInquiries'],
    queryFn: () => partnershipService.getAllInquiries(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function useSanitizedTalentPool(enabled: boolean = true) {
  return useQuery({
    queryKey: ['sanitizedTalentPool'],
    queryFn: () => partnerService.getSanitizedTalentPool(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function useSentTalentInvitations(uid?: string | null) {
  return useQuery({
    queryKey: ['sentTalentInvitations', uid],
    queryFn: () => partnerService.getSentInvitationsByUid(uid!),
    enabled: Boolean(uid),
    staleTime: STALE_5_MIN,
  });
}

export function useAllTalentInvitations(enabled: boolean = true) {
  return useQuery({
    queryKey: ['allTalentInvitations'],
    queryFn: () => partnerService.getAllTalentInvitations(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function useAlumniInvitations(alumniId?: string | null) {
  return useQuery({
    queryKey: ['alumniInvitations', alumniId],
    queryFn: () => partnerService.getInvitationsForAlumni(alumniId!),
    enabled: Boolean(alumniId),
    staleTime: 60 * 1000,
  });
}

export function useEntityJobs(params: { partnerId?: string | null; tenantId?: string | null }) {
  const hasEntity = Boolean(params.partnerId || params.tenantId);
  return useQuery({
    queryKey: ['entityJobs', params.partnerId || '', params.tenantId || ''],
    queryFn: () =>
      partnerService.getEntityJobs({
        partnerId: params.partnerId || undefined,
        tenantId: params.tenantId || undefined,
      }),
    enabled: hasEntity,
    staleTime: 60 * 1000,
  });
}

export function usePartnerMutations() {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: string; data: Partial<PartnerProfile> }) =>
      partnerService.updatePartnerProfile(partnerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPartnerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allPartners'] });
    },
  });

  const convertInquiryMutation = useMutation({
    mutationFn: (payload: {
      inquiryId: string;
      tier?: PartnerTier;
      industrySector?: string;
      location?: string;
    }) => partnerService.convertInquiryToPartner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnershipInquiries'] });
      queryClient.invalidateQueries({ queryKey: ['allPartners'] });
    },
  });

  const updateInquiryStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminNotes,
    }: {
      id: string;
      status: PartnershipInquiry['status'];
      adminNotes?: string;
    }) => partnershipService.updateInquiryStatus(id, status, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnershipInquiries'] });
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: (payload: Omit<TalentInvitation, 'id' | 'status' | 'createdAt'>) =>
      partnerService.sendTalentInvitation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentTalentInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['allTalentInvitations'] });
    },
  });

  const updateInvitationStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TalentInvitation['status'] }) =>
      partnerService.updateInvitationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTalentInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['sentTalentInvitations'] });
    },
  });

  const submitJobDraftMutation = useMutation({
    mutationFn: (payload: Partial<JobListing>) => partnerService.submitJobDraft(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityJobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-jobs-management'] });
    },
  });

  const reviewJobMutation = useMutation({
    mutationFn: (params: { id: string; action: 'APPROVE' | 'REJECT'; rejectionReason?: string }) =>
      partnerService.reviewPartnerJob(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs-management'] });
      queryClient.invalidateQueries({ queryKey: ['entityJobs'] });
    },
  });

  const respondInvitationMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'DECLINED' }) =>
      partnerService.respondToInvitation(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumniInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['sentTalentInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['allTalentInvitations'] });
    },
  });

  return {
    updateProfileMutation,
    convertInquiryMutation,
    updateInquiryStatusMutation,
    sendInvitationMutation,
    updateInvitationStatusMutation,
    respondInvitationMutation,
    submitJobDraftMutation,
    reviewJobMutation,
  };
}
