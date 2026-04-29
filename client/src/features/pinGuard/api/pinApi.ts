import { ENDPOINTS } from '@app/config/api';
import { request } from '@shared/api/axiosInstance';

export const pinApi = {
  verify(pin: string) {
    return request<{ success: boolean; token: string }>(ENDPOINTS.verifyPin, {
      method: 'POST',
      body: { pin },
    });
  },
};
