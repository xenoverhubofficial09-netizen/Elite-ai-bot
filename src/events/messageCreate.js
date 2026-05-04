const { Events } = require('discord.js');
const { queryGroq } = require('../services/groqService');
const { getState } = require('../store/panelState');
const logger = require('../utils/logger');

/**
 * Per-user cooldown tracker for message-based AI chat.
 * Key: userId, Value: timestamp of last request
 * @type {Map<string, number>}
 */
const cooldowns = new Map();
const COOLDOWN_MS = 5000; // 5 seconds

/** Max characters accepted from a message as a question */
const MAX_INPUT_LENGTH = 500;

/** Prefix to trigger AI without mentioning the bot */
const AI_PREFIX = 'ai ';

module.exports = {
  name: Events.MessageCreate,
  once: false,

  /**
   * @param {import('discord.js').Message} message
   * @param {import('discord.js').Client} client
   */
  async execute(message, client) {
    // 1. Ignore bots and system messages
    if (message.author.bot || message.system) return;

    // 2. Only handle guild messages (no DMs)
    if (!message.guild) return;

    // 3. Determine if this message should trigger AI
    const isMention = message.mentions.has(client.user.id);
    const hasPrefix = message.content.toLowerCase().startsWith(AI_PREFIX);

    if (!isMention && !hasPrefix) return;

    // 4. Check if AI Chat is enabled for this guild
    const guildState = getState(message.guild.id);
    if (!guildState.aiChat) {
      if (isMention) {
        return message.channel.send(
          `<@${message.author.id}> 🔴 AI Chat is currently **disabled**. An administrator can enable it via \`/panel\`.`
        );
      }
      return;
    }

    // 5. Cooldown check
    const now = Date.now();
    const lastUsed = cooldowns.get(message.author.id) || 0;
    const remaining = COOLDOWN_MS - (now - lastUsed);

    if (remaining > 0) {
      return message.channel.send(
        `<@${message.author.id}> ⏳ Please wait **${(remaining / 1000).toFixed(1)}s** before sending another message.`
      );
    }

    // 6. Extract the actual question
    let question = message.content;

    if (isMention) {
      question = message.content
        .replace(`<@${client.user.id}>`, '')
        .replace(`<@!${client.user.id}>`, '')
        .trim();
    } else if (hasPrefix) {
      question = message.content.slice(AI_PREFIX.length).trim();
    }

    if (!question) {
      return message.channel.send(
        `<@${message.author.id}> 💬 Please ask me something! Example: \`ai What is JavaScript?\``
      );
    }

    // 7. Truncate oversized input
    if (question.length > MAX_INPUT_LENGTH) {
      question = question.slice(0, MAX_INPUT_LENGTH);
    }

    // 8. Set cooldown before async work to prevent spam during API call
    cooldowns.set(message.author.id, now);
    setTimeout(() => cooldowns.delete(message.author.id), COOLDOWN_MS);

    // 9. Show typing indicator
    try {
      await message.channel.sendTyping();
    } catch {
      // Non-critical — continue even if typing fails
    }

    // 10. Query Groq and send formatted response
    try {
      logger.info(`AI chat request from ${message.author.tag} in guild "${message.guild.name}": ${question.slice(0, 80)}...`);

      const response = await queryGroq(question);

      // Build chunks — first chunk gets the mention header, rest are plain continuations
      const chunks = splitMessage(response, 1800);

      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) {
          // First chunk: mention + arrow + response
          await message.channel.send(
            `<@${message.author.id}> ➜\n${chunks[i]}`
          );
        } else {
          // Continuation chunks: no extra mention spam
          await message.channel.send(chunks[i]);
        }
      }
    } catch (err) {
      logger.error(`AI chat error for ${message.author.tag}:`, err.message);
      await message.channel.send(
        `<@${message.author.id}> ⚠️ AI is temporarily unavailable. Please try again in a moment.`
      ).catch(() => {});
    }
  },
};

/**
 * Splits a string into chunks that fit within Discord's message limit.
 * Tries to split on newlines to preserve formatting.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitMessage(text, maxLength) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let current = '';

  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > maxLength) {
      if (current) chunks.push(current.trim());
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}
