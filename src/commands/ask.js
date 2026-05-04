const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { queryGroq } = require('../services/groqService');
const { checkRateLimit } = require('../utils/rateLimit');
const { sanitizeInput } = require('../utils/validation');
const logger = require('../utils/logger');

module.exports = {
  cooldown: 5, // seconds between uses per user (handled by interactionHandler)

  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask the AI a question powered by Groq')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Your question for the AI (max 500 characters)')
        .setRequired(true)
        .setMaxLength(500)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const rawQuestion = interaction.options.getString('question', true);

    // Sanitize input
    const question = sanitizeInput(rawQuestion);
    if (!question) {
      return interaction.reply({
        content: 'Your question appears to be empty after sanitization. Please provide a valid question.',
        ephemeral: true,
      });
    }

    // Rate limit check (per-user, separate from cooldown)
    const rateLimitResult = checkRateLimit(interaction.user.id);
    if (!rateLimitResult.allowed) {
      return interaction.reply({
        content: `You are sending requests too quickly. Please wait **${rateLimitResult.retryAfterSeconds}s** before trying again.`,
        ephemeral: true,
      });
    }

    // Defer reply — Groq API may take a moment
    await interaction.deferReply();

    try {
      const aiResponse = await queryGroq(question);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setAuthor({
          name: `${interaction.user.displayName} asked:`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .addFields(
          { name: '❓ Question', value: question },
          { name: '🤖 Answer', value: aiResponse }
        )
        .setFooter({ text: 'Powered by Groq AI' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error(`/ask command error for user ${interaction.user.id}:`, err.message);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('⚠️ AI Error')
        .setDescription(err.userMessage || 'Failed to get a response from the AI. Please try again later.')
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
