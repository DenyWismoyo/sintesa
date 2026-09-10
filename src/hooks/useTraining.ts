'use client';

import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { trainingService } from '@/services/training.service';
import { Training } from '@/types';

export function useTraining() {
  const queryClient = useQueryClient();

  const { 
    data: trainingData, 
    isLoading: loading, 
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['trainings'],
    queryFn: ({ pageParam }) => trainingService.getPaginatedTrainings(20, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.lastVisible,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const trainings = trainingData?.pages.flatMap(page => page.trainings) || [];
  const error = queryError instanceof Error ? queryError.message : (queryError ? String(queryError) : null);

  const addMutation = useMutation({
    mutationFn: (data: Omit<Training, 'id' | 'registeredCount'>) => trainingService.addTraining(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Training> }) => trainingService.updateTraining(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trainingService.deleteTraining(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] })
  });

  const registerMutation = useMutation({
    mutationFn: ({ trainingId, userData }: { trainingId: string, userData: any }) => 
      trainingService.registerForTraining(trainingId, userData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] })
  });

  // WRAPPERS
  const addTraining = async (data: Omit<Training, 'id' | 'registeredCount'>) => {
    try { await addMutation.mutateAsync(data); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const updateTraining = async (id: string, data: Partial<Training>) => {
    try { await updateMutation.mutateAsync({ id, data }); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const deleteTraining = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  // PERBAIKAN: Tangkap nilai return mutation dan teruskan registrationId
  const registerForTraining = async (trainingId: string, userData: any) => {
    try { 
      const res = await registerMutation.mutateAsync({ trainingId, userData }); 
      return { success: true, registrationId: res.registrationId }; // ID diteruskan ke UI
    } catch (err: any) { 
      return { success: false, error: err.message }; 
    }
  };

  const uploadImage = async (file: File) => {
    try { 
      const url = await trainingService.uploadImage(file);
      return { success: true, url };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    trainings, loading, error, fetchNextPage, hasNextPage, isFetchingNextPage,
    addTraining, updateTraining, deleteTraining, registerForTraining, uploadImage
  };
}