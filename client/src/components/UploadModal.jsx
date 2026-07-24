import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function UploadModal({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [docId, setDocId] = useState(null);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle file select
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setErrorMessage('Please select a valid PDF document.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const [uploadedFilePath, setUploadedFilePath] = useState('');

  // Submit file to backend
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('PDF upload failed');
      }

      const data = await res.json();
      setDocId(data.docId);
      if (data.filePath) {
        setUploadedFilePath(data.filePath);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error uploading file.');
      setIsUploading(false);
    }
  };

  // Poll processing status every 1s once docId is set
  useEffect(() => {
    if (!docId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/status/${docId}`);
        const data = await res.json();
        setStatus(data);

        if (data.stage === 'ready') {
          clearInterval(interval);
          setTimeout(() => {
            onUploadSuccess({
              docId,
              filename: selectedFile?.name || 'Document.pdf',
              pdfUrl: uploadedFilePath || `/uploads/${docId}.pdf`
            });
          }, 800);
        } else if (data.stage === 'error') {
          clearInterval(interval);
          setErrorMessage(data.error || 'Document processing error.');
          setIsUploading(false);
        }
      } catch (err) {
        console.error('Status poll error', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [docId, uploadedFilePath, selectedFile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-display">Upload Document</h2>
            <p className="text-xs text-slate-400">Select any PDF to create an AI-powered Knowledge Base</p>
          </div>
        </div>

        {!isUploading ? (
          <div className="space-y-4">
            {/* File Dropzone */}
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-950/50 hover:bg-slate-950 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
              <Upload className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 group-hover:scale-110 transition-transform mb-3" />
              <p className="text-sm font-medium text-slate-300">
                {selectedFile ? selectedFile.name : 'Click to select or drag PDF file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports textbooks, papers, slides up to 50MB</p>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {errorMessage && (
              <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleUploadSubmit}
              disabled={!selectedFile}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Process PDF Document</span>
            </button>
          </div>
        ) : (
          /* Live Document Processing Status UI */
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="font-medium text-indigo-400">Processing Knowledge Base...</span>
                <span>{status?.progress || 10}%</span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${status?.progress || 10}%` }}
                ></div>
              </div>
            </div>

            {/* Pipeline Step Indicators */}
            <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              {status?.steps?.map((step) => (
                <div key={step.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center space-x-2.5">
                    {step.status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : step.status === 'running' ? (
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0"></div>
                    )}
                    <span className={step.status === 'done' ? 'text-slate-200' : step.status === 'running' ? 'text-indigo-300 font-medium' : 'text-slate-500'}>
                      {step.label}
                    </span>
                  </div>
                  {step.status === 'running' && (
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      Processing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
