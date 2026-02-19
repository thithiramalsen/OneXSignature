import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name } = req.body;

    if (!name) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Document name is required' });
    }

    // Get PDF page count
    const pdfBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    // Save to database
    const result = await pool.query(
      `INSERT INTO documents (user_id, name, original_filename, file_path, file_size, page_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.userId,
        name,
        req.file.originalname,
        req.file.path,
        req.file.size,
        pageCount,
        'pending',
      ]
    );

    return res.status(201).json({
      message: 'Document uploaded successfully',
      document: result.rows[0],
    });
  } catch (error) {
    console.error('Upload document error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT id, name, original_filename, file_size, page_count, status, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    return res.json({ documents: result.rows });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({ error: 'Failed to get documents' });
  }
};

export const getDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({ document: result.rows[0] });
  } catch (error) {
    console.error('Get document error:', error);
    return res.status(500).json({ error: 'Failed to get document' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get document details
    const document = await pool.query(
      'SELECT file_path FROM documents WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (document.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file
    if (fs.existsSync(document.rows[0].file_path)) {
      fs.unlinkSync(document.rows[0].file_path);
    }

    // Delete from database (cascade will handle related records)
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);

    return res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'SELECT file_path, original_filename FROM documents WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { file_path, original_filename } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.download(file_path, original_filename);
  } catch (error) {
    console.error('Download document error:', error);
    return res.status(500).json({ error: 'Failed to download document' });
  }
};
