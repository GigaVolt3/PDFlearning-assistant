/**
 * Study Features API Routes (Summary, Quiz, Flashcards, Keywords, Exam Questions, Notes)
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { getDocumentSummary } from '../services/summaryService.js';
import { getDocumentQuiz } from '../services/quizService.js';
import { getDocumentFlashcards } from '../services/flashcardService.js';
import { getDocumentKeywords } from '../services/keywordService.js';
import { getDocumentQuestions } from '../services/questionService.js';
import { getDocumentNotes, saveDocumentNote } from '../services/notesService.js';

const router = express.Router();

function getCacheAndChunks(docId) {
  const processedDir = path.resolve(process.env.PROCESSED_DIR || '../processed');
  const cacheDir = path.resolve(process.env.CACHE_DIR || '../cache');
  const chunksPath = path.join(processedDir, docId, 'chunks.json');

  if (!fs.existsSync(chunksPath)) {
    throw new Error('Document processing in progress or not found.');
  }

  const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
  return { cacheDir, chunks };
}

// GET /api/study/summary/:docId
router.get('/summary/:docId', async (req, res) => {
  try {
    const { cacheDir, chunks } = getCacheAndChunks(req.params.docId);
    const summary = await getDocumentSummary(req.params.docId, chunks, cacheDir);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study/quiz/:docId
router.get('/quiz/:docId', async (req, res) => {
  try {
    const { cacheDir, chunks } = getCacheAndChunks(req.params.docId);
    const quiz = await getDocumentQuiz(req.params.docId, chunks, cacheDir);
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study/flashcards/:docId
router.get('/flashcards/:docId', async (req, res) => {
  try {
    const { cacheDir, chunks } = getCacheAndChunks(req.params.docId);
    const flashcards = await getDocumentFlashcards(req.params.docId, chunks, cacheDir);
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study/keywords/:docId
router.get('/keywords/:docId', async (req, res) => {
  try {
    const { cacheDir, chunks } = getCacheAndChunks(req.params.docId);
    const keywords = await getDocumentKeywords(req.params.docId, chunks, cacheDir);
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study/questions/:docId
router.get('/questions/:docId', async (req, res) => {
  try {
    const { cacheDir, chunks } = getCacheAndChunks(req.params.docId);
    const questions = await getDocumentQuestions(req.params.docId, chunks, cacheDir);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET & POST /api/study/notes/:docId
router.get('/notes/:docId', (req, res) => {
  const cacheDir = path.resolve(process.env.CACHE_DIR || '../cache');
  const notes = getDocumentNotes(req.params.docId, cacheDir);
  res.json(notes);
});

router.post('/notes/:docId', (req, res) => {
  const cacheDir = path.resolve(process.env.CACHE_DIR || '../cache');
  const notes = saveDocumentNote(req.params.docId, req.body, cacheDir);
  res.json(notes);
});

export default router;
