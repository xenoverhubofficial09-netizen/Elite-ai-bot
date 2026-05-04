const Groq = require('groq-sdk');
const logger = require('../utils/logger');

let groqClient = null;

/**
 * Returns a singleton Groq client instance.
 * @returns {Groq}
 */
function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * Sends a question to the Groq API and returns a formatted response string.
 * Throws an enriched error with a `userMessage` property on failure.
 *
 * @param {string} question - The user's question.
 * @returns {Promise<string>} The AI's response text.
 */
async function queryGroq(question) {
  const client = getGroqClient();

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS, 10) || 1024;
  const temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful, concise, and friendly AI assistant inside a Discord server. ' +
            'Keep responses clear and well-structured. Use markdown formatting where appropriate. ' +
            'If a question is harmful, illegal, or inappropriate, politely decline to answer.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });
  } catch (err) {
    logger.error('Groq API request failed:', err.message);

    const enriched = new Error(err.message);
    enriched.userMessage = resolveUserMessage(err);
    throw enriched;
  }

  const text = completion?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    const err = new Error('Groq returned an empty response.');
    err.userMessage = 'The AI returned an empty response. Please try rephrasing your question.';
    throw err;
  }

  // Discord message limit is 2000 characters — keep headroom for chunking
  return text.length > 1900 ? text.slice(0, 1897) + '...' : text;
}

/**
 * Maps Groq API errors to user-friendly messages.
 * @param {Error} err
 * @returns {string}
 */
function resolveUserMessage(err) {
  const status = err?.status || err?.statusCode;

  if (status === 401) return 'AI service authentication failed. Please contact an administrator.';
  if (status === 429) return 'The AI service is currently rate-limited. Please try again in a moment.';
  if (status === 503 || status === 502) return 'The AI service is temporarily unavailable. Please try again later.';
  if (err.message?.toLowerCase().includes('timeout')) return 'The AI request timed out. Please try again.';

  return 'Failed to get a response from the AI. Please try again later.';
}

module.exports = { queryGroq };
