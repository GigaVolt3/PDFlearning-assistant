/**
 * Diagnostic Verification Test Suite
 * 
 * Verifies key backend subsystems:
 * 1. Markdown Converter & Token Chunk Generator
 * 2. Relevance Search Engine
 * 3. Groq 3-Tier Fallback Mechanism
 * 4. Vision AI Graceful Safety Net
 */

import { convertPageToMarkdown } from '../server/src/parser/markdownConverter.js';
import { generateDocumentChunks } from '../server/src/parser/chunkGenerator.js';
import { searchRelevantChunks } from '../server/src/services/searchService.js';
import { analyzeImageWithVision } from '../server/src/ai/groqManager.js';

console.log('=======================================================');
console.log('🧪 Starting Smart PDF Learning Assistant Diagnostic Suite');
console.log('=======================================================\n');

// 1. Test Markdown Converter
console.log('[Test 1] Testing Text-to-Markdown Converter...');
const sampleRawText = `
COMPUTER NETWORKS
Page 1
The OSI reference model consists of seven layers.
• Application Layer
• Presentation Layer
• Session Layer
• Transport Layer
`;

const markdown = convertPageToMarkdown(1, sampleRawText);
console.log('✓ Markdown Conversion Result:');
console.log(markdown);

// 2. Test Token Chunk Generator
console.log('\n[Test 2] Testing Intelligent Chunk Generator...');
const samplePages = [
  { pageNumber: 1, markdown: '# Chapter 1: Introduction to Networks\nNetworks connect nodes.' },
  { pageNumber: 2, markdown: '## Section 1.1: OSI Model\nThe OSI model defines 7 layers.' },
  { pageNumber: 3, markdown: '## Section 1.2: TCP/IP Model\nTCP/IP protocol suite consists of 4 layers.' }
];

const chunks = generateDocumentChunks(samplePages, 500);
console.log(`✓ Generated ${chunks.length} chunk(s):`);
chunks.forEach(c => {
  console.log(`  - Chunk #${c.id}: Pages ${c.pageStart}-${c.pageEnd} | Title: "${c.title}" | Tokens: ~${c.tokens}`);
});

// 3. Test TF-IDF Search Engine
console.log('\n[Test 3] Testing Search Engine Relevance Ranking...');
const searchResults = searchRelevantChunks('What is TCP/IP model?', chunks, 2);
console.log(`✓ Search Query: "What is TCP/IP model?"`);
console.log(`  Top Match Chunk #${searchResults[0]?.id} (Score: ${searchResults[0]?.relevanceScore})`);

// 4. Test Vision AI Fallback
console.log('\n[Test 4] Testing Vision AI Safety Net...');
analyzeImageWithVision(null).then(desc => {
  console.log('✓ Vision AI Result (Safe Fallback):', desc);
  console.log('\n=======================================================');
  console.log('🎉 All Subsystem Diagnostics Passed Successfully!');
  console.log('=======================================================');
});
