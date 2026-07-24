import React, { useState, useEffect } from 'react';
import { BookOpen, Key, HelpCircle, FileCheck, Layers, StickyNote, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function StudyHub({ docId, currentPage, onJumpToPage }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [userNote, setUserNote] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fetch feature data when tab changes
  useEffect(() => {
    if (!docId) return;
    setLoading(true);

    fetch(`/api/study/${activeTab}/${docId}`)
      .then(res => res.json())
      .then(resData => {
        setData(prev => ({ ...prev, [activeTab]: resData }));
        setLoading(false);
      })
      .catch(err => {
        console.error(`Error loading ${activeTab}`, err);
        setLoading(false);
      });
  }, [docId, activeTab]);

  // Handle saving new note
  const handleSaveNote = async () => {
    if (!userNote.trim()) return;

    try {
      const res = await fetch(`/api/study/notes/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber: currentPage, content: userNote })
      });
      const updatedNotes = await res.json();
      setData(prev => ({ ...prev, notes: updatedNotes }));
      setUserNote('');
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BookOpen },
    { id: 'keywords', label: 'Keywords', icon: Key },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'quiz', label: 'Quiz', icon: FileCheck },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      
      {/* Tab Navigation Header */}
      <div className="flex items-center space-x-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-xs text-slate-400 space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading {activeTab} data...</span>
          </div>
        ) : (
          <>
            {/* 1. Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm">Executive Overview</h3>
                  {data.summary?.overview ? (
                    <MarkdownRenderer content={data.summary.overview} />
                  ) : (
                    <p className="text-slate-300 leading-relaxed">Summary unavailable.</p>
                  )}
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm">Key Takeaways</h3>
                  <ul className="space-y-1.5">
                    {data.summary?.keyTakeaways?.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-slate-300">
                        <span className="text-indigo-400 font-bold">•</span>
                        <div className="flex-1"><MarkdownRenderer content={takeaway} /></div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 2. Keywords Tab */}
            {activeTab === 'keywords' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white">Extracted Document Terms</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {data.keywords?.keywords?.map((kw, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-300 text-xs">{kw.term}</span>
                        <button
                          onClick={() => onJumpToPage(kw.pageNumber || 1)}
                          className="text-[10px] text-slate-400 hover:text-indigo-400"
                        >
                          Page {kw.pageNumber || 1}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300">{kw.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Exam Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white">Categorized Exam & Interview Questions</h3>
                {data.questions?.questions?.map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        q.marks === 2 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        q.marks === 5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {q.marks} Marks Question
                      </span>
                      <button onClick={() => onJumpToPage(q.pageNumber || 1)} className="text-[10px] text-slate-400 hover:text-indigo-400">
                        Page {q.pageNumber || 1}
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-white">{q.question}</p>
                    <p className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                      💡 <span className="font-medium text-slate-300">Answer Key Hint:</span> {q.hint}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Quiz Tab */}
            {activeTab === 'quiz' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white">Interactive Practice Quiz</h3>
                  {quizSubmitted && (
                    <button
                      onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      Reset Quiz
                    </button>
                  )}
                </div>

                {data.quiz?.questions?.map((q) => (
                  <div key={q.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                    <p className="text-xs font-semibold text-slate-200">{q.id}. {q.question}</p>
                    
                    <div className="space-y-1.5">
                      {q.options?.map((opt, i) => (
                        <button
                          key={i}
                          disabled={quizSubmitted}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-colors border ${
                            quizAnswers[q.id] === opt
                              ? 'bg-indigo-600 text-white border-indigo-500 font-medium'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {quizSubmitted && (
                      <div className={`p-2 rounded-lg text-[11px] flex items-start space-x-2 border ${
                        quizAnswers[q.id] === q.answer
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        {quizAnswers[q.id] === q.answer ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold">Correct Answer: {q.answer}</p>
                          <p className="mt-0.5">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {!quizSubmitted && (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg"
                  >
                    Submit Quiz Answers
                  </button>
                )}
              </div>
            )}

            {/* 5. Flashcards Tab */}
            {activeTab === 'flashcards' && (
              <div className="space-y-4 text-center">
                <h3 className="text-xs font-bold text-white">Study Flashcard Deck</h3>
                
                {data.flashcards?.flashcards?.length > 0 && (
                  <div className="space-y-4">
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="h-44 bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer shadow-xl transition-transform hover:scale-[1.02] relative"
                    >
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2">
                        {isFlipped ? 'Answer (Back)' : 'Question / Concept (Front)'}
                      </span>

                      <p className="text-sm font-semibold text-white">
                        {isFlipped
                          ? data.flashcards.flashcards[flashcardIndex].back
                          : data.flashcards.flashcards[flashcardIndex].front}
                      </p>

                      <span className="text-[10px] text-slate-500 absolute bottom-3">Click card to flip 🔄</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setFlashcardIndex(prev => Math.max(0, prev - 1));
                        }}
                        disabled={flashcardIndex === 0}
                        className="px-3 py-1.5 bg-slate-800 disabled:opacity-30 rounded-lg text-slate-200"
                      >
                        ← Prev Card
                      </button>

                      <span className="text-slate-400">
                        {flashcardIndex + 1} / {data.flashcards.flashcards.length}
                      </span>

                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setFlashcardIndex(prev => Math.min(data.flashcards.flashcards.length - 1, prev + 1));
                        }}
                        disabled={flashcardIndex === data.flashcards.flashcards.length - 1}
                        className="px-3 py-1.5 bg-slate-800 disabled:opacity-30 rounded-lg text-slate-200"
                      >
                        Next Card →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-white">Add Personal Note to Page {currentPage}</h4>
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Write key observations or lecture notes..."
                    className="w-full h-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Save Note
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white">Saved Notes</h4>
                  {Array.isArray(data.notes) && data.notes.map((note) => (
                    <div key={note.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-bold text-indigo-300">Page {note.pageNumber}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-200">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
