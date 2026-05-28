import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jetro_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jetro_token');
      localStorage.removeItem('jetro_user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { message: 'Network error' });
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  verifyPasscode: (passcode, context) => api.post('/auth/verify-passcode', { passcode, context }),
};

// Applicants
export const applicantAPI = {
  getAll: (params) => api.get('/applicants', { params }),
  getById: (id) => api.get(`/applicants/${id}`),
  create: (data) => api.post('/applicants', data),
  update: (id, data) => api.put(`/applicants/${id}`, data),
  delete: (id) => api.delete(`/applicants/${id}`),
  advanceStage: (id) => api.post(`/applicants/${id}/advance-stage`),
  verifyCibil: (id, data) => api.post(`/applicants/${id}/verify-cibil`, data),
  addCoApplicant: (id, data) => api.post(`/applicants/${id}/co-applicant`, data),
  getStats: () => api.get('/applicants/stats'),
};

// Minting
export const mintingAPI = {
  getPool: (params) => api.get('/minting/pool', { params }),
  mintCard: (data) => api.post('/minting/mint', data),
  managerDecision: (data) => api.post('/minting/decision', data),
  getAnalytics: () => api.get('/minting/analytics'),
};

// Market
export const marketAPI = {
  getLive: () => api.get('/market/live'),
  getCreditAnalysis: () => api.get('/market/credit-analysis'),
};

// Audit
export const auditAPI = {
  getLogs: (params) => api.get('/audit', { params }),
  clearLogs: () => api.delete('/audit/clear'),
};

// DAG
export const dagAPI = {
  getWorkflow: () => api.get('/dag'),
  saveWorkflow: (data) => api.post('/dag/save', data),
  resetWorkflow: () => api.post('/dag/reset'),
};

export default api;