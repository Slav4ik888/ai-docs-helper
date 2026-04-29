export const API_BASE = '/api';

export const ENDPOINTS = {
  verifyPin: `${API_BASE}/verify-pin`,
  documents: `${API_BASE}/documents`,
  document: (id: number | string) => `${API_BASE}/documents/${id}`,
  documentsRebuild: `${API_BASE}/documents/rebuild`,
  chat: `${API_BASE}/chat`,
} as const;
