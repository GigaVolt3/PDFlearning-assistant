/**
 * Categorized Exam & Interview Questions Generator (2M, 5M, 10M)
 */

import fs from 'fs';
import path from 'path';
import { generateCompletion } from '../ai/groqManager.js';

export async function getDocumentQuestions(docId, chunks, cacheDir) {
  const cacheFilePath = path.join(cacheDir, `${docId}_questions.json`);

  if (fs.existsSync(cacheFilePath)) {
    try {
      return { ...JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8')), fromCache: true };
    } catch (e) {}
  }

  const sampleText = chunks.slice(0, 4).map(c => c.content.slice(0, 400)).join('\n');

  const systemPrompt = `Return JSON object:
{
  "questions": [
    { "marks": 2, "question": "Short definition question?", "hint": "Brief answer key", "pageNumber": 1 },
    { "marks": 5, "question": "Medium descriptive question?", "hint": "Core points to mention", "pageNumber": 2 },
    { "marks": 10, "question": "Detailed architectural/essay question?", "hint": "Comprehensive structure", "pageNumber": 3 }
  ]
}`;

  const { content } = await generateCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate 6 exam questions (2 x 2-marks, 2 x 5-marks, 2 x 10-marks):\n${sampleText}` }
    ],
    { jsonMode: true }
  );

  let questionsData;
  try {
    questionsData = JSON.parse(content);
  } catch (e) {
    questionsData = { questions: [] };
  }

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFilePath, JSON.stringify(questionsData, null, 2));

  return { ...questionsData, fromCache: false };
}
