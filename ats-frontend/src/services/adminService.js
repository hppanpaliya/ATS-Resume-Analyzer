import apiClient from './api';

export const adminService = {
  async listUsers(params = {}) {
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data.data;
  },

  async getUser(userId) {
    const response = await apiClient.get(`/api/admin/users/${userId}`);
    return response.data.data;
  },

  async updateUser(userId, payload) {
    const response = await apiClient.patch(`/api/admin/users/${userId}`, payload);
    return response.data.data;
  },

  async setUserPassword(userId, password) {
    const response = await apiClient.post(`/api/admin/users/${userId}/password`, {
      password,
    });
    return response.data.data;
  },

  async revokeUserSessions(userId) {
    const response = await apiClient.post(`/api/admin/users/${userId}/revoke-sessions`);
    return response.data.data;
  },
};
