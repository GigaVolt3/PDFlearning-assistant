/**
 * Keyword & Definition Extractor Service
 */

import fs from 'fs';
import path from 'path';
import { generateCompletion } from '../ai/groqManager.js';

export async function getDocumentKeywords(docId, chunks, cacheDir) {
  const cacheFilePath = path.join(cacheDir, `${docId}_keywords.json`);

  if (fs.existsSync(cacheFilePath)) {
    try {
      return { ...JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8')), fromCache: true };
    } catch (e) {}
  }

  const sampleText = chunks.slice(0, 5).map(c => c.content.slice(0, 400)).join('\n');

  const systemPrompt = `Return JSON object:
{
  "keywords": [
    { "term": "TCP", "definition": "Transmission Control Protocol...", "category": "Networking", "pageNumber": 1 }
  ]
}`;

  const { content } = await generateCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract 10 key technical terms with definitions:\n${sampleText}` }
    ],
    { jsonMode: true }
  );

  let keywordsData;
  try {
    keywordsData = JSON.parse(content);
  } catch (e) {
    keywordsData = { keywords: [] };
  }

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFilePath, JSON.stringify(keywordsData, null, 2));

  return { ...keywordsData, fromCache: false };
}
