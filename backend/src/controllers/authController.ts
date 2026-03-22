import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const validateRegistrationInput = (email: string, password: string, fullName: string) => {
  if (!email || !password || !fullName) {
    return 'All fields are required';
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }

  if (fullName.length < 2 || fullName.length > 100) {
    return 'Full name must be between 2 and 100 characters';
  }

  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must be at least 8 characters and include at least one letter and one number';
  }

  return null;
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email: rawEmail, password: rawPassword, full_name: rawFullName } = req.body;

    if (
      typeof rawEmail !== 'string' ||
      typeof rawPassword !== 'string' ||
      typeof rawFullName !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const email = normalizeEmail(rawEmail);
    const password = rawPassword.trim();
    const full_name = rawFullName.trim();

    const validationError = validateRegistrationInput(email, password, full_name);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Check if user already exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at',
      [email, hashedPassword, full_name, 'user']
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret as jwt.Secret,
      { expiresIn: config.jwt.expire as jwt.SignOptions['expiresIn'] }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return res.status(400).json({ error: 'User already exists' });
    }

    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email: rawEmail, password: rawPassword } = req.body;

    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const email = normalizeEmail(rawEmail);
    const password = rawPassword.trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret as jwt.Secret,
      { expiresIn: config.jwt.expire as jwt.SignOptions['expiresIn'] }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
};
