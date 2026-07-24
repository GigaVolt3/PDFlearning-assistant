/**
 * Intelligent Document Chunk Generator
 * 
 * Takes page-by-page Markdown array and splits it into logical, token-bounded chunks.
 * Each chunk tracks its page range (e.g. Page 4 to 6) and primary section headers.
 */

// Rough token estimator (~4 chars = 1 token)
function estimateTokenCount(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Generate logical document chunks from array of page markdowns.
 * 
 * @param {Array<{ pageNumber: number, markdown: string }>} pagesMarkdown - Page objects
 * @param {number} maxTokensPerChunk - Target token size (default ~1500)
 * @returns {Array<object>} Chunks array
 */
export function generateDocumentChunks(pagesMarkdown, maxTokensPerChunk = 1500) {
  const chunks = [];
  let currentChunkPages = [];
  let currentChunkText = '';
  let currentStartPage = pagesMarkdown[0]?.pageNumber || 1;
  let chunkIdCounter = 1;

  for (let i = 0; i < pagesMarkdown.length; i++) {
    const page = pagesMarkdown[i];
    const pageTokens = estimateTokenCount(page.markdown);
    const currentTokens = estimateTokenCount(currentChunkText);

    // If adding this page exceeds target max tokens and we already have content, finalize current chunk
    if (currentTokens + pageTokens > maxTokensPerChunk && currentChunkText.length > 0) {
      const endPage = pagesMarkdown[i - 1]?.pageNumber || currentStartPage;
      const title = extractPrimaryTitle(currentChunkText) || `Section ${chunkIdCounter}`;

      chunks.push({
        id: chunkIdCounter++,
        pageStart: currentStartPage,
        pageEnd: endPage,
        title,
        tokens: estimateTokenCount(currentChunkText),
        content: currentChunkText.trim()
      });

      // Reset for next chunk with 1 page overlap if possible
      currentStartPage = page.pageNumber;
      currentChunkText = page.markdown;
      currentChunkPages = [page.pageNumber];
    } else {
      currentChunkText += `\n\n${page.markdown}`;
      currentChunkPages.push(page.pageNumber);
    }
  }

  // Push final remaining chunk
  if (currentChunkText.trim().length > 0) {
    const endPage = pagesMarkdown[pagesMarkdown.length - 1]?.pageNumber || currentStartPage;
    const title = extractPrimaryTitle(currentChunkText) || `Section ${chunkIdCounter}`;

    chunks.push({
      id: chunkIdCounter++,
      pageStart: currentStartPage,
      pageEnd: endPage,
      title,
      tokens: estimateTokenCount(currentChunkText),
      content: currentChunkText.trim()
    });
  }

  return chunks;
}

/**
 * Helper to extract main heading (# or ##) from chunk text for title metadata
 */
function extractPrimaryTitle(chunkText) {
  const match = chunkText.match(/##?\s+([^\n]+)/);
  if (match) {
    return match[1].replace(/[\#\*\_]/g, '').trim();
  }
  return null;
}
