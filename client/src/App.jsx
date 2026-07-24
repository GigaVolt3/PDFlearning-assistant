import React, { useState } from 'react';
import UploadModal from './components/UploadModal.jsx';
import PDFViewer from './components/PDFViewer.jsx';
import AIWorkspace from './components/AIWorkspace.jsx';
import StudyHub from './components/StudyHub.jsx';
import { Sparkles, Upload, MessageSquare, GraduationCap, FileText } from 'lucide-react';

export default function App() {
  const [activeDoc, setActiveDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState('chat'); // 'chat' | 'study'
  const [showUploadModal, setShowUploadModal] = useState(true);

  // Auto-load document if docId query param is present in URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlDocId = params.get('docId');
    const urlFilename = params.get('filename') || 'Document.pdf';

    if (urlDocId) {
      setActiveDoc({
        docId: urlDocId,
        filename: urlFilename,
        pdfUrl: `/uploads/${urlDocId}.pdf`
      });
      setShowUploadModal(false);
    }
  }, []);

  // Handle successful PDF upload
  const handleUploadSuccess = (docMeta) => {
    setActiveDoc(docMeta);
    setCurrentPage(1);
    setShowUploadModal(false);
  };

  // Trigger jump to exact PDF page (e.g. when AI citation pill is clicked)
  const handleJumpToPage = (pgNum) => {
    setJumpPage(pgNum);
    setCurrentPage(pgNum);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* App Top Navigation Bar */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight flex items-center space-x-2">
              <span>Smart PDF Assistant</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                v1.0 Pro
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Intelligent PDF Knowledge Base & Groq AI Failover</p>
          </div>
        </div>

        {/* Center: Active Document Title */}
        {activeDoc && (
          <div className="hidden md:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-slate-200 truncate max-w-xs">{activeDoc.filename}</span>
          </div>
        )}

        {/* Right Action: Upload Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
        </div>
      </header>

      {/* Main Split-Pane Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {activeDoc ? (
          <>
            {/* Left Pane: PDF Canvas Viewer */}
            <div className="w-1/2 h-full">
              <PDFViewer
                pdfUrl={activeDoc.pdfUrl}
                currentPage={currentPage}
                onPageChange={(pg) => setCurrentPage(pg)}
                jumpToPage={jumpPage}
              />
            </div>

            {/* Right Pane: AI Workspace & Study Hub */}
            <div className="w-1/2 h-full flex flex-col bg-slate-900/40">
              
              {/* Workspace Mode Switcher (Chat vs Study Hub) */}
              <div className="flex items-center bg-slate-950 border-b border-slate-800 p-1.5">
                <button
                  onClick={() => setRightPanelTab('chat')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                    rightPanelTab === 'chat'
                      ? 'bg-slate-900 text-indigo-400 border border-slate-800 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>AI Chat & Assistant</span>
                </button>

                <button
                  onClick={() => setRightPanelTab('study')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                    rightPanelTab === 'study'
                      ? 'bg-slate-900 text-purple-400 border border-slate-800 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Study Hub & Practice</span>
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelTab === 'chat' ? (
                  <AIWorkspace
                    docId={activeDoc.docId}
                    currentPage={currentPage}
                    onJumpToPage={handleJumpToPage}
                  />
                ) : (
                  <StudyHub
                    docId={activeDoc.docId}
                    currentPage={currentPage}
                    onJumpToPage={handleJumpToPage}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty Workspace Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950 relative overflow-hidden">
            <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white font-display mb-2">Welcome to Smart PDF Assistant</h2>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              Upload any textbook, research paper, or lecture slides PDF to build an interactive AI Knowledge Base with smart citations and practice quizzes.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Select PDF Document to Begin</span>
            </button>
          </div>
        )}
      </main>

      {/* Upload Modal Overlay */}
      {showUploadModal && (
        <UploadModal
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
