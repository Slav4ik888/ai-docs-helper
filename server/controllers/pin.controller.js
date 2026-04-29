import { verifyPin } from '../services/pin.service.js';

export const pinController = {
  async verify(ctx) {
    const { pin } = ctx.request.body || {};
    const token = await verifyPin(pin);
    if (!token) {
      ctx.status = 401;
      ctx.body = { success: false, error: 'Неверный пин-код' };
      return;
    }
    ctx.body = { success: true, token };
  },
};
