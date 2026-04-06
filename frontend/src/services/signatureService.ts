import api from './api';
import { Signature } from '../types';

export const signatureService = {
  async uploadSignature(
    file: File,
    name: string,
    isSeal: boolean,
    processingMode: 'auto' | 'ink-only' = 'auto'
  ): Promise<{ signature: Signature }> {
    const formData = new FormData();
    formData.append('signature', file);
    formData.append('name', name);
    formData.append('is_seal', String(isSeal));
    formData.append('processing_mode', processingMode);

    const response = await api.post<{ signature: Signature }>('/signatures', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getSignatures(): Promise<{ signatures: Signature[] }> {
    const response = await api.get<{ signatures: Signature[] }>('/signatures');
    return response.data;
  },

  async deleteSignature(id: string): Promise<void> {
    await api.delete(`/signatures/${id}`);
  },
};
