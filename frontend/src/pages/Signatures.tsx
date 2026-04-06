import React, { useState, useEffect } from 'react';
import SignatureUploadModal from '../components/SignatureUploadModal';
import ConfirmModal from '../components/ConfirmModal';
import { signatureService } from '../services/signatureService';
import { Signature } from '../types';
import { toast } from 'react-toastify';

const Signatures: React.FC = () => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Signature | null>(null);

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    try {
      const data = await signatureService.getSignatures();
      setSignatures(data.signatures);
    } catch (error) {
      toast.error('Failed to load signatures');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await signatureService.deleteSignature(id);
      toast.success('Signature deleted');
      loadSignatures();
    } catch (error) {
      toast.error('Failed to delete signature');
    }
  };

  return (
    <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Signatures & Seals</h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Upload Signature
            </button>
          </div>

          {showUploadModal && (
            <SignatureUploadModal
              onClose={() => setShowUploadModal(false)}
              onUploaded={() => loadSignatures()}
            />
          )}

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : signatures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No signatures yet. Upload your first signature or seal!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {signatures.map((sig) => (
                <div key={sig.id} className="bg-white shadow rounded-lg p-4">
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${sig.file_path}`}
                    alt={sig.name}
                    className="w-full h-32 object-contain mb-3 bg-gray-50 rounded"
                  />
                  <h3 className="text-lg font-medium text-gray-900">{sig.name}</h3>
                  <p className="text-sm text-gray-500">
                    {sig.is_seal ? 'Seal' : 'Signature'} • {(sig.file_size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    onClick={() => setDeleteCandidate(sig)}
                    className="mt-3 w-full bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

      <ConfirmModal
        open={!!deleteCandidate}
        title="Delete signature"
        message={`Delete ${deleteCandidate?.name || 'this signature'}?`}
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

export default Signatures;
