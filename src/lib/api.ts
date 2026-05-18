import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.afriknovatech.com/index.php/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('olave_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('olave_token');
      localStorage.removeItem('olave_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const endpoints = {
  login:               '/auth/login',
  register:            '/auth/register',
  logout:              '/auth/logout',
  user:                '/auth/user',
  gerants:             '/auth/gerants',
  lavages:             '/lavages',
  lavage:              (id: string) => `/lavages/${id}`,
  clients:             (lavageId: string) => `/lavages/${lavageId}/clients`,
  client:              (id: string) => `/clients/${id}`,
  laveurs:             (lavageId: string) => `/lavages/${lavageId}/laveurs`,
  laveur:              (id: string) => `/laveurs/${id}`,
  transactions:        (lavageId: string) => `/lavages/${lavageId}/transactions`,
  statsLavage:         (lavageId: string) => `/stats/lavage/${lavageId}`,
  statsCommissions:    (lavageId: string) => `/stats/lavage/${lavageId}/commissions-jour`,
  statsEvolution:      (lavageId: string) => `/stats/lavage/${lavageId}/evolution`,
  products:            (lavageId: string) => `/lavages/${lavageId}/products`,
  product:             (id: string) => `/products/${id}`,
  productCategories:   (lavageId: string) => `/lavages/${lavageId}/product-categories`,
  productLowStock:     (lavageId: string) => `/lavages/${lavageId}/products/low-stock`,
  productRestock:      (id: string) => `/products/${id}/restock`,
  productAdjustStock:  (id: string) => `/products/${id}/adjust-stock`,
  loyaltyStats:        (lavageId: string) => `/lavages/${lavageId}/loyalty/stats`,
  loyaltyLeaderboard:  (lavageId: string) => `/lavages/${lavageId}/loyalty/leaderboard`,

  // Abonnement & plans
  plans:               '/plans',
  subscription:        '/subscription',
  subscriptionUpgrade: '/subscription/upgrade',
  subscriptionPending: '/subscription/pending',
  subscriptionHistory: '/subscription/history',
  checkLimit:          (resource: string) => `/subscription/check-limit/${resource}`,

  // Salaires
  salaires:            (lavageId: string) => `/lavages/${lavageId}/salaires`,
};