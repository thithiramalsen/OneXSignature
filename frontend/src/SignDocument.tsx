import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { documentService } from './services/documentService';
import { signatureService } from './services/signatureService';
import { signingService } from './services/signingService';
import { Document, Signature, SignaturePlacement } from './types';
import { toast } from 'react-toastify';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const STATIC_BASE = API_BASE.replace(/\/api\/?$/, '');

interface PageMeta {
  width: number;
  height: number;
}

const SignDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [pageMeta, setPageMeta] = useState<Record<number, PageMeta>>({});
  const [activePlacement, setActivePlacement] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [previewWidth, setPreviewWidth] = useState<number>(860);
  const [dragState, setDragState] = useState<
    | null
    | {
        index: number;
        mode: 'move' | 'resize';
        handle?: 'nw' | 'ne' | 'sw' | 'se';
        startClientX: number;
        startClientY: number;
        startPlacement: SignaturePlacement;
      }
  >(null);
  const undoStack = useRef<SignaturePlacement[][]>([]);
  const redoStack = useRef<SignaturePlacement[][]>([]);
  const dragSnapshotRef = useRef<SignaturePlacement[] | null>(null);
  const blockNextClickRef = useRef(false);
  const placementsRef = useRef<SignaturePlacement[]>(placements);
  const [contextMenu, setContextMenu] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    placementsRef.current = placements;
  }, [placements]);

  const clonePlacements = useCallback((list: SignaturePlacement[]) => list.map((p) => ({ ...p })), []);

  const setPlacementsWithHistory = useCallback((updater: (prev: SignaturePlacement[]) => SignaturePlacement[]) => {
    setPlacements((prev) => {
      const snapshot = clonePlacements(prev);
      const next = updater(prev);
      undoStack.current.push(snapshot);
      if (undoStack.current.length > 100) {
        undoStack.current.shift();
      }
      redoStack.current = [];
      return next;
    });
  }, [clonePlacements]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const previous = undoStack.current.pop()!;
    redoStack.current.push(clonePlacements(placementsRef.current));
    setPlacements(previous);
    setActivePlacement(previous.length ? previous.length - 1 : null);
  }, [clonePlacements]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(clonePlacements(placementsRef.current));
    setPlacements(next);
    setActivePlacement(next.length ? next.length - 1 : null);
  }, [clonePlacements]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [redo, undo]);

  useEffect(() => {
    const closeContext = () => setContextMenu(null);
    window.addEventListener('click', closeContext);
    return () => window.removeEventListener('click', closeContext);
  }, []);

  const getSignatureUrl = (sigId: string) => {
    const sig = signatures.find((s) => s.id === sigId);
    if (!sig) return '';
    const normalizedPath = sig.file_path.startsWith('/') ? sig.file_path : `/${sig.file_path}`;
    return `${STATIC_BASE}${normalizedPath}`;
  };

  const loadData = useCallback(async () => {
    try {
      const [docData, sigData, fileBlob] = await Promise.all([
        documentService.getDocument(id!),
        signatureService.getSignatures(),
        documentService.fetchDocumentBlob(id!),
      ]);
      setDocument(docData.document);
      setSignatures(sigData.signatures);
      const objectUrl = URL.createObjectURL(fileBlob);
      setPdfUrl(objectUrl);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current) {
        setPreviewWidth(previewRef.current.clientWidth - 32);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const addPlacement = () => {
    if (!selectedSignature) {
      toast.error('Please select a signature first');
      return;
    }

    const firstPage = Object.keys(pageMeta).length > 0 ? Math.min(...Object.keys(pageMeta).map(Number)) : 1;
    const newPlacement: SignaturePlacement = {
      signature_id: selectedSignature,
      page_number: firstPage,
      x_position: 80,
      y_position: 80,
      width: 180,
      height: 60,
      rotation: 0,
    };

    setPlacementsWithHistory((prev) => {
      const next = [...prev, newPlacement];
      setActivePlacement(next.length - 1);
      return next;
    });
    toast.success('Placement added. Click on a page to reposition.');
  };

  const removePlacement = (index: number) => {
    setPlacementsWithHistory((prev) => prev.filter((_, i) => i !== index));
    if (activePlacement === index) {
      setActivePlacement(null);
    }
  };

  const updatePlacement = (index: number, updates: Partial<SignaturePlacement>) => {
    setPlacementsWithHistory((prev) => prev.map((placement, i) => (i === index ? { ...placement, ...updates } : placement)));
  };

  const handlePageLoad = (pageNumber: number, pdfWidth: number, pdfHeight: number) => {
    setPageMeta((prev) => ({ ...prev, [pageNumber]: { width: pdfWidth, height: pdfHeight } }));
  };

  const handlePageMouseDown = (pageNumber: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (!selectedSignature) {
      return;
    }

    // If user was dragging, don't create a new placement from that click
    if (dragState) {
      return;
    }

    if (blockNextClickRef.current) {
      blockNextClickRef.current = false;
      return;
    }

    // If the click originated from an interactive placement element, ignore
    const target = event.target as HTMLElement;
    if (target && target.closest('[data-placement-interactive="true"]')) {
      return;
    }

    const meta = pageMeta[pageNumber];
    if (!meta) {
      return;
    }

    const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    const offsetY = event.clientY - bounds.top;

    const relativeX = offsetX / bounds.width;
    const relativeY = offsetY / bounds.height;

    const pdfX = relativeX * meta.width;
    const pdfY = relativeY * meta.height;

    const defaultWidth = meta.width * 0.25;
    const defaultHeight = meta.height * 0.08;

    const xPos = Math.max(0, Math.min(pdfX - defaultWidth / 2, meta.width - defaultWidth));
    const yPos = Math.max(0, Math.min(pdfY - defaultHeight / 2, meta.height - defaultHeight));

    const newPlacement: SignaturePlacement = {
      signature_id: selectedSignature,
      page_number: pageNumber,
      x_position: Math.round(xPos),
      y_position: Math.round(yPos),
      width: Math.round(defaultWidth),
      height: Math.round(defaultHeight),
      rotation: 0,
    };

    setPlacementsWithHistory((prev) => {
      const next = [...prev, newPlacement];
      setActivePlacement(next.length - 1);
      return next;
    });
    setContextMenu(null);
  };

  const startMove = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    blockNextClickRef.current = true;
    dragSnapshotRef.current = clonePlacements(placements);
    setActivePlacement(index);
    setDragState({
      index,
      mode: 'move',
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPlacement: placements[index],
    });
  };

  const startResize = (
    index: number,
    handle: 'nw' | 'ne' | 'sw' | 'se',
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    blockNextClickRef.current = true;
    dragSnapshotRef.current = clonePlacements(placements);
    setActivePlacement(index);
    setDragState({
      index,
      mode: 'resize',
      handle,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPlacement: placements[index],
    });
  };

  // Drag / resize handlers on the window to keep interaction smooth
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (event: MouseEvent) => {
      const { index, mode, handle, startClientX, startClientY, startPlacement } = dragState;
      const placement = placementsRef.current[index];
      if (!placement) return;
      const meta = pageMeta[placement.page_number];
      if (!meta) return;

      const scale = previewWidth / meta.width;
      const deltaX = (event.clientX - startClientX) / scale;
      const deltaY = (event.clientY - startClientY) / scale;

      setPlacements((prev) => {
        const current = prev[index];
        if (!current) return prev;

        let nextPlacement = { ...current };

        if (mode === 'move') {
          nextPlacement.x_position = Math.max(0, Math.min(startPlacement.x_position + deltaX, meta.width - current.width));
          nextPlacement.y_position = Math.max(0, Math.min(startPlacement.y_position + deltaY, meta.height - current.height));
        } else if (mode === 'resize' && handle) {
          const minSize = 20;
          let { x_position, y_position, width, height } = startPlacement;

          if (handle.includes('e')) {
            width = Math.max(minSize, Math.min(meta.width - x_position, startPlacement.width + deltaX));
          }
          if (handle.includes('s')) {
            height = Math.max(minSize, Math.min(meta.height - y_position, startPlacement.height + deltaY));
          }
          if (handle.includes('w')) {
            const newX = Math.max(0, startPlacement.x_position + deltaX);
            const maxWidth = startPlacement.x_position + startPlacement.width - minSize;
            x_position = Math.min(newX, maxWidth);
            width = Math.max(minSize, startPlacement.width - (x_position - startPlacement.x_position));
          }
          if (handle.includes('n')) {
            const newY = Math.max(0, startPlacement.y_position + deltaY);
            const maxHeight = startPlacement.y_position + startPlacement.height - minSize;
            y_position = Math.min(newY, maxHeight);
            height = Math.max(minSize, startPlacement.height - (y_position - startPlacement.y_position));
          }

          nextPlacement = { ...nextPlacement, x_position, y_position, width, height };
        }

        const updated = [...prev];
        updated[index] = nextPlacement;
        return updated;
      });
    };

    const handleUp = () => {
      setDragState(null);
      if (dragSnapshotRef.current) {
        const before = dragSnapshotRef.current;
        const after = placementsRef.current;
        const changed = JSON.stringify(before) !== JSON.stringify(after);
        if (changed) {
          undoStack.current.push(before);
          if (undoStack.current.length > 100) {
            undoStack.current.shift();
          }
          redoStack.current = [];
        }
        dragSnapshotRef.current = null;
      }
      blockNextClickRef.current = true;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragState, pageMeta, previewWidth]);

  const renderPlacementBox = (placement: SignaturePlacement, meta: PageMeta, index: number) => {
    if (!meta) return null;

    const scale = previewWidth / meta.width;
    const renderWidth = meta.width * scale;
    const renderHeight = meta.height * scale;

    const x = (placement.x_position / meta.width) * renderWidth;
    const y = (placement.y_position / meta.height) * renderHeight;
    const width = (placement.width / meta.width) * renderWidth;
    const height = (placement.height / meta.height) * renderHeight;

    const imageUrl = getSignatureUrl(placement.signature_id);

    return (
      <div
        key={`${placement.signature_id}-${placement.page_number}-${x}-${y}`}
        className={`absolute z-20 border-2 ${activePlacement === index ? 'border-primary-600' : 'border-primary-500'} bg-primary-500 bg-opacity-10 text-xs text-primary-900 pointer-events-auto`}
        data-placement-interactive="true"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`,
          transform: `rotate(${placement.rotation || 0}deg)`,
          transformOrigin: 'center',
          cursor: 'move',
        }}
        onMouseDown={(e) => startMove(index, e)}
        onClick={(e) => {
          e.stopPropagation();
          setActivePlacement(index);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ index, x: e.clientX, y: e.clientY });
        }}
      >
        <div className="flex items-center justify-between bg-primary-500 text-white px-2 py-1 text-[11px] select-none">
          <span>{signatures.find((s) => s.id === placement.signature_id)?.name || 'Signature'}</span>
          <button
            className="ml-2 text-white bg-red-600 hover:bg-red-700 rounded px-2 py-0.5 text-[10px]"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              removePlacement(index);
            }}
            aria-label="Delete placement"
          >
            Delete
          </button>
        </div>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Signature preview"
            className="absolute inset-1 object-contain pointer-events-none"
            style={{
              rotate: `${placement.rotation || 0}deg`,
            }}
          />
        )}

        {/* Resize handles */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary-700 rounded-full cursor-nwse-resize"
          style={{ left: '-8px', top: '-8px' }}
          data-placement-interactive="true"
          onMouseDown={(e) => startResize(index, 'nw', e)}
          onClick={(e) => e.stopPropagation()}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary-700 rounded-full cursor-nesw-resize"
          style={{ right: '-8px', top: '-8px' }}
          data-placement-interactive="true"
          onMouseDown={(e) => startResize(index, 'ne', e)}
          onClick={(e) => e.stopPropagation()}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary-700 rounded-full cursor-nesw-resize"
          style={{ left: '-8px', bottom: '-8px' }}
          data-placement-interactive="true"
          onMouseDown={(e) => startResize(index, 'sw', e)}
          onClick={(e) => e.stopPropagation()}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary-700 rounded-full cursor-nwse-resize"
          style={{ right: '-8px', bottom: '-8px' }}
          data-placement-interactive="true"
          onMouseDown={(e) => startResize(index, 'se', e)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
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

          <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
            <span className="px-2 py-1 bg-gray-100 rounded border">Drag to move</span>
            <span className="px-2 py-1 bg-gray-100 rounded border">Corner dots to resize</span>
            <span className="px-2 py-1 bg-gray-100 rounded border">Right-click → menu</span>
            <span className="px-2 py-1 bg-gray-100 rounded border">Ctrl+Z / Ctrl+Y</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6" ref={previewRef}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Document Preview</h3>
                <p className="text-sm text-gray-500">Click anywhere on a page to place the selected signature</p>
              </div>

              <div className="bg-gray-100 max-h-[75vh] overflow-auto rounded-lg p-4">
                {!pdfUrl && (
                  <div className="h-80 flex items-center justify-center text-gray-500">PDF preview unavailable</div>
                )}

                {pdfUrl && (
                  <PdfDocument
                    file={pdfUrl}
                    onLoadError={() => toast.error('Failed to load PDF preview')}
                    loading={<div className="h-80 flex items-center justify-center">Loading PDF...</div>}
                  >
                    {Array.from({ length: document?.page_count || 0 }).map((_, idx) => {
                      const pageNumber = idx + 1;
                      const meta = pageMeta[pageNumber];

                      return (
                        <div
                          key={pageNumber}
                          className="relative mb-6 bg-white border rounded shadow-sm overflow-hidden"
                          onMouseDown={(event) => handlePageMouseDown(pageNumber, event)}
                        >
                          <Page
                            pageNumber={pageNumber}
                            width={previewWidth}
                            onLoadSuccess={(page) => {
                              const viewport = page.getViewport({ scale: 1 });
                              handlePageLoad(page.pageNumber, viewport.width, viewport.height);
                            }}
                          />

                          {meta && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                              {placements
                                .map((p, i) => ({ p, i }))
                                .filter(({ p }) => p.page_number === pageNumber)
                                .map(({ p, i }) => renderPlacementBox(p, meta, i))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </PdfDocument>
                )}
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
                {selectedSignature && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Preview (background removed)</p>
                    <div className="border rounded-md p-3 bg-gray-50 flex items-center justify-center">
                      <img
                        src={getSignatureUrl(selectedSignature)}
                        alt="Selected signature"
                        className="max-h-28 object-contain"
                      />
                    </div>
                  </div>
                )}
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
                <div className="space-y-4">
                  {placements.length === 0 && (
                    <p className="text-sm text-gray-500">No placements yet. Select a signature, then click on the PDF to place it.</p>
                  )}

                  {placements.map((placement, index) => {
                    const sig = signatures.find((s) => s.id === placement.signature_id);
                    const meta = pageMeta[placement.page_number];

                    return (
                      <div
                        key={`${placement.signature_id}-${index}`}
                        className={`p-3 rounded border ${activePlacement === index ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}
                        onClick={() => setActivePlacement(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{sig?.name || 'Signature'} · Page {placement.page_number}</p>
                            <p className="text-xs text-gray-500">X: {Math.round(placement.x_position)} · Y: {Math.round(placement.y_position)}</p>
                          </div>
                          <button
                            onClick={() => removePlacement(index)}
                            className="text-red-600 text-sm hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <label className="flex flex-col text-gray-700">
                            Page
                            <input
                              type="number"
                              min={1}
                              max={document?.page_count || 1}
                              value={placement.page_number}
                              onChange={(e) => updatePlacement(index, { page_number: Number(e.target.value) })}
                              className="mt-1 border rounded px-2 py-1"
                            />
                          </label>
                          <label className="flex flex-col text-gray-700">
                            Rotation (deg)
                            <input
                              type="number"
                              value={placement.rotation || 0}
                              onChange={(e) => updatePlacement(index, { rotation: Number(e.target.value) })}
                              className="mt-1 border rounded px-2 py-1"
                            />
                          </label>
                          <label className="flex flex-col text-gray-700">
                            Width
                            <input
                              type="number"
                              min={20}
                              value={placement.width}
                              onChange={(e) => updatePlacement(index, { width: Number(e.target.value) })}
                              className="mt-1 border rounded px-2 py-1"
                            />
                          </label>
                          <label className="flex flex-col text-gray-700">
                            Height
                            <input
                              type="number"
                              min={20}
                              value={placement.height}
                              onChange={(e) => updatePlacement(index, { height: Number(e.target.value) })}
                              className="mt-1 border rounded px-2 py-1"
                            />
                          </label>
                          <label className="flex flex-col text-gray-700">
                            X Position
                            <input
                              type="number"
                              min={0}
                              value={placement.x_position}
                              onChange={(e) => updatePlacement(index, { x_position: Number(e.target.value) })}
                              className="mt-1 border rounded px-2 py-1"
                            />
                          </label>
                          <label className="flex flex-col text-gray-700">
                            Y Position
                            <input
                              type="number"
                              min={0}
                              value={placement.y_position}
                              onChange={(e) => updatePlacement(index, { y_position: Number(e.target.value) })}
                              className="mt-1 border rounded px-2 py-1"
                            />
                          </label>
                        </div>

                        {meta && (
                          <p className="text-[11px] text-gray-500 mt-2">
                            Page size: {Math.round(meta.width)} × {Math.round(meta.height)} · Placement size: {placement.width} × {placement.height}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {placements.length > 0 && (
                  <button
                    onClick={() => setPlacementsWithHistory(() => [])}
                    className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear placements
                  </button>
                )}
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

      {contextMenu && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div
            className="absolute bg-white border shadow-lg rounded-md py-2 w-44 pointer-events-auto"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                removePlacement(contextMenu.index);
                setContextMenu(null);
              }}
            >
              Delete placement
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignDocument;
