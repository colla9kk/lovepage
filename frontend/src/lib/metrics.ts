import { API_URL } from './api';

export function trackMetric(type: 'landing_view' | 'checkout_click' | 'page_view' | 'whatsapp_share', data?: { orderId?: string; pageSlug?: string }) {
  try {
    void fetch(`${API_URL}/api/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
