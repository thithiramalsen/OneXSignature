import api from './api';
import { SignedDocument, SignaturePlacement } from '../types';

export const signingService = {
  async signDocument(documentId: string, placements: SignaturePlacement[]): Promise<{ signed_document: SignedDocument }> {
    const response = await api.post<{ signed_document: SignedDocument }>('/signing', {
      document_id: documentId,
      placements,
    });
    return response.data;
  },

  async getSignedDocuments(): Promise<{ signed_documents: SignedDocument[] }> {
    const response = await api.get<{ signed_documents: SignedDocument[] }>('/signing');
    return response.data;
  },

  async downloadSignedDocument(id: string, filename: string): Promise<void> {
    const response = await api.get(`/signing/${id}/download`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `signed_${filename}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  async deleteSignedDocument(id: string): Promise<void> {
    await api.delete(`/signing/${id}`);
  },
};
