// Lokasi file: src/hooks/useEvents.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/event.service';
import { AppEvent } from '@/types';

export function useEvents() {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents(),
    staleTime: 1000 * 60 * 30, // Cache 30 menit
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<AppEvent, 'id' | 'createdAt'>) => eventService.createEvent(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<AppEvent> }) => eventService.updateEvent(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  const addEvent = async (data: Omit<AppEvent, 'id' | 'createdAt'>, imageFile?: File | null) => {
    try {
      let imageUrl = data.imageUrl || '';
      if (imageFile) {
        imageUrl = await eventService.uploadImage(imageFile);
      }
      await addMutation.mutateAsync({ ...data, imageUrl });
      return { success: true };
    } catch (err: any) { 
      return { success: false, error: err.message }; 
    }
  };

  const updateEvent = async (id: string, data: Partial<AppEvent>, imageFile?: File | null) => {
    try {
      let imageUrl = data.imageUrl;
      if (imageFile) {
        imageUrl = await eventService.uploadImage(imageFile);
      }
      const finalData = { ...data };
      if (imageUrl !== undefined) finalData.imageUrl = imageUrl;
      
      await updateMutation.mutateAsync({ id, data: finalData });
      return { success: true };
    } catch (err: any) { 
      return { success: false, error: err.message }; 
    }
  };

  const removeEvent = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  return {
    events, loading, error: queryError ? queryError.message : null,
    addEvent, updateEvent, removeEvent
  };
}