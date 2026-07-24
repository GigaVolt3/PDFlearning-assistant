import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Monitor, RefreshCw } from 'lucide-react';

// Configure pdfjs worker with explicit https CDN source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer({ pdfUrl, currentPage, onPageChange, jumpToPage }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [useNativeFallback, setUseNativeFallback] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load PDF Document
  useEffect(() => {
    if (!pdfUrl) return;
    setLoading(true);
    setRenderError(false);

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise
      .then((doc) => {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('PDF.js worker load notice, enabling native viewer mode:', err);
        setLoading(false);
        setUseNativeFallback(true);
      });
  }, [pdfUrl]);

  // Sync jumpToPage prop changes
  useEffect(() => {
    if (jumpToPage && jumpToPage > 0 && jumpToPage <= numPages) {
      onPageChange(jumpToPage);
    }
  }, [jumpToPage, numPages]);

  // Render current page onto HTML5 Canvas with proper renderTask cancellation
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || useNativeFallback) return;

    // Cancel any ongoing render task before starting a new page render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    pdfDoc.getPage(currentPage).then((page) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;

      task.promise
        .then(() => {
          renderTaskRef.current = null;
        })
        .catch((err) => {
          if (err.name !== 'RenderingCancelledException') {
            console.warn('PDF page render notice:', err);
          }
        });
    }).catch(err => {
      console.warn('Page load error:', err);
    });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, useNativeFallback]);

  const handlePrevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < numPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 border-r border-slate-800/80">
      
      {/* Viewer Navigation & Controls Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="font-medium text-white truncate max-w-[160px]">PDF Viewer</span>
        </div>

        {/* Page Jump & Navigation */}
        <div className="flex items-center space-x-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="font-semibold text-white">
            {currentPage} <span className="text-slate-500 font-normal">/ {numPages || 1}</span>
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls & View Mode Toggle */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setScale(prev => Math.max(0.6, prev - 0.15))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] text-slate-400 w-9 text-center">{Math.round(scale * 100)}%</span>

          <button
            onClick={() => setScale(prev => Math.min(2.5, prev + 0.15))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          <button
            onClick={() => setUseNativeFallback(!useNativeFallback)}
            className={`p-1.5 rounded transition-colors text-[11px] flex items-center space-x-1 ${
              useNativeFallback ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Toggle Native PDF Viewer Mode"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{useNativeFallback ? 'Native' : 'Canvas'}</span>
          </button>
        </div>
      </div>

      {/* PDF Page Canvas / Native Embed Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-950/90 relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs">Loading PDF document...</span>
          </div>
        ) : useNativeFallback ? (
          /* Native Embed Fallback Viewer */
          <div className="w-full h-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
            <object
              data={`${pdfUrl}#page=${currentPage}`}
              type="application/pdf"
              className="w-full h-full"
            >
              <embed src={`${pdfUrl}#page=${currentPage}`} type="application/pdf" className="w-full h-full" />
            </object>
          </div>
        ) : (
          /* Canvas Renderer */
          <div className="shadow-2xl border border-slate-800/80 rounded-lg overflow-hidden bg-white max-w-full">
            <canvas ref={canvasRef} className="block max-w-full h-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
