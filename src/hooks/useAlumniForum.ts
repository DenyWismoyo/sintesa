// src/hooks/useAlumniForum.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alumniForumService } from '@/services/alumniForum.service';
import { jobApplicationService } from '@/services/jobApplication.service';
import { notificationService } from '@/services/notification.service';
import {
  ForumThread,
  ForumReply,
  ForumZone,
  JobApplication,
  JobApplicationStatus,
  EcosystemNotification,
} from '@/types/alumniForum.types';

const STALE_1_MIN = 60 * 1000;
const STALE_2_MIN = 2 * 60 * 1000;

export function useForumThreads(params: {
  role: string | null;
  channelId?: string;
  vocationalTrack?: string;
  includeFlagged?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [
      'forumThreads',
      params.role,
      params.channelId || 'ALL',
      params.vocationalTrack || 'Semua Kejuruan',
      Boolean(params.includeFlagged),
    ],
    queryFn: () => alumniForumService.getThreads(params),
    enabled: (params.enabled ?? true) && Boolean(params.role),
    staleTime: STALE_1_MIN,
  });
}

export function useForumReplies(threadId?: string | null, zone?: ForumZone) {
  return useQuery({
    queryKey: ['forumReplies', threadId],
    queryFn: () => alumniForumService.getReplies(threadId!, zone || 'ZONE_B_INDUSTRY_BRIDGE'),
    enabled: Boolean(threadId),
    staleTime: STALE_1_MIN,
  });
}

export function useJobLinkedForumThread(jobId?: string | null) {
  return useQuery({
    queryKey: ['jobForumThread', jobId],
    queryFn: () => alumniForumService.getThreadByLinkedJobId(jobId!),
    enabled: Boolean(jobId),
    staleTime: STALE_2_MIN,
  });
}

export function useMyJobApplications(uid?: string | null) {
  return useQuery({
    queryKey: ['myJobApplications', uid],
    queryFn: () => jobApplicationService.getMyApplications(uid!),
    enabled: Boolean(uid),
    staleTime: STALE_1_MIN,
  });
}

export function useEntityJobApplications(params: {
  partnerId?: string | null;
  tenantId?: string | null;
}) {
  const hasEntity = Boolean(params.partnerId || params.tenantId);
  return useQuery({
    queryKey: ['entityJobApplications', params.partnerId || '', params.tenantId || ''],
    queryFn: () =>
      jobApplicationService.getEntityApplications({
        partnerId: params.partnerId || undefined,
        tenantId: params.tenantId || undefined,
      }),
    enabled: hasEntity,
    staleTime: STALE_1_MIN,
  });
}

export function useAllJobApplications(enabled: boolean = true) {
  return useQuery({
    queryKey: ['allJobApplications'],
    queryFn: () => jobApplicationService.getAllApplications(),
    enabled,
    staleTime: STALE_2_MIN,
  });
}

export function useEcosystemNotifications(uid?: string | null, role?: string | null) {
  return useQuery({
    queryKey: ['ecosystemNotifications', uid, role],
    queryFn: () => notificationService.getNotificationsForUser(uid!, role || null),
    enabled: Boolean(uid),
    staleTime: STALE_1_MIN,
  });
}

export function useForumMutations() {
  const queryClient = useQueryClient();

  const createThreadMutation = useMutation({
    mutationFn: (
      payload: Omit<
        ForumThread,
        | 'id'
        | 'upvotedByUids'
        | 'upvoteCount'
        | 'replyCount'
        | 'moderationStatus'
        | 'reportedCount'
        | 'createdAt'
      >
    ) => alumniForumService.createThread(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
      queryClient.invalidateQueries({ queryKey: ['jobForumThread'] });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: (params: {
      thread: ForumThread;
      reply: Omit<
        ForumReply,
        | 'id'
        | 'threadId'
        | 'zone'
        | 'isAcceptedSolution'
        | 'endorsedByMentor'
        | 'upvotedByUids'
        | 'upvoteCount'
        | 'moderationStatus'
        | 'createdAt'
      >;
    }) => alumniForumService.createReply(params),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', vars.thread.id] });
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const toggleUpvoteMutation = useMutation({
    mutationFn: ({ thread, uid }: { thread: ForumThread; uid: string }) =>
      alumniForumService.toggleUpvoteThread(thread, uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const acceptSolutionMutation = useMutation({
    mutationFn: (params: {
      threadId: string;
      replyId: string;
      replyAuthorUid: string;
      threadTitle: string;
    }) => alumniForumService.markAcceptedSolution(params),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', vars.threadId] });
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
      queryClient.invalidateQueries({ queryKey: ['sanitizedTalentPool'] });
    },
  });

  const endorseReplyMutation = useMutation({
    mutationFn: ({ replyId, threadId }: { replyId: string; threadId: string }) =>
      alumniForumService.endorseReplyByMentor(replyId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', vars.threadId] });
      queryClient.invalidateQueries({ queryKey: ['sanitizedTalentPool'] });
    },
  });

  const applyMicroProjectMutation = useMutation({
    mutationFn: ({ thread, uid }: { thread: ForumThread; uid: string }) =>
      alumniForumService.applyToMicroProject(thread, uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const toggleRsvpMutation = useMutation({
    mutationFn: ({ thread, uid }: { thread: ForumThread; uid: string }) =>
      alumniForumService.toggleAmaRsvp(thread, uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const reportThreadMutation = useMutation({
    mutationFn: (threadId: string) => alumniForumService.reportThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const moderateThreadMutation = useMutation({
    mutationFn: (params: {
      threadId: string;
      action: 'APPROVE' | 'DELETE' | 'PIN_TOGGLE';
      currentPin?: boolean;
    }) => alumniForumService.moderateThread(params.threadId, params.action, params.currentPin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const promoteReferralMutation = useMutation({
    mutationFn: (thread: ForumThread) => alumniForumService.promoteReferralThreadToJob(thread),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const submitJobApplicationMutation = useMutation({
    mutationFn: (payload: Omit<JobApplication, 'id' | 'status' | 'createdAt'>) =>
      jobApplicationService.submitApplication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['entityJobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['allJobApplications'] });
    },
  });

  const updateJobApplicationStatusMutation = useMutation({
    mutationFn: (params: {
      id: string;
      applicantUid: string;
      jobTitle: string;
      companyName: string;
      status: JobApplicationStatus;
      statusNote?: string;
    }) => jobApplicationService.updateApplicationStatus(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityJobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['allJobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['myJobApplications'] });
    },
  });

  const broadcastNotificationMutation = useMutation({
    mutationFn: (payload: Omit<EcosystemNotification, 'id' | 'readByUids' | 'createdAt'>) =>
      notificationService.createNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecosystemNotifications'] });
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: ({ notifId, uid }: { notifId: string; uid: string }) =>
      notificationService.markAsRead(notifId, uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecosystemNotifications'] });
    },
  });

  return {
    createThreadMutation,
    createReplyMutation,
    toggleUpvoteMutation,
    acceptSolutionMutation,
    endorseReplyMutation,
    applyMicroProjectMutation,
    toggleRsvpMutation,
    reportThreadMutation,
    moderateThreadMutation,
    promoteReferralMutation,
    submitJobApplicationMutation,
    updateJobApplicationStatusMutation,
    broadcastNotificationMutation,
    markNotificationReadMutation,
  };
}

