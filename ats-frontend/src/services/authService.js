import apiClient from './api';

export const authService = {
  async register(email, password, firstName, lastName) {
    const response = await apiClient.post('/api/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    return response.data.data;
  },

  async login(email, password) {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  async logout() {
    // Optional: call backend logout endpoint
    // await apiClient.post('/api/auth/logout');
  },

  async getCurrentUser() {
    const response = await apiClient.get('/api/auth/me');
    return response.data.data;
  },
};