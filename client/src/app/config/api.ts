export const API_BASE = '/api';

export const ENDPOINTS = {
  verifyPin: `${API_BASE}/verify-pin`,
  documents: `${API_BASE}/documents`,
  document: (id: number | string) => `${API_BASE}/documents/${id}`,
  chat: `${API_BASE}/chat`,
} as const;
