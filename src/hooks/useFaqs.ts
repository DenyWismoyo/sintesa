// Lokasi file: src/hooks/useFaqs.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faqService } from '@/services/faq.service';
import { FAQ } from '@/types';

export function useFaqs() {
  const queryClient = useQueryClient();

  const { data: faqs = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => faqService.getFaqs(),
    staleTime: 1000 * 60 * 30, // Cache 30 menit
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<FAQ, 'id' | 'createdAt'>) => faqService.createFaq(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faqs'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<FAQ> }) => faqService.updateFaq(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faqs'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqService.deleteFaq(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faqs'] })
  });

  const addFaq = async (data: Omit<FAQ, 'id' | 'createdAt'>) => {
    try { await addMutation.mutateAsync(data); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const updateFaq = async (id: string, data: Partial<FAQ>) => {
    try { await updateMutation.mutateAsync({ id, data }); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const removeFaq = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  return {
    faqs, loading, error: queryError ? queryError.message : null,
    addFaq, updateFaq, removeFaq
  };
}