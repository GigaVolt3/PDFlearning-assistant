/**
 * Practice Quiz Generator Service (MCQs, True/False, Fill in Blanks)
 * 
 * Auto-generates structured interactive quizzes from document chunks and caches results.
 */

import fs from 'fs';
import path from 'path';
import { generateCompletion } from '../ai/groqManager.js';

export async function getDocumentQuiz(docId, chunks, cacheDir) {
  const cacheFilePath = path.join(cacheDir, `${docId}_quiz.json`);

  if (fs.existsSync(cacheFilePath)) {
    try {
      return { ...JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8')), fromCache: true };
    } catch (e) {}
  }

  // Pick top representative chunks
  const sampleText = chunks.slice(0, 4).map(c => `[Page ${c.pageStart}]: ${c.content.slice(0, 500)}`).join('\n\n');

  const systemPrompt = `You are a quiz authoring AI. Return a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Why this is correct.",
      "pageNumber": 1
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "Statement text...",
      "options": ["True", "False"],
      "answer": "True",
      "explanation": "Explanation...",
      "pageNumber": 2
    }
  ]
}`;

  const userPrompt = `Document Content:\n${sampleText}\n\nGenerate 5 interactive quiz questions (3 MCQs, 2 True/False).`;

  const { content } = await generateCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    { jsonMode: true }
  );

  let quizData;
  try {
    quizData = JSON.parse(content);
  } catch (e) {
    quizData = { questions: [] };
  }

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFilePath, JSON.stringify(quizData, null, 2));

  return { ...quizData, fromCache: false };
}
