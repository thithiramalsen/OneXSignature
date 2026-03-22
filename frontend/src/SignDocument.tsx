import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { documentService } from './services/documentService';
import { signatureService } from './services/signatureService';
import { signingService } from './services/signingService';
import { Document, Signature, SignaturePlacement } from './types';
import SignatureUploadForm from './components/SignatureUploadForm';
import ConfirmModal from './components/ConfirmModal';
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
  const [showSignaturePalette, setShowSignaturePalette] = useState(true);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [collapsePaletteSection, setCollapsePaletteSection] = useState(false);
  const [collapseUploadSection, setCollapseUploadSection] = useState(false);
  const [collapseSelectSection, setCollapseSelectSection] = useState(false);
  const [collapsePlacementSection, setCollapsePlacementSection] = useState(false);
  const [draggingSignatureId, setDraggingSignatureId] = useState<string | null>(null);
  const [dragOverPage, setDragOverPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageMeta, setPageMeta] = useState<Record<number, PageMeta>>({});
  const [activePlacement, setActivePlacement] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const pdfViewportRef = useRef<HTMLDivElement | null>(null);
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
  const [deleteSignatureCandidate, setDeleteSignatureCandidate] = useState<Signature | null>(null);

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
    if (selectedSignature || signatures.length === 0) {
      return;
    }

    const sorted = [...signatures].sort((a, b) => {
      const usageA = Number(a.usage_count || 0);
      const usageB = Number(b.usage_count || 0);
      if (usageA !== usageB) {
        return usageB - usageA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setSelectedSignature(sorted[0].id);
  }, [signatures, selectedSignature]);

  useEffect(() => {
    if (!selectedSignature) return;
    const exists = signatures.some((sig) => sig.id === selectedSignature);
    if (!exists) {
      setSelectedSignature('');
    }
  }, [selectedSignature, signatures]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const target = pdfViewportRef.current;
    if (!target) return;

    const updateWidth = () => {
      // Measure inside the actual scroll viewport so right-side scrollbar space is accounted for.
      const available = target.clientWidth;
      setPreviewWidth(Math.max(320, available - 24));
    };

    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(target);

    return () => observer.disconnect();
  }, [rightPanelCollapsed]);

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

  const addPlacementFromDrop = (signatureId: string, pageNumber: number, clientX: number, clientY: number, container: HTMLDivElement) => {
    const meta = pageMeta[pageNumber];
    if (!meta) {
      return;
    }

    const bounds = container.getBoundingClientRect();
    const offsetX = clientX - bounds.left;
    const offsetY = clientY - bounds.top;

    const relativeX = offsetX / bounds.width;
    const relativeY = offsetY / bounds.height;

    const pdfX = relativeX * meta.width;
    const pdfY = relativeY * meta.height;

    const defaultWidth = Math.max(120, Math.round(meta.width * 0.22));
    const defaultHeight = Math.max(40, Math.round(meta.height * 0.08));

    const xPos = Math.max(0, Math.min(pdfX - defaultWidth / 2, meta.width - defaultWidth));
    const yPos = Math.max(0, Math.min(pdfY - defaultHeight / 2, meta.height - defaultHeight));

    const newPlacement: SignaturePlacement = {
      signature_id: signatureId,
      page_number: pageNumber,
      x_position: Math.round(xPos),
      y_position: Math.round(yPos),
      width: defaultWidth,
      height: defaultHeight,
      rotation: 0,
    };

    setPlacementsWithHistory((prev) => {
      const next = [...prev, newPlacement];
      setActivePlacement(next.length - 1);
      return next;
    });
  };

  const removePlacement = useCallback((index: number) => {
    setPlacementsWithHistory((prev) => prev.filter((_, i) => i !== index));
    setActivePlacement((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  }, [setPlacementsWithHistory]);

  // Delete key handling: remove active placement when Delete/Backspace is pressed
  useEffect(() => {
    const handleDeleteKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

      const activeEl = window.document?.activeElement as HTMLElement | null;
      const isTyping = !!(
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')
      );
      if (isTyping) return; // don't delete while typing in a field

      if (activePlacement !== null) {
        e.preventDefault();
        removePlacement(activePlacement);
        setActivePlacement(null);
      }
    };

    window.addEventListener('keydown', handleDeleteKey);
    return () => window.removeEventListener('keydown', handleDeleteKey);
  }, [activePlacement, removePlacement]);

  const updatePlacement = (index: number, updates: Partial<SignaturePlacement>) => {
    setPlacementsWithHistory((prev) => prev.map((placement, i) => (i === index ? { ...placement, ...updates } : placement)));
  };

  const handlePageLoad = (pageNumber: number, pdfWidth: number, pdfHeight: number) => {
    setPageMeta((prev) => ({ ...prev, [pageNumber]: { width: pdfWidth, height: pdfHeight } }));
  };

  const handlePageDoubleClick = (pageNumber: number, event: React.MouseEvent<HTMLDivElement>) => {
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

  const handlePaletteDragStart = (signatureId: string, event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/x-signature-id', signatureId);
    event.dataTransfer.effectAllowed = 'copy';
    setDraggingSignatureId(signatureId);
    setSelectedSignature(signatureId);
  };

  const handlePaletteDragEnd = () => {
    setDraggingSignatureId(null);
    setDragOverPage(null);
  };

  const handlePaletteSelect = (signatureId: string) => {
    setSelectedSignature(signatureId);
  };

  const handleSignatureUploaded = async (uploaded: Signature) => {
    const refreshed = await signatureService.getSignatures();
    setSignatures(refreshed.signatures);
    setSelectedSignature(uploaded.id);
    toast.success('Signature added to palette');
  };

  const handleDeleteSignatureFromPalette = async (signatureId: string) => {
    try {
      await signatureService.deleteSignature(signatureId);
      setPlacementsWithHistory((prev) => prev.filter((p) => p.signature_id !== signatureId));
      const refreshed = await signatureService.getSignatures();
      setSignatures(refreshed.signatures);
      if (selectedSignature === signatureId) {
        setSelectedSignature('');
      }
      toast.success('Signature deleted');
    } catch (error) {
      toast.error('Failed to delete signature');
    }
  };

  const handlePageDragOver = (pageNumber: number, event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes('application/x-signature-id')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setDragOverPage(pageNumber);
    }
  };

  const handlePageDrop = (pageNumber: number, event: React.DragEvent<HTMLDivElement>) => {
    const signatureId = event.dataTransfer.getData('application/x-signature-id');
    if (!signatureId) {
      return;
    }

    event.preventDefault();
    const pageContainer = event.currentTarget as HTMLDivElement;
    setDragOverPage(null);
    setDraggingSignatureId(null);
    setSelectedSignature(signatureId);
    addPlacementFromDrop(signatureId, pageNumber, event.clientX, event.clientY, pageContainer);
    toast.success(`Placed signature on page ${pageNumber}`);
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
        className={`absolute z-20 border-2 ${activePlacement === index ? 'border-primary-600' : 'border-primary-400'} bg-transparent text-xs text-primary-900 pointer-events-auto`}
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
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Signature preview"
            className="absolute inset-0.5 object-contain pointer-events-none"
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
    <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4 tracking-tight">
        Sign Document: {document?.name}
      </h2>

          <div className="flex flex-wrap items-center gap-2 mb-5 text-xs text-slate-600">
            <span className="px-2.5 py-1 bg-white rounded-full border border-slate-200 shadow-sm">Drag to move</span>
            <span className="px-2.5 py-1 bg-white rounded-full border border-slate-200 shadow-sm">Corner handles to resize</span>
            <span className="px-2.5 py-1 bg-white rounded-full border border-slate-200 shadow-sm">Right-click for quick actions</span>
            <span className="px-2.5 py-1 bg-white rounded-full border border-slate-200 shadow-sm">Ctrl+Z / Ctrl+Y</span>
          </div>

      <div className={`grid grid-cols-1 ${rightPanelCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]'} gap-6`}>
            <div className="bg-white/95 shadow-sm rounded-xl border border-slate-200 p-4 sm:p-5" ref={previewRef}>
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Document Preview</h3>
                <p className="text-xs sm:text-sm text-slate-500">Double-click to place, or drag from palette</p>
              </div>

              <div ref={pdfViewportRef} className="bg-slate-100 max-h-[78vh] overflow-auto rounded-xl p-2 sm:p-3">
                {!pdfUrl && (
                  <div className="h-80 flex items-center justify-center text-slate-500">PDF preview unavailable</div>
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
                          className={`relative mb-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mx-auto ${
                            dragOverPage === pageNumber ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                          }`}
                          style={{ width: `${previewWidth}px`, maxWidth: '100%' }}
                          onDoubleClick={(event) => handlePageDoubleClick(pageNumber, event)}
                          onDragOver={(event) => handlePageDragOver(pageNumber, event)}
                          onDragLeave={() => setDragOverPage((prev) => (prev === pageNumber ? null : prev))}
                          onDrop={(event) => handlePageDrop(pageNumber, event)}
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

            {!rightPanelCollapsed && <div className="space-y-4">
              <div className="bg-white/95 shadow-sm rounded-xl border border-slate-200 p-5">
                <button
                  type="button"
                  className="w-full flex items-center justify-between"
                  onClick={() => setCollapsePaletteSection((prev) => !prev)}
                >
                  <h3 className="text-base font-semibold text-gray-900">Signature Palette</h3>
                  <span className="text-sm text-gray-500">{collapsePaletteSection ? 'Expand' : 'Collapse'}</span>
                </button>

                {!collapsePaletteSection && (
                  <>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-500">Click to select, drag to place</p>
                      <button
                        onClick={() => setShowSignaturePalette((prev) => !prev)}
                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-md hover:bg-primary-700"
                      >
                        {showSignaturePalette ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {showSignaturePalette && (
                      <div className="mt-3 max-h-72 overflow-auto space-y-3 pr-1">
                        {signatures.length === 0 && (
                          <p className="text-sm text-gray-500">No signatures available yet. Upload one first.</p>
                        )}

                        {signatures.map((sig) => {
                          const isDragging = draggingSignatureId === sig.id;
                          const isSelected = selectedSignature === sig.id;

                          return (
                            <div
                              key={sig.id}
                              draggable
                              onDragStart={(event) => handlePaletteDragStart(sig.id, event)}
                              onDragEnd={handlePaletteDragEnd}
                              onClick={() => handlePaletteSelect(sig.id)}
                              className={`border rounded-md p-3 bg-gray-50 cursor-grab active:cursor-grabbing transition ${
                                isSelected ? 'border-primary-500 ring-1 ring-primary-300' : 'border-gray-200'
                              } ${isDragging ? 'opacity-60' : ''}`}
                              title="Drag and drop onto the PDF"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-800 truncate pr-2">{sig.name}</p>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                    {sig.is_seal ? 'Seal' : 'Signature'}
                                  </span>
                                  <button
                                    className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteSignatureCandidate(sig);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <div className="border rounded bg-white p-2 flex items-center justify-center h-20">
                                <img src={getSignatureUrl(sig.id)} alt={sig.name} className="max-h-16 object-contain" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-white/95 shadow-sm rounded-xl border border-slate-200 p-5">
                <button
                  type="button"
                  className="w-full flex items-center justify-between"
                  onClick={() => setCollapseUploadSection((prev) => !prev)}
                >
                  <h3 className="text-base font-semibold text-gray-900">Add New Signature</h3>
                  <span className="text-sm text-gray-500">{collapseUploadSection ? 'Expand' : 'Collapse'}</span>
                </button>
                {!collapseUploadSection && (
                  <div className="mt-3">
                    <SignatureUploadForm
                      onUploaded={handleSignatureUploaded}
                      submitLabel="Upload to Palette"
                      loadingLabel="Uploading..."
                    />
                  </div>
                )}
              </div>

              <div className="bg-white/95 shadow-sm rounded-xl border border-slate-200 p-5">
                <button
                  type="button"
                  className="w-full flex items-center justify-between"
                  onClick={() => setCollapseSelectSection((prev) => !prev)}
                >
                  <h3 className="text-base font-semibold text-gray-900">Select Signature</h3>
                  <span className="text-sm text-gray-500">{collapseSelectSection ? 'Expand' : 'Collapse'}</span>
                </button>
                {!collapseSelectSection && (
                  <>
                    <select
                      value={selectedSignature}
                      onChange={(e) => setSelectedSignature(e.target.value)}
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md"
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
                        <p className="text-sm text-gray-600 mb-2">Preview</p>
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
                  </>
                )}
              </div>

              <div className="bg-white/95 shadow-sm rounded-xl border border-slate-200 p-5">
                <button
                  type="button"
                  className="w-full flex items-center justify-between"
                  onClick={() => setCollapsePlacementSection((prev) => !prev)}
                >
                  <h3 className="text-base font-semibold text-gray-900">Placements ({placements.length})</h3>
                  <span className="text-sm text-gray-500">{collapsePlacementSection ? 'Expand' : 'Collapse'}</span>
                </button>

                {!collapsePlacementSection && (
                  <>
                    <div className="mt-3 space-y-4">
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
                  </>
                )}
              </div>

              <button
                onClick={handleSign}
                disabled={loading || placements.length === 0}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Signing...' : 'Sign Document'}
              </button>
            </div>}
          </div>

      <button
        type="button"
        onClick={() => setRightPanelCollapsed((prev) => !prev)}
        className="fixed right-3 top-28 z-30 px-3 py-2 rounded-md bg-white border border-slate-300 shadow-sm text-sm hover:bg-slate-50"
      >
        {rightPanelCollapsed ? 'Show Panel' : 'Hide Panel'}
      </button>

      <ConfirmModal
        open={!!deleteSignatureCandidate}
        title="Delete signature"
        message={`Delete ${deleteSignatureCandidate?.name || 'this signature'} from your palette?`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteSignatureCandidate(null)}
        onConfirm={async () => {
          if (!deleteSignatureCandidate) return;
          await handleDeleteSignatureFromPalette(deleteSignatureCandidate.id);
          setDeleteSignatureCandidate(null);
        }}
      />

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
