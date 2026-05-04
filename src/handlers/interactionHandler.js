const { InteractionType, ComponentType } = require('discord.js');
const logger = require('../utils/logger');
const { handleButtonInteraction } = require('../components/buttons');

/**
 * Central router for all incoming interactions.
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').Client} client
 */
async function handleInteraction(interaction, client) {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command received: /${interaction.commandName}`);
      return interaction.reply({
        content: 'Unknown command. Please try again later.',
        ephemeral: true,
      });
    }

    // Cooldown check
    const cooldownResult = checkCooldown(interaction, client, command);
    if (cooldownResult) {
      return interaction.reply({ content: cooldownResult, ephemeral: true });
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      logger.error(`Error executing /${interaction.commandName}:`, err.message);
      const errorMessage = { content: 'An error occurred while executing this command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
    return;
  }

  // Button interactions
  if (interaction.isButton()) {
    try {
      await handleButtonInteraction(interaction, client);
    } catch (err) {
      logger.error(`Error handling button ${interaction.customId}:`, err.message);
      const errorMessage = { content: 'An error occurred while processing this action.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
    return;
  }
}

/**
 * Checks and enforces per-user cooldowns for a command.
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').Client} client
 * @param {object} command
 * @returns {string|null} Error message string if on cooldown, null otherwise.
 */
function checkCooldown(interaction, client, command) {
  if (!command.cooldown) return null;

  const { cooldowns } = client;
  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Map());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const cooldownMs = command.cooldown * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expiresAt = timestamps.get(interaction.user.id) + cooldownMs;
    if (now < expiresAt) {
      const remaining = ((expiresAt - now) / 1000).toFixed(1);
      return `Please wait **${remaining}s** before using \`/${command.data.name}\` again.`;
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownMs);
  return null;
}

module.exports = { handleInteraction };
