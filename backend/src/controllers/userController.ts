import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC'
    );

    return res.json({ users: users.rows });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to load users' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: 'admin' | 'user' };

    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role, created_at',
      [role, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'Role updated', user: updated.rows[0] });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.userId === id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const deleted = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};
