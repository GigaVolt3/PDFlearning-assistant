/**
 * Chat & Current Page Action API Routes
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { processDocumentChat, processCurrentPageAction } from '../services/chatService.js';

const router = express.Router();

// Helper to load document chunks from disk
function loadDocChunks(docId) {
  const processedDir = path.resolve(process.env.PROCESSED_DIR || '../processed');
  const chunksPath = path.join(processedDir, docId, 'chunks.json');
  if (!fs.existsSync(chunksPath)) {
    throw new Error('Document chunks not found. Please wait for document processing to complete.');
  }
  return JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
}

// Helper to load document page markdowns from disk
function loadDocPages(docId) {
  const processedDir = path.resolve(process.env.PROCESSED_DIR || '../processed');
  const pagesPath = path.join(processedDir, docId, 'pages.json');
  if (!fs.existsSync(pagesPath)) {
    throw new Error('Document pages not found.');
  }
  return JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
}

/**
 * POST /api/chat/ask
 * Primary Chat endpoint with citations, confidence, and explain modes
 */
router.post('/ask', async (req, res) => {
  try {
    const { docId, question, mode = 'Student' } = req.body;

    if (!docId || !question) {
      return res.status(400).json({ error: 'docId and question are required.' });
    }

    const chunks = loadDocChunks(docId);
    const response = await processDocumentChat(question, chunks, mode);

    res.json(response);
  } catch (error) {
    console.error('[Chat API Error]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/page-action
 * Action endpoint for visible page ("Explain Page", "Summarize Page", "Generate Page Questions")
 */
router.post('/page-action', async (req, res) => {
  try {
    const { docId, pageNumber, action = 'explain', mode = 'Student' } = req.body;

    if (!docId || !pageNumber) {
      return res.status(400).json({ error: 'docId and pageNumber are required.' });
    }

    const pages = loadDocPages(docId);
    const response = await processCurrentPageAction(Number(pageNumber), pages, action, mode);

    res.json(response);
  } catch (error) {
    console.error('[Page Action API Error]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
