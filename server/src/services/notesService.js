/**
 * User Notes Manager Service
 */

import fs from 'fs';
import path from 'path';

export function getDocumentNotes(docId, cacheDir) {
  const filePath = path.join(cacheDir, `${docId}_notes.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {}
  }
  return [];
}

export function saveDocumentNote(docId, noteObj, cacheDir) {
  const notes = getDocumentNotes(docId, cacheDir);
  const newNote = {
    id: Date.now(),
    pageNumber: noteObj.pageNumber || 1,
    content: noteObj.content || '',
    createdAt: new Date().toISOString()
  };
  notes.push(newNote);

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = path.join(cacheDir, `${docId}_notes.json`);
  fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));

  return notes;
}
