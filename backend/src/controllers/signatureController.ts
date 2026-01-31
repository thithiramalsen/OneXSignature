import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { processSignatureWithRembg } from '../services/rembgService';
import fs from 'fs';
import path from 'path';

export const uploadSignature = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, is_seal } = req.body;
    const isSeal = is_seal === 'true' || is_seal === true;

    if (!name) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Signature name is required' });
    }

    // Process image with rembg to remove background
    const processedPath = await processSignatureWithRembg(req.file.path);

    // Move processed file to signatures directory
    const finalFilename = `${Date.now()}_${path.basename(processedPath)}`;
    const finalPath = path.join('uploads/signatures', finalFilename);
    fs.renameSync(processedPath, finalPath);

    // Get file size
    const stats = fs.statSync(finalPath);

    // Save to database
    const result = await pool.query(
      `INSERT INTO signatures (user_id, name, original_filename, processed_filename, file_path, file_size, is_seal)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.userId,
        name,
        req.file.originalname,
        finalFilename,
        finalPath,
        stats.size,
        isSeal,
      ]
    );

    // Clean up temp file if it still exists
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      message: 'Signature uploaded successfully',
      signature: result.rows[0],
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    // Clean up files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload signature' });
  }
};

export const getSignatures = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT id, name, original_filename, file_path, file_size, is_seal, created_at FROM signatures WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ signatures: result.rows });
  } catch (error) {
    console.error('Get signatures error:', error);
    res.status(500).json({ error: 'Failed to get signatures' });
  }
};

export const deleteSignature = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get signature details
    const signature = await pool.query(
      'SELECT file_path FROM signatures WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (signature.rows.length === 0) {
      return res.status(404).json({ error: 'Signature not found' });
    }

    // Delete file
    if (fs.existsSync(signature.rows[0].file_path)) {
      fs.unlinkSync(signature.rows[0].file_path);
    }

    // Delete from database
    await pool.query('DELETE FROM signatures WHERE id = $1', [id]);

    res.json({ message: 'Signature deleted successfully' });
  } catch (error) {
    console.error('Delete signature error:', error);
    res.status(500).json({ error: 'Failed to delete signature' });
  }
};
