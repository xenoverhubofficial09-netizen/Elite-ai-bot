const { Events } = require('discord.js');
const { handleInteraction } = require('../handlers/interactionHandler');
const logger = require('../utils/logger');

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  /**
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    // Ignore bot interactions
    if (interaction.user.bot) return;

    try {
      await handleInteraction(interaction, client);
    } catch (err) {
      logger.error('Unhandled error in interactionCreate event:', err.message);
    }
  },
};
