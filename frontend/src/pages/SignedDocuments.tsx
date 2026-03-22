import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signingService } from '../services/signingService';
import { SignedDocument } from '../types';
import { toast } from 'react-toastify';

const SignedDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<SignedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await signingService.getSignedDocuments();
      setDocuments(data.signed_documents);
    } catch (error) {
      toast.error('Failed to load signed documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      await signingService.downloadSignedDocument(id, filename);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this signed document?')) {
      try {
        await signingService.deleteSignedDocument(id);
        toast.success('Signed document deleted');
        loadDocuments();
      } catch (error) {
        toast.error('Failed to delete signed document');
      }
    }
  };

  const handlePreview = async (id: string, filename: string) => {
    try {
      setPreviewLoading(true);
      const api = (await import('../services/api')).default;
      const response = await api.get(`/signing/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(url);
      setPreviewTitle(`signed_${filename}`);
      setPreviewOpen(true);
    } catch (error) {
      toast.error('Failed to preview document');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/dashboard" className="text-primary-600 hover:text-primary-800">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Signed Documents</h2>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No signed documents yet. Sign your first document!
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{doc.document_name}</h3>
                        <p className="text-sm text-gray-500">
                          Signed on {new Date(doc.created_at).toLocaleDateString()} • {(doc.file_size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreview(doc.id, doc.original_filename)}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                          disabled={previewLoading}
                        >
                          {previewLoading ? 'Opening...' : 'Preview'}
                        </button>
                        <button
                          onClick={() => handleDownload(doc.id, doc.original_filename)}
                          className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">Preview: {previewTitle}</h3>
              <button
                onClick={closePreview}
                className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
            <div className="flex-1 bg-gray-100">
              {previewUrl ? (
                <iframe title="Signed document preview" src={previewUrl} className="w-full h-full" />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600">Loading preview...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignedDocuments;
