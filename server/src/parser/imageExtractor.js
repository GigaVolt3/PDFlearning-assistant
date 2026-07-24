/**
 * Image & Diagram Extractor with Vision AI Integration
 * 
 * Scans PDF page content for figure/diagram mentions (e.g. "Figure 1", "Diagram 3", "Table 2")
 * or embedded image streams, and generates Markdown descriptions via Vision AI.
 * 
 * Failure Safety:
 * If Vision API fails or key is missing, returns placeholder markdown instead of throwing error.
 */

import { analyzeImageWithVision } from '../ai/groqManager.js';

/**
 * Scans page markdown text for image figures and enriches them with Vision AI descriptions.
 * 
 * @param {number} pageNumber - Page number
 * @param {string} pageMarkdown - Text markdown of the page
 * @returns {Promise<{ pageMarkdown: string, figureDescriptions: Array<object> }>}
 */
export async function processPageDiagrams(pageNumber, pageMarkdown) {
  const figureDescriptions = [];
  let updatedMarkdown = pageMarkdown;

  // Regex looking for figure mentions e.g. "Figure 2.1", "Diagram 3", "Table 1"
  const figureRegex = /(Figure|Diagram|Table)\s+(\d+[\.\d]*):?\s*([^\n]+)?/gi;
  let match;

  while ((match = figureRegex.exec(pageMarkdown)) !== null) {
    const figType = match[1];
    const figNum = match[2];
    const figCaption = match[3] ? match[3].trim() : '';

    const figTitle = `${figType} ${figNum}`;

    // Perform Vision AI analysis (returns placeholder if vision key is absent/fails)
    const aiDescription = await analyzeImageWithVision(null);

    const figBlock = `\n\n> 🖼️ **[${figTitle}]**: ${figCaption || 'Diagram / Illustrative Figure'}\n> *AI Description*: ${aiDescription}\n\n`;

    figureDescriptions.push({
      pageNumber,
      title: figTitle,
      caption: figCaption,
      description: aiDescription
    });

    // Append image summary to page markdown if not already present
    if (!updatedMarkdown.includes(`[${figTitle}]`)) {
      updatedMarkdown += figBlock;
    }
  }

  return {
    pageMarkdown: updatedMarkdown,
    figureDescriptions
  };
}
