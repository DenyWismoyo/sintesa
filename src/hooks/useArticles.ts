// Lokasi file: src/hooks/useArticles.ts

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articleService } from '@/services/article.service';
import { Article } from '@/types';
import { toast } from 'sonner';

export function useArticles(options?: { publishedOnly?: boolean; category?: string; maxLimit?: number }) {
  const queryClient = useQueryClient();
  const queryKey = ['articles', options?.publishedOnly ?? false, options?.category ?? 'Semua', options?.maxLimit ?? 100];

  const {
    data: articles = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => articleService.getArticles(options),
    staleTime: 15 * 60 * 1000, // 15 menit (artikel publik jarang berubah)
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>) => 
      articleService.createArticle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success("Artikel Berhasil Dibuat", { description: "Artikel telah tersimpan di sistem." });
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan Artikel", { description: err.message || "Terjadi kesalahan." });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Article> }) => 
      articleService.updateArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success("Artikel Berhasil Diperbarui");
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui Artikel", { description: err.message || "Terjadi kesalahan." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articleService.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success("Artikel Berhasil Dihapus");
    },
    onError: (err: any) => {
      toast.error("Gagal Menghapus Artikel", { description: err.message || "Terjadi kesalahan." });
    }
  });

  return {
    articles,
    loading,
    error,
    refetch,
    addArticle: addMutation.mutateAsync,
    updateArticle: updateMutation.mutateAsync,
    deleteArticle: deleteMutation.mutateAsync,
    isSubmitting: addMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}

export function useArticleDetail(idOrSlug: string) {
  return useQuery({
    queryKey: ['article', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      // Cek apakah berupa slug atau document ID
      let article = await articleService.getArticleById(idOrSlug);
      if (!article) {
        article = await articleService.getArticleBySlug(idOrSlug);
      }
      if (article?.id) {
        articleService.incrementViewCount(article.id);
      }
      return article;
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(idOrSlug),
  });
}
