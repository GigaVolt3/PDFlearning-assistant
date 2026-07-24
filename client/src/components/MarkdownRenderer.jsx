import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  return (
    <div className={`markdown-body text-xs text-slate-200 leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-sm font-bold text-indigo-300 mt-3 mb-1.5 border-b border-slate-800 pb-1" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xs font-bold text-indigo-300 mt-2.5 mb-1" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs font-semibold text-indigo-400 mt-2 mb-1" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xs font-medium text-slate-200 mt-1.5 mb-0.5" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 leading-relaxed font-sans" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-indigo-200" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-300" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 my-2 pl-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 pl-1" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-slate-200 leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 text-slate-400 italic bg-indigo-950/20 py-1 rounded-r" {...props} />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-[11px] font-mono" {...props} />
            ) : (
              <code className="block bg-slate-950 text-slate-200 p-2.5 rounded-lg text-[11px] font-mono my-2 overflow-x-auto border border-slate-800" {...props} />
            )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
