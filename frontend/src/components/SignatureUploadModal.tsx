import React from 'react';
import SignatureUploadForm from './SignatureUploadForm';
import { Signature } from '../types';

type Props = {
  onClose: () => void;
  onUploaded?: () => void;
};

const SignatureUploadModal: React.FC<Props> = ({ onClose, onUploaded }) => {
  const handleUploaded = (_signature: Signature) => {
    onUploaded?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg z-10 w-full max-w-2xl mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upload Signature / Seal</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <SignatureUploadForm
            onUploaded={handleUploaded}
            onCancel={onClose}
            showCancelButton
            submitLabel="Upload"
            loadingLabel="Uploading and Processing..."
          />
        </div>
      </div>
    </div>
  );
};

export default SignatureUploadModal;
