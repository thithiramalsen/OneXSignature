import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { signatureService } from '../services/signatureService';
import { signingService } from '../services/signingService';
import { Document, Signature, SignaturePlacement } from '../types';
import { toast } from 'react-toastify';

const SignDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [docData, sigData] = await Promise.all([
        documentService.getDocument(id!),
        signatureService.getSignatures(),
      ]);
      setDocument(docData.document);
      setSignatures(sigData.signatures);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addPlacement = () => {
    if (!selectedSignature) {
      toast.error('Please select a signature first');
      return;
    }

    const newPlacement: SignaturePlacement = {
      signature_id: selectedSignature,
      page_number: 1,
      x_position: 100,
      y_position: 100,
      width: 150,
      height: 50,
      rotation: 0,
    };

    setPlacements([...placements, newPlacement]);
    toast.success('Signature placement added');
  };

  const removePlacement = (index: number) => {
    setPlacements(placements.filter((_, i) => i !== index));
  };

  const handleSign = async () => {
    if (placements.length === 0) {
      toast.error('Please add at least one signature placement');
      return;
    }

    setLoading(true);
    try {
      await signingService.signDocument(id!, placements);
      toast.success('Document signed successfully!');
      navigate('/signed-documents');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to sign document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/documents" className="text-primary-600 hover:text-primary-800">
            ← Back to Documents
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Sign Document: {document?.name}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Document Preview</h3>
              <div className="bg-gray-200 h-96 flex items-center justify-center rounded">
                <p className="text-gray-600">PDF Preview - {document?.page_count} pages</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Signature</h3>
                <select
                  value={selectedSignature}
                  onChange={(e) => setSelectedSignature(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Choose a signature...</option>
                  {signatures.map((sig) => (
                    <option key={sig.id} value={sig.id}>
                      {sig.name} ({sig.is_seal ? 'Seal' : 'Signature'})
                    </option>
                  ))}
                </select>
                <button
                  onClick={addPlacement}
                  className="mt-3 w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
                >
                  Add to Document
                </button>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Placements ({placements.length})
                </h3>
                <div className="space-y-2">
                  {placements.map((placement, index) => {
                    const sig = signatures.find(s => s.id === placement.signature_id);
                    return (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {sig?.name} - Page {placement.page_number}
                        </span>
                        <button
                          onClick={() => removePlacement(index)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSign}
                disabled={loading || placements.length === 0}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Signing...' : 'Sign Document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignDocument;
