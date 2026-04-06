import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DocumentUploadModal from '../components/DocumentUploadModal';
import ConfirmModal from '../components/ConfirmModal';
import { documentService } from '../services/documentService';
import { Document } from '../types';
import { toast } from 'react-toastify';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Document | null>(null);

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
    try {
      await documentService.deleteDocument(id);
      toast.success('Document deleted');
      loadDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div>
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
                          onClick={() => setDeleteCandidate(doc)}
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

      <ConfirmModal
        open={!!deleteCandidate}
        title="Delete document"
        message={`Delete ${deleteCandidate?.name || 'this document'}?`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={async () => {
          if (!deleteCandidate) return;
          await handleDelete(deleteCandidate.id);
          setDeleteCandidate(null);
        }}
      />
    </div>
  );
};

export default Documents;
