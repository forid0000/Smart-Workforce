import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// ---- Generic ----
export const dashboardAPI = {
  get: () => api.get('/dashboard').then((r) => r.data),
};

export const departmentsAPI = {
  list: () => api.get('/departments').then((r) => r.data),
  create: (data) => api.post('/departments', data).then((r) => r.data),
};

export const employeesAPI = {
  list: (q) => api.get('/employees', { params: q ? { q } : {} }).then((r) => r.data),
  get: (id) => api.get(`/employees/${id}`).then((r) => r.data),
  create: (data) => api.post('/employees', data).then((r) => r.data),
};

export const skillsAPI = {
  list: () => api.get('/skills').then((r) => r.data),
  create: (data) => api.post('/skills', data).then((r) => r.data),
};

export const projectsAPI = {
  list: () => api.get('/projects').then((r) => r.data),
  create: (data) => api.post('/projects', data).then((r) => r.data),
};

export const tasksAPI = {
  list: (params) => api.get('/tasks', { params }).then((r) => r.data),
  get: (id) => api.get(`/tasks/${id}`).then((r) => r.data),
  create: (data) => api.post('/tasks', data).then((r) => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
  recommendations: (id) => api.get(`/tasks/${id}/recommendations`).then((r) => r.data),
  assign: (id, body) => api.post(`/tasks/${id}/assign`, body).then((r) => r.data),
};

export const workLogAPI = {
  list: (taskId) => api.get(`/tasks/${taskId}/work-logs`).then((r) => r.data),
  create: (taskId, body) => api.post(`/tasks/${taskId}/work-logs`, body).then((r) => r.data),
};

export const meAPI = {
  dashboard: (params) => api.get('/me/dashboard', { params }).then((r) => r.data),
};

export default api;