/**
 * AI Chat & Current Page Explanation Service
 * 
 * Features:
 * 1. Document Chat with Smart Citations & Confidence Level.
 * 2. 4 AI Explain Modes (Beginner, Student, Technical, Exam Revision).
 * 3. Quick Action: Ask / Explain Current Page.
 * 4. AI Reading Assistant (Recommends Related Sections / Pages).
 */

import { generateCompletion } from '../ai/groqManager.js';
import { searchRelevantChunks } from './searchService.js';

/**
 * System Prompts customized per Explain Mode
 */
const EXPLAIN_MODE_PROMPTS = {
  Beginner: 'Explain concepts using simple analogies, friendly tone, and clear everyday examples. Avoid heavy jargon.',
  Student: 'Explain concepts like a top university professor: structured, clear, with core definitions, bullet points, and key takeaways.',
  Technical: 'Provide a rigorous, highly technical breakdown with precise terminology, formulas, specifications, and architecture details.',
  'Exam Revision': 'Focus strictly on high-yield exam points, key formulas, bulleted quick revision notes, and probable test questions.'
};

/**
 * Perform Document Chat query with Smart Citations & Related Sections recommendation.
 * 
 * @param {string} userQuestion - User question
 * @param {Array<object>} allChunks - Document chunks list
 * @param {string} mode - Explain mode ('Beginner' | 'Student' | 'Technical' | 'Exam Revision')
 * @returns {Promise<object>} AI Response containing answer, citations, confidence, related pages, and model used
 */
export async function processDocumentChat(userQuestion, allChunks, mode = 'Student') {
  // 1. Retrieve top matching chunks
  const relevantChunks = searchRelevantChunks(userQuestion, allChunks, 3);
  const contextText = relevantChunks.map(c => `[Pages ${c.pageStart}-${c.pageEnd} | ${c.title}]:\n${c.content}`).join('\n\n---\n\n');

  // Collect source page numbers
  const sourcePages = [];
  relevantChunks.forEach(c => {
    for (let p = c.pageStart; p <= c.pageEnd; p++) {
      if (!sourcePages.includes(p)) sourcePages.push(p);
    }
  });

  const modeInstruction = EXPLAIN_MODE_PROMPTS[mode] || EXPLAIN_MODE_PROMPTS.Student;

  const systemPrompt = `You are an expert AI Smart Learning Assistant reading an educational PDF document.
Target Audience Style: ${modeInstruction}

Guidelines:
- Answer the user's question accurately using ONLY the provided document context.
- Keep the response clear, engaging, and beautifully formatted in GitHub Markdown.
- At the very end of your response, include a list of 2-3 related page numbers from the document for further reading under a heading "### Related Pages".
`;

  const userPrompt = `Document Context:\n${contextText}\n\nUser Question: ${userQuestion}`;

  // Call Groq with fallback
  const { content, modelUsed } = await generateCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  // Determine confidence score based on chunk relevance
  const topScore = relevantChunks[0]?.relevanceScore || 0;
  const confidence = topScore > 5 ? 'High' : topScore > 1 ? 'Medium' : 'General Knowledge';

  // Extract related pages from AI text or fallback to adjacent pages
  const relatedPages = extractRelatedPages(content) || fallbackRelatedPages(sourcePages, allChunks);

  return {
    answer: content,
    citations: sourcePages,
    confidence,
    relatedPages,
    modelUsed
  };
}

/**
 * Handle "Ask / Explain Current Page" feature.
 * Focused strictly on the visible page instead of searching whole document.
 * 
 * @param {number} pageNumber - Current PDF page
 * @param {Array<object>} pagesMarkdown - List of page Objects
 * @param {string} action - 'explain' | 'summarize' | 'questions'
 * @param {string} mode - Explain mode
 */
export async function processCurrentPageAction(pageNumber, pagesMarkdown, action = 'explain', mode = 'Student') {
  const targetPage = pagesMarkdown.find(p => p.pageNumber === pageNumber) || pagesMarkdown[0];
  const pageText = targetPage ? targetPage.markdown : 'Page text not available.';

  const modeInstruction = EXPLAIN_MODE_PROMPTS[mode] || EXPLAIN_MODE_PROMPTS.Student;

  let promptTask = `Explain Page ${pageNumber} thoroughly.`;
  if (action === 'summarize') promptTask = `Provide a 3-bullet executive summary of Page ${pageNumber}.`;
  if (action === 'questions') promptTask = `Generate 4 key practice questions based exclusively on Page ${pageNumber}.`;

  const systemPrompt = `You are a Smart PDF Tutor. ${modeInstruction}`;
  const userPrompt = `Page Content (Page ${pageNumber}):\n${pageText}\n\nTask: ${promptTask}`;

  const { content, modelUsed } = await generateCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  return {
    answer: content,
    pageNumber,
    citations: [pageNumber],
    confidence: 'High',
    relatedPages: [Math.max(1, pageNumber - 1), pageNumber + 1],
    modelUsed
  };
}

/**
 * Helper to parse related pages from AI markdown output
 */
function extractRelatedPages(aiText) {
  const match = aiText.match(/Related Pages:?\s*([^\n]+)/i);
  if (match) {
    const numbers = match[1].match(/\d+/g);
    if (numbers) return numbers.map(Number);
  }
  return null;
}

function fallbackRelatedPages(sourcePages, allChunks) {
  const maxPage = allChunks[allChunks.length - 1]?.pageEnd || 10;
  const base = sourcePages[0] || 1;
  const related = [base + 2, base + 5].filter(p => p <= maxPage && !sourcePages.includes(p));
  return related.length > 0 ? related : [1, 2];
}
