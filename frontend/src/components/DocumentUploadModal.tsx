import React, { useState } from 'react';
import { documentService } from '../services/documentService';
import { toast } from 'react-toastify';

type Props = {
  onClose: () => void;
  onUploaded?: () => void;
};

const DocumentUploadModal: React.FC<Props> = ({ onClose, onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) setName(selectedFile.name.replace('.pdf', ''));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!file || !name) {
      toast.error('Please select a file and provide a name');
      return;
    }

    setLoading(true);
    try {
      await documentService.uploadDocument(file, name);
      toast.success('Document uploaded successfully');
      onUploaded?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg z-10 w-full max-w-2xl mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upload Document</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">PDF File</label>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full" required />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Document'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
