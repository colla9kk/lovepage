import { API_URL } from './api';

export type MetricType =
  | 'landing_view'
  | 'template_select'
  | 'customization_complete'
  | 'payment_step_open'
  | 'checkout_click'
  | 'pix_created'
  | 'page_view'
  | 'whatsapp_share';

export function trackMetric(type: MetricType, data?: { orderId?: string; pageSlug?: string }) {
  try {
    void fetch(`${API_URL}/api/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
