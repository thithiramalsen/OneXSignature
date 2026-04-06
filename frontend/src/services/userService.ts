import api from './api';
import { AdminUser } from '../types';

export const userService = {
  async getUsers(): Promise<{ users: AdminUser[] }> {
    const response = await api.get<{ users: AdminUser[] }>('/users');
    return response.data;
  },

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<{ user: AdminUser }> {
    const response = await api.patch<{ user: AdminUser }>(`/users/${id}/role`, { role });
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
