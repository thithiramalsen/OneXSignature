import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { userService } from '../services/userService';
import { AdminUser } from '../types';
import { toast } from 'react-toastify';

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data.users);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (target: AdminUser, role: 'admin' | 'user') => {
    if (target.role === role) return;

    try {
      await userService.updateUserRole(target.id, role);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role } : u)));
      toast.success(`Updated role for ${target.full_name}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update role');
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return;

    try {
      await userService.deleteUser(deleteUserTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteUserTarget.id));
      toast.success('User deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleteUserTarget(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-600 mt-1">Admin-only controls for user roles and access.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.full_name}{isSelf ? ' (You)' : ''}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(u, e.target.value as 'admin' | 'user')}
                          className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => setDeleteUserTarget(u)}
                          className="px-3 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteUserTarget}
        title="Delete user"
        message={`Are you sure you want to delete ${deleteUserTarget?.full_name || 'this user'}? This removes all related documents and signatures.`}
        confirmLabel="Delete User"
        danger
        onCancel={() => setDeleteUserTarget(null)}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
};

export default AdminUsers;
