import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { signPDFWithPlacements } from '../services/pdfService';
import fs from 'fs';

interface SignaturePlacementData {
  signature_id: string;
  page_number: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  rotation?: number;
}

export const signDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { document_id, placements } = req.body as {
      document_id: string;
      placements: SignaturePlacementData[];
    };

    if (!document_id || !placements || !Array.isArray(placements) || placements.length === 0) {
      return res.status(400).json({ error: 'Document ID and placements are required' });
    }

    // Get document
    const documentResult = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [document_id, req.user.userId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documentResult.rows[0];

    // Get all signatures used in placements
    const signatureIds = placements.map(p => p.signature_id);
    const signaturesResult = await pool.query(
      'SELECT * FROM signatures WHERE id = ANY($1) AND user_id = $2',
      [signatureIds, req.user.userId]
    );

    if (signaturesResult.rows.length !== signatureIds.length) {
      return res.status(400).json({ error: 'One or more signatures not found' });
    }

    // Create signed PDF
    const signedPdfPath = await signPDFWithPlacements(
      document.file_path,
      placements,
      signaturesResult.rows
    );

    // Get file size
    const stats = fs.statSync(signedPdfPath);

    // Save signed document to database
    const signedDocResult = await pool.query(
      `INSERT INTO signed_documents (document_id, user_id, file_path, file_size)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [document_id, req.user.userId, signedPdfPath, stats.size]
    );

    const signedDocument = signedDocResult.rows[0];

    // Save signature placements
    for (const placement of placements) {
      await pool.query(
        `INSERT INTO signature_placements 
         (signed_document_id, signature_id, page_number, x_position, y_position, width, height, rotation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          signedDocument.id,
          placement.signature_id,
          placement.page_number,
          placement.x_position,
          placement.y_position,
          placement.width,
          placement.height,
          placement.rotation || 0,
        ]
      );
    }

    // Update document status
    await pool.query(
      'UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['signed', document_id]
    );

    return res.status(201).json({
      message: 'Document signed successfully',
      signed_document: signedDocument,
    });
  } catch (error) {
    console.error('Sign document error:', error);
    return res.status(500).json({ error: 'Failed to sign document' });
  }
};

export const getSignedDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT sd.*, d.name as document_name, d.original_filename
       FROM signed_documents sd
       JOIN documents d ON sd.document_id = d.id
       WHERE sd.user_id = $1
       ORDER BY sd.created_at DESC`,
      [req.user.userId]
    );

    return res.json({ signed_documents: result.rows });
  } catch (error) {
    console.error('Get signed documents error:', error);
    return res.status(500).json({ error: 'Failed to get signed documents' });
  }
};

export const downloadSignedDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT sd.file_path, d.original_filename
       FROM signed_documents sd
       JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1 AND sd.user_id = $2`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signed document not found' });
    }

    const { file_path, original_filename } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const signedFilename = `signed_${original_filename}`;
    return res.download(file_path, signedFilename);
  } catch (error) {
    console.error('Download signed document error:', error);
    return res.status(500).json({ error: 'Failed to download signed document' });
  }
};

export const deleteSignedDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get signed document details
    const signedDoc = await pool.query(
      'SELECT file_path FROM signed_documents WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (signedDoc.rows.length === 0) {
      return res.status(404).json({ error: 'Signed document not found' });
    }

    // Delete file
    if (fs.existsSync(signedDoc.rows[0].file_path)) {
      fs.unlinkSync(signedDoc.rows[0].file_path);
    }

    // Delete from database (cascade will handle placements)
    await pool.query('DELETE FROM signed_documents WHERE id = $1', [id]);

    return res.json({ message: 'Signed document deleted successfully' });
  } catch (error) {
    console.error('Delete signed document error:', error);
    return res.status(500).json({ error: 'Failed to delete signed document' });
  }
};
