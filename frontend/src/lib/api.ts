const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
if (!configuredUrl && process.env.NODE_ENV === 'production') {
  throw new Error('Configure NEXT_PUBLIC_API_URL antes de executar o build.');
}
export const API_URL = (configuredUrl || 'http://localhost:5000').replace(/\/$/, '');
