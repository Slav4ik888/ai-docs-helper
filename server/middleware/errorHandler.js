export async function errorHandler(ctx, next) {
  try {
    await next();
  } catch (err) {
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    ctx.status = status;
    ctx.body = { error: err.message || 'Internal Server Error' };
    if (status >= 500) {
      console.error('[error]', err);
    }
  }
}
