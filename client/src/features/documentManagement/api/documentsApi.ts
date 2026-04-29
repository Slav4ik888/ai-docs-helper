import { ENDPOINTS } from '@app/config/api';
import { request } from '@shared/api/axiosInstance';
import type { Document } from '@entities/document';

export const documentsApi = {
  getAll() {
    return request<{ documents: Document[] }>(ENDPOINTS.documents);
  },
  addLink(url: string, title?: string) {
    return request<{ document: Document }>(ENDPOINTS.documents, {
      method: 'POST',
      auth: true,
      body: { type: 'link', url, title },
    });
  },
  addFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ document: Document }>(ENDPOINTS.documents, {
      method: 'POST',
      auth: true,
      body: fd,
    });
  },
  remove(id: number) {
    return request<{ success: boolean }>(ENDPOINTS.document(id), {
      method: 'DELETE',
      auth: true,
    });
  },
};
