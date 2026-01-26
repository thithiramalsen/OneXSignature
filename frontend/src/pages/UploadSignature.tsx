import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signatureService } from '../services/signatureService';
import { toast } from 'react-toastify';

const UploadSignature: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [isSeal, setIsSeal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      toast.error('Please select a file and provide a name');
      return;
    }

    setLoading(true);
    try {
      await signatureService.uploadSignature(file, name, isSeal);
      toast.success('Signature uploaded and processed successfully');
      navigate('/signatures');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/signatures" className="text-primary-600 hover:text-primary-800">
            ← Back to Signatures
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto py-6 px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Signature/Seal</h2>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image File (PNG, JPG, GIF)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Background will be automatically removed using AI
            </p>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isSeal}
                onChange={(e) => setIsSeal(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">This is a seal (not a signature)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Uploading and Processing...' : 'Upload'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadSignature;
