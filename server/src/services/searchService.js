/**
 * Fast Local Keyword & Relevance Search Engine (TF-IDF based)
 * 
 * Scores and ranks document chunks based on user query keywords.
 * Returns only top 3-5 most relevant chunks to maintain strict token efficiency.
 */

/**
 * Searches chunks and returns top matching chunks sorted by relevance.
 * 
 * @param {string} query - User search question
 * @param {Array<object>} chunks - List of document chunks
 * @param {number} topK - Maximum chunks to return (default 3)
 * @returns {Array<object>} Top ranked chunks with relevance score
 */
export function searchRelevantChunks(query, chunks, topK = 3) {
  if (!query || !chunks || chunks.length === 0) {
    return chunks ? chunks.slice(0, topK) : [];
  }

  // Tokenize and clean query words
  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

  if (queryTerms.length === 0) {
    return chunks.slice(0, topK);
  }

  // Score each chunk
  const scoredChunks = chunks.map(chunk => {
    const chunkTextLower = chunk.content.toLowerCase();
    const titleLower = (chunk.title || '').toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Bonus score if keyword appears in Section Title
      if (titleLower.includes(term)) {
        score += 5;
      }

      // Count term occurrences in content
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = chunkTextLower.match(regex);
      if (matches) {
        score += matches.length * 1.5;
      }
    }

    return {
      ...chunk,
      relevanceScore: score
    };
  });

  // Sort descending by score
  scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Filter chunks with score > 0, fallback to topK if none scored high
  const bestMatches = scoredChunks.filter(c => c.relevanceScore > 0);

  return bestMatches.length > 0 ? bestMatches.slice(0, topK) : chunks.slice(0, topK);
}

// Basic stop words filter
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for',
  'of', 'with', 'by', 'from', 'what', 'how', 'why', 'can', 'you', 'explain',
  'describe', 'tell', 'me', 'about', 'this', 'that', 'these', 'those'
]);
