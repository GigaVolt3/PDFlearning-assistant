/**
 * Flashcard Deck Generator Service
 */

import fs from 'fs';
import path from 'path';
import { generateCompletion } from '../ai/groqManager.js';

export async function getDocumentFlashcards(docId, chunks, cacheDir) {
  const cacheFilePath = path.join(cacheDir, `${docId}_flashcards.json`);

  if (fs.existsSync(cacheFilePath)) {
    try {
      return { ...JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8')), fromCache: true };
    } catch (e) {}
  }

  const sampleText = chunks.slice(0, 4).map(c => c.content.slice(0, 400)).join('\n\n');

  const systemPrompt = `Return JSON object:
{
  "flashcards": [
    { "id": 1, "front": "Concept / Question", "back": "Clear concise explanation", "pageNumber": 1 }
  ]
}`;

  const { content } = await generateCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate 6 flashcards for key terms in this text:\n${sampleText}` }
    ],
    { jsonMode: true }
  );

  let cardsData;
  try {
    cardsData = JSON.parse(content);
  } catch (e) {
    cardsData = { flashcards: [] };
  }

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFilePath, JSON.stringify(cardsData, null, 2));

  return { ...cardsData, fromCache: false };
}
