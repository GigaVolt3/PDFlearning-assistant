/**
 * PDF Text & Structure Extractor
 * 
 * Uses pdf-parse to extract raw text per page while keeping track of page numbers.
 */

import fs from 'fs';
import pdfParse from 'pdf-parse';

/**
 * Parses a PDF buffer and returns page-by-page text structure.
 * 
 * @param {string|Buffer} pdfInput - Path to PDF file or Buffer
 * @param {Function} onProgress - Callback function to emit live status progress
 * @returns {Promise<{ totalPages: number, pages: Array<{ pageNumber: number, text: string }> }>}
 */
export async function extractPdfPages(pdfInput, onProgress = () => {}) {
  const dataBuffer = typeof pdfInput === 'string' ? fs.readFileSync(pdfInput) : pdfInput;

  let pageCounter = 1;
  const pages = [];

  // Custom page render callback to capture exact text per page
  const pagerender = (pageData) => {
    return pageData.getTextContent().then((textContent) => {
      let lastY, text = '';
      for (const item of textContent.items) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += '\n' + item.str;
        }
        lastY = item.transform[5];
      }

      pages.push({
        pageNumber: pageCounter++,
        text: text.trim()
      });

      return text;
    });
  };

  onProgress({ stage: 'extracting_text', message: 'Reading PDF pages...' });

  const data = await pdfParse(dataBuffer, { pagerender });

  onProgress({
    stage: 'extracting_text',
    message: `Extracted ${data.numpages} pages successfully`,
    totalPages: data.numpages
  });

  return {
    totalPages: data.numpages,
    pages
  };
}
