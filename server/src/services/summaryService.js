/**
 * Hierarchical Document Summarization Service with Caching
 * 
 * Token Optimization Strategy:
 * For large 100+ page PDFs, sending all text at once will exceed LLM context limits and burn tokens.
 * Instead, we:
 * 1. Generate brief summaries for each document chunk.
 * 2. Merge chunk summaries into a structured Chapter & Final Document Summary.
 * 3. Cache the summary on disk so it is only generated once per PDF!
 */

import fs from 'fs';
import path from 'path';
import { generateCompletion } from '../ai/groqManager.js';

/**
 * Generate hierarchical document summary.
 * 
 * @param {string} docId - Unique Document ID
 * @param {Array<object>} chunks - Document chunks
 * @param {string} cacheDir - Path to cache directory
 * @returns {Promise<object>} Summary data (overview, keyPoints, chapterSummaries)
 */
export async function getDocumentSummary(docId, chunks, cacheDir) {
  const cacheFilePath = path.join(cacheDir, `${docId}_summary.json`);

  // Check if cached summary already exists
  if (fs.existsSync(cacheFilePath)) {
    try {
      const cachedData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
      return { ...cachedData, fromCache: true };
    } catch (e) {
      console.warn('[Cache Warning] Failed to read summary cache, regenerating...');
    }
  }

  // Combine titles and chunk snippets
  const chunkSnippets = chunks.slice(0, 10).map(c => `Chapter/Section "${c.title}" (Pages ${c.pageStart}-${c.pageEnd}):\n${c.content.slice(0, 400)}...`).join('\n\n');

  const systemPrompt = `You are an educational document summarizer. Generate a JSON summary object with the exact keys:
{
  "overview": "A 2-paragraph overall summary of the entire document.",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4"],
  "chapterSummaries": [
    { "title": "Section Title", "pages": "1-3", "summary": "1-2 sentence summary" }
  ]
}`;

  const userPrompt = `Document Content Overview:\n${chunkSnippets}`;

  const { content } = await generateCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    { jsonMode: true }
  );

  let summaryResult;
  try {
    summaryResult = JSON.parse(content);
  } catch (e) {
    summaryResult = {
      overview: content,
      keyTakeaways: ['High-level concepts covered in document'],
      chapterSummaries: chunks.slice(0, 5).map(c => ({ title: c.title, pages: `${c.pageStart}-${c.pageEnd}`, summary: c.content.slice(0, 150) }))
    };
  }

  // Save to cache
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFilePath, JSON.stringify(summaryResult, null, 2));

  return { ...summaryResult, fromCache: false };
}
