import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DocumentUploadModal from '../components/DocumentUploadModal';
import { documentService } from '../services/documentService';
import { Document } from '../types';
import { toast } from 'react-toastify';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data.documents);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(id);
        toast.success('Document deleted');
        loadDocuments();
      } catch (error) {
        toast.error('Failed to delete document');
      }
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Upload Document
            </button>
          </div>

          {showUploadModal && (
            <DocumentUploadModal
              onClose={() => setShowUploadModal(false)}
              onUploaded={() => loadDocuments()}
            />
          )}

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents yet. Upload your first PDF!
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{doc.name}</h3>
                        <p className="text-sm text-gray-500">
                          {doc.page_count} pages • {(doc.file_size / 1024).toFixed(2)} KB • {doc.status}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/sign/${doc.id}`}
                          className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                        >
                          Sign
                        </Link>
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
    </div>
  );
};

export default Documents;
