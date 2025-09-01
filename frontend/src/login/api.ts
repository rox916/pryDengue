import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const login = async (embedding: number[]) => {
  console.log('Sending login request with embedding length:', embedding.length);
  const response = await api.post('/login', { embedding });
  return response.data;
};

export const register = async (nombre: string, embedding: number[]) => {
  console.log('Sending register request with embedding length:', embedding.length);
  const response = await api.post('/register', { nombre, embedding });
  return response.data;
};

export const getMetrics = async () => {
  const response = await api.get('/metrics');
  return response.data;
};