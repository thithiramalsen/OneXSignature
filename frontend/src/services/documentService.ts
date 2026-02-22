import api from './api';
import { Document } from '../types';

export const documentService = {
  async uploadDocument(file: File, name: string): Promise<{ document: Document }> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', name);

    const response = await api.post<{ document: Document }>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getDocuments(): Promise<{ documents: Document[] }> {
    const response = await api.get<{ documents: Document[] }>('/documents');
    return response.data;
  },

  async getDocument(id: string): Promise<{ document: Document }> {
    const response = await api.get<{ document: Document }>(`/documents/${id}`);
    return response.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  async downloadDocument(id: string): Promise<void> {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'document.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  async fetchDocumentBlob(id: string): Promise<Blob> {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
