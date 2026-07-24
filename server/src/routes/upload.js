/**
 * PDF Upload & Document Processing Pipeline Route with Progress Streaming
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractPdfPages } from '../parser/pdfExtractor.js';
import { convertPageToMarkdown } from '../parser/markdownConverter.js';
import { processPageDiagrams } from '../parser/imageExtractor.js';
import { generateDocumentChunks } from '../parser/chunkGenerator.js';

const router = express.Router();

// Store live upload & conversion status per document ID
const documentProcessingStatus = new Map();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9\.]/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size limit
});

/**
 * GET /api/upload/status/:docId
 * Live progress polling endpoint for Document Processing Status UI
 */
router.get('/status/:docId', (req, res) => {
  const status = documentProcessingStatus.get(req.params.docId) || {
    progress: 0,
    stage: 'idle',
    message: 'Waiting for upload...',
    steps: []
  };
  res.json(status);
});

/**
 * POST /api/upload
 * Primary PDF Upload and background processing pipeline initialization
 */
router.post('/', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file provided.' });
  }

  const docId = path.parse(req.file.filename).name;
  const filePath = req.file.path;
  const processedDir = path.resolve(process.env.PROCESSED_DIR || '../processed');

  // Initialize progress status
  const statusObj = {
    docId,
    progress: 10,
    stage: 'uploading',
    message: 'PDF uploaded successfully. Starting pipeline...',
    steps: [
      { id: 'upload', label: 'Uploading PDF...', status: 'done' },
      { id: 'extract', label: 'Extracting text', status: 'pending' },
      { id: 'markdown', label: 'Converting Markdown', status: 'pending' },
      { id: 'images', label: 'Extracting images', status: 'pending' },
      { id: 'vision', label: 'Processing diagrams', status: 'pending' },
      { id: 'chunks', label: 'Creating chunks', status: 'pending' },
      { id: 'ready', label: 'Ready', status: 'pending' }
    ]
  };
  documentProcessingStatus.set(docId, statusObj);

  // Send fast immediate response with docId so UI can start listening to progress
  res.json({
    message: 'PDF uploaded successfully. Processing started.',
    docId,
    filename: req.file.originalname,
    filePath: `/uploads/${req.file.filename}`
  });

  // Execute processing pipeline asynchronously
  runProcessingPipeline(docId, filePath, processedDir, statusObj);
});

/**
 * Async pipeline execution function
 */
async function runProcessingPipeline(docId, pdfPath, processedDir, statusObj) {
  const updateStatus = (progress, stage, stepId, stepStatus) => {
    statusObj.progress = progress;
    statusObj.stage = stage;
    const step = statusObj.steps.find(s => s.id === stepId);
    if (step) step.status = stepStatus;
    documentProcessingStatus.set(docId, { ...statusObj });
  };

  try {
    // 1. Extract Text
    updateStatus(25, 'extracting_text', 'extract', 'running');
    const { totalPages, pages } = await extractPdfPages(pdfPath);
    updateStatus(40, 'text_extracted', 'extract', 'done');

    // 2. Convert to Markdown
    updateStatus(50, 'converting_markdown', 'markdown', 'running');
    const pagesMarkdown = [];
    let fullMarkdownText = '';

    for (const page of pages) {
      const md = convertPageToMarkdown(page.pageNumber, page.text);
      pagesMarkdown.push({ pageNumber: page.pageNumber, markdown: md });
      fullMarkdownText += `\n\n${md}`;
    }
    updateStatus(65, 'markdown_converted', 'markdown', 'done');

    // 3. Extract Images & Vision AI
    updateStatus(75, 'processing_images', 'images', 'running');
    updateStatus(80, 'processing_vision', 'vision', 'running');

    // Process figures per page with Vision AI (falls back safely if absent)
    for (let i = 0; i < pagesMarkdown.length; i++) {
      const page = pagesMarkdown[i];
      const { pageMarkdown } = await processPageDiagrams(page.pageNumber, page.markdown);
      pagesMarkdown[i].markdown = pageMarkdown;
    }
    updateStatus(85, 'vision_processed', 'vision', 'done');
    updateStatus(85, 'images_done', 'images', 'done');

    // 4. Generate Chunks
    updateStatus(90, 'generating_chunks', 'chunks', 'running');
    const chunks = generateDocumentChunks(pagesMarkdown, 1500);
    updateStatus(95, 'chunks_generated', 'chunks', 'done');

    // 5. Save Knowledge Base to Disk
    const docFolder = path.join(processedDir, docId);
    if (!fs.existsSync(docFolder)) fs.mkdirSync(docFolder, { recursive: true });

    // Write full markdown document
    fs.writeFileSync(path.join(docFolder, 'document.md'), fullMarkdownText);

    // Write metadata JSON
    const metadata = {
      docId,
      totalPages,
      totalChunks: chunks.length,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(docFolder, 'metadata.json'), JSON.stringify(metadata, null, 2));

    // Write page markdowns array
    fs.writeFileSync(path.join(docFolder, 'pages.json'), JSON.stringify(pagesMarkdown, null, 2));

    // Write chunks JSON
    fs.writeFileSync(path.join(docFolder, 'chunks.json'), JSON.stringify(chunks, null, 2));

    // Mark Ready
    updateStatus(100, 'ready', 'ready', 'done');
    // console.log(`[Pipeline Complete] Document ${docId} indexed into ${chunks.length} chunks.`);

  } catch (error) {
    console.error(`[Pipeline Error] Document ${docId} failed:`, error);
    statusObj.progress = 100;
    statusObj.stage = 'error';
    statusObj.error = error.message;
    documentProcessingStatus.set(docId, { ...statusObj });
  }
}

export default router;
