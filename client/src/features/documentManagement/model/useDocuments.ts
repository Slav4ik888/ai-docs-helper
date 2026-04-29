import { useCallback, useEffect, useState } from 'react';
import { documentsApi } from '../api/documentsApi';
import type { Document } from '@entities/document';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentsApi.getAll();
      setDocuments(res.documents || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить документы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addLink = useCallback(
    async (url: string, title?: string) => {
      await documentsApi.addLink(url, title);
      await refetch();
    },
    [refetch],
  );

  const addFile = useCallback(
    async (file: File) => {
      await documentsApi.addFile(file);
      await refetch();
    },
    [refetch],
  );

  const deleteDocument = useCallback(
    async (id: number) => {
      await documentsApi.remove(id);
      await refetch();
    },
    [refetch],
  );

  return { documents, loading, error, refetch, addLink, addFile, deleteDocument };
}
