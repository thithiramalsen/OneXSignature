import React, { useState } from 'react';
import { signatureService } from '../services/signatureService';
import { Signature } from '../types';
import { toast } from 'react-toastify';

type SignatureProcessingMode = 'auto' | 'ink-only';

type Props = {
  onUploaded?: (signature: Signature) => void;
  onCancel?: () => void;
  submitLabel?: string;
  loadingLabel?: string;
  showCancelButton?: boolean;
};

const SignatureUploadForm: React.FC<Props> = ({
  onUploaded,
  onCancel,
  submitLabel = 'Upload',
  loadingLabel = 'Uploading and Processing...',
  showCancelButton = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [isSeal, setIsSeal] = useState(false);
  const [processingMode, setProcessingMode] = useState<SignatureProcessingMode>('auto');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;
    setFile(droppedFile);
    if (!name.trim()) {
      setName(droppedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!file || !name.trim()) {
      toast.error('Please select a file and provide a name');
      return;
    }

    setLoading(true);
    try {
      const response = await signatureService.uploadSignature(file, name.trim(), isSeal, processingMode);
      toast.success('Signature uploaded and processed successfully');
      onUploaded?.(response.signature);

      setFile(null);
      setName('');
      setIsSeal(false);
      setProcessingMode('auto');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center text-sm text-gray-600 bg-gray-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        Drag & drop signature image here
        <div className="mt-2 text-xs text-gray-500">or</div>
        <input type="file" accept="image/*" className="mt-2 w-full text-sm" onChange={handleFileChange} required={!file} />
        {file && <p className="mt-2 text-xs text-gray-700">Selected: {file.name}</p>}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <div className="mt-3">
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

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-700 mb-2">Background Processing Model</p>
        <div className="flex flex-col gap-2 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="processingMode"
              value="auto"
              checked={processingMode === 'auto'}
              onChange={() => setProcessingMode('auto')}
            />
            Auto (rembg + cleanup)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="processingMode"
              value="ink-only"
              checked={processingMode === 'ink-only'}
              onChange={() => setProcessingMode('ink-only')}
            />
            Ink-only (strong extraction for paper photos)
          </label>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? loadingLabel : submitLabel}
        </button>
        {showCancelButton && onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 border rounded-md py-2">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default SignatureUploadForm;
