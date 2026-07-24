/**
 * Main Express Backend Application Entry Point
 * Smart PDF Learning Assistant API Server
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import uploadRoutes from './src/routes/upload.js';
import chatRoutes from './src/routes/chat.js';
import studyRoutes from './src/routes/study.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing and JSON Body Parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure required directories exist
const uploadDir = path.resolve(process.env.UPLOAD_DIR || '../uploads');
const processedDir = path.resolve(process.env.PROCESSED_DIR || '../processed');
const cacheDir = path.resolve(process.env.CACHE_DIR || '../cache');

[uploadDir, processedDir, cacheDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static uploaded PDF files and processed image artifacts
app.use('/uploads', express.static(uploadDir));
app.use('/processed', express.static(processedDir));

// Mount API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/study', studyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Smart PDF Learning Assistant Backend Engine',
    timestamp: new Date().toISOString()
  });
});

// Start Express Listener
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart PDF Learning Assistant Server running on port ${PORT}`);
  console.log(`📂 Uploads directory: ${uploadDir}`);
  console.log(`📄 Processed Knowledge Base: ${processedDir}`);
  console.log(`=======================================================`);
});
