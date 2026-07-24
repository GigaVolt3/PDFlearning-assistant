/**
 * Groq AI Model Manager with Automatic 3-Tier Fallback Mechanism
 * 
 * Why this is needed:
 * Free/Tiered LLM APIs like Groq enforce Requests Per Minute (RPM) and Tokens Per Minute (TPM) limits.
 * If our primary model encounters a Rate Limit (HTTP 429) or API error, this manager transparently
 * retries the request using the next backup model in the list without failing the user session.
 */

import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Groq SDK client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_testing'
});

/**
 * 3-Tier Model Fallback List ordered by priority:
 * 1. Primary Model: Highest reasoning quality
 * 2. Fallback 1: Fast, high throughput
 * 3. Fallback 2: Secondary reliable backup
 */
const MODEL_FALLBACK_LIST = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3.6-27b'
];

/**
 * Execute a text completion query with automatic multi-model failover.
 * 
 * @param {Array} messages - Chat history array [{ role: 'system'|'user'|'assistant', content: string }]
 * @param {Object} options - Options like temperature, max_tokens, jsonMode
 * @returns {Promise<{ content: string, modelUsed: string }>} Resulting response and model name used
 */
export async function generateCompletion(messages, options = {}) {
  let lastError = null;

  // Loop through fallback models sequentially
  for (const modelName of MODEL_FALLBACK_LIST) {
    try {
      // console.log(`[AI Engine] Attempting request with model: ${modelName}`);

      const requestPayload = {
        messages,
        model: modelName,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 2048,
      };

      // Enable JSON output format if requested
      if (options.jsonMode) {
        requestPayload.response_format = { type: 'json_object' };
      }

      // Call Groq API
      const completion = await groq.chat.completions.create(requestPayload);
      const reply = completion.choices[0]?.message?.content || '';

      // Return successful response along with the name of the model that succeeded
      return {
        content: reply,
        modelUsed: modelName
      };

    } catch (error) {
      console.warn(`[AI Engine Warning] Model ${modelName} failed. Reason: ${error.message}`);
      lastError = error;
      // Continue to the next fallback model in the list
    }
  }

  // If all models in the fallback array fail
  throw new Error(`All Groq models failed. Last error: ${lastError?.message || 'Unknown API Error'}`);
}

/**
 * Vision AI processing for figures, charts, and diagrams extracted from PDF.
 * Gracefully handles missing vision API key or errors without breaking document processing.
 * 
 * @param {string} imageBase64 - Base64 encoded image string or image URL
 * @returns {Promise<string>} Textual description of image
 */
export async function analyzeImageWithVision(imageBase64) {
  const visionApiKey = process.env.VISION_API_KEY || process.env.GROQ_API_KEY;

  if (!visionApiKey || visionApiKey === 'dummy_key_for_testing') {
    // Graceful Fallback: Return placeholder if vision key is not set
    return '[Diagram/Image extracted from document. Vision analysis skipped (No API key provided).]';
  }

  try {
    const visionGroq = new Groq({ apiKey: visionApiKey });

    // Use Groq Vision model if available
    const completion = await visionGroq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this educational image from a textbook/PDF. Describe its title, diagrams, flow charts, tables, equations, and main concept in clean Markdown bullet points.'
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    return completion.choices[0]?.message?.content || '[Diagram details could not be parsed.]';
  } catch (error) {
    console.warn(`[Vision AI Warning] Vision model unavailable or failed: ${error.message}. Continuing safely.`);
    // Safe Fallback: Ignore vision error so PDF processing completes smoothly
    return '[Educational diagram present in original PDF page.]';
  }
}
