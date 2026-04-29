import { ENDPOINTS } from '@app/config/api';
import { request } from '@shared/api/axiosInstance';
import type { Source } from '@entities/message';

export const chatApi = {
  ask(question: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []) {
    return request<{ answer: string; sources: Source[] }>(ENDPOINTS.chat, {
      method: 'POST',
      body: { question, history },
    });
  },
};
