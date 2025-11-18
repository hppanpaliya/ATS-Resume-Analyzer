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
    try {
      // console.log('[authService] Calling login API...');
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });
      // console.log('[authService] Full response:', response);
      // console.log('[authService] Response data:', response.data);
      // console.log('[authService] Response data.data:', response.data.data);
      return response.data.data;
    } catch (error) {
      // Handle login-specific errors
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password. Please try again.');
      }
      if (error.response?.status === 400) {
        throw new Error('Please check your email and password format.');
      }
      // Re-throw other errors
      throw error;
    }
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