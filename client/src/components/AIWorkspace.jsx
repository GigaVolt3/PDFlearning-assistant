import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, CheckCircle, Compass, Zap, BookOpen, HelpCircle, Layers } from 'lucide-react';

const EXPLAIN_MODES = [
  { id: 'Beginner', label: 'Beginner', desc: 'Simple analogies' },
  { id: 'Student', label: 'Student', desc: 'Structured learning' },
  { id: 'Technical', label: 'Technical', desc: 'In-depth specs' },
  { id: 'Exam Revision', label: 'Exam Revision', desc: 'High-yield points' },
];

export default function AIWorkspace({ docId, currentPage, onJumpToPage }) {
  const [explainMode, setExplainMode] = useState('Student');
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your Smart PDF AI Tutor. Ask me any question about the uploaded document, or try the quick actions below for your current page.',
      citations: [],
      confidence: null,
      relatedPages: [],
      modelUsed: 'llama-3.3-70b-versatile'
    }
  ]);

  // Handle document chat submit
  const handleSendMessage = async (queryText = inputQuery) => {
    if (!queryText.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: queryText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          question: queryText,
          mode: explainMode
        })
      });

      const data = await res.json();

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.answer || 'Sorry, I could not process your query.',
        citations: data.citations || [],
        confidence: data.confidence || 'High',
        relatedPages: data.relatedPages || [],
        modelUsed: data.modelUsed || 'llama-3.3-70b-versatile'
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Error connecting to AI service. Please check API key or retry.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Action on Current Page
  const handlePageAction = async (actionType) => {
    if (loading) return;
    setLoading(true);

    const actionLabels = {
      explain: `Explain Page ${currentPage}`,
      summarize: `Summarize Page ${currentPage}`,
      questions: `Generate questions from Page ${currentPage}`
    };

    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text: actionLabels[actionType] }
    ]);

    try {
      const res = await fetch('/api/chat/page-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          pageNumber: currentPage,
          action: actionType,
          mode: explainMode
        })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.answer,
          citations: [currentPage],
          confidence: 'High',
          relatedPages: data.relatedPages || [],
          modelUsed: data.modelUsed || 'llama-3.3-70b-versatile'
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60">
      
      {/* 1. Explain Mode Selector Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-slate-200">AI Explain Mode:</span>
          </div>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 font-medium">
            Active: {explainMode}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {EXPLAIN_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setExplainMode(mode.id)}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all text-center truncate border ${
                explainMode === mode.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={mode.desc}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Quick Actions Bar for Visible PDF Page */}
      <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs overflow-x-auto">
        <span className="text-slate-400 text-[11px] flex items-center space-x-1 flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Page {currentPage} Actions:</span>
        </span>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={() => handlePageAction('explain')}
            disabled={loading}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-md text-[11px] transition-colors border border-slate-700/60 flex items-center space-x-1"
          >
            <BookOpen className="w-3 h-3 text-indigo-400" />
            <span>Explain Page</span>
          </button>

          <button
            onClick={() => handlePageAction('summarize')}
            disabled={loading}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-purple-600 text-slate-200 hover:text-white rounded-md text-[11px] transition-colors border border-slate-700/60 flex items-center space-x-1"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Summarize Page</span>
          </button>

          <button
            onClick={() => handlePageAction('questions')}
            disabled={loading}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-pink-600 text-slate-200 hover:text-white rounded-md text-[11px] transition-colors border border-slate-700/60 flex items-center space-x-1"
          >
            <HelpCircle className="w-3 h-3 text-pink-400" />
            <span>Page Questions</span>
          </button>
        </div>
      </div>

      {/* 3. Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-lg'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
              </div>

              {/* AI Citations & Model Failover Badge */}
              {msg.sender === 'ai' && msg.citations?.length > 0 && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-2 text-[11px]">
                  
                  {/* Smart Citation Panel */}
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-slate-300">Sources & Citations</span>
                    </div>
                    {msg.confidence && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Confidence: {msg.confidence}
                      </span>
                    )}
                  </div>

                  {/* Clickable Page Jump Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.citations.map((pg) => (
                      <button
                        key={pg}
                        onClick={() => onJumpToPage(pg)}
                        className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white rounded-md border border-indigo-500/30 transition-colors flex items-center space-x-1 text-[11px] font-medium"
                      >
                        <span>✓ Page {pg}</span>
                      </button>
                    ))}
                  </div>

                  {/* AI Reading Assistant: Related Pages Recommendation */}
                  {msg.relatedPages?.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center space-x-2 text-slate-400 text-[10px]">
                      <Compass className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span>Suggested Reading:</span>
                      <div className="flex space-x-1">
                        {msg.relatedPages.map((rPg) => (
                          <button
                            key={rPg}
                            onClick={() => onJumpToPage(rPg)}
                            className="text-amber-300 hover:underline"
                          >
                            → Page {rPg}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Model Indicator */}
                  {msg.modelUsed && (
                    <div className="text-[9px] text-slate-500 font-mono text-right pt-1">
                      Engine: {msg.modelUsed}
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-300 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400 p-3 bg-slate-900/60 border border-slate-800 rounded-xl w-max">
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <span>AI is reading chunks & synthesizing response...</span>
          </div>
        )}
      </div>

      {/* 4. Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800"
      >
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus-within:border-indigo-500/60 transition-colors">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about the PDF document..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg transition-colors flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
