'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const logger = require('../utils/logger');

/** @type {import('discord.js').Client | null} */
let discordClient = null;

/**
 * Stores the Discord client reference so panelService can use it.
 * Called once from index.js after client is created.
 * @param {import('discord.js').Client} client
 */
function init(client) {
  discordClient = client;
}

/**
 * Sends a rich embed message with optional link buttons to a Discord channel.
 *
 * @param {object} opts
 * @param {string}   opts.channelId   - Target channel ID
 * @param {string}  [opts.title]      - Embed title
 * @param {string}  [opts.description]- Embed description
 * @param {string}  [opts.image]      - Large image URL
 * @param {string}  [opts.thumbnail]  - Thumbnail URL
 * @param {Array<{ label: string, url: string }>} [opts.buttons] - Link buttons (max 5)
 * @returns {Promise<void>}
 */
async function sendPanel({ channelId, title, description, image, thumbnail, buttons = [] }) {
  if (!discordClient) {
    throw new Error('Discord client is not initialized. The bot may still be starting up.');
  }

  let channel;
  try {
    channel = await discordClient.channels.fetch(channelId);
  } catch {
    throw new Error(`Channel ${channelId} not found or bot lacks access.`);
  }

  if (!channel || !channel.isTextBased()) {
    throw new Error('The provided channel ID is not a text channel.');
  }

  const embed = new EmbedBuilder()
    .setColor(0x6366f1)
    .setTimestamp();

  if (title)       embed.setTitle(title.slice(0, 256));
  if (description) embed.setDescription(description.slice(0, 4096));
  if (image)       embed.setImage(image);
  if (thumbnail)   embed.setThumbnail(thumbnail);

  const components = [];

  if (buttons.length > 0) {
    const row = new ActionRowBuilder();
    for (const btn of buttons.slice(0, 5)) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel(btn.label.slice(0, 80))
          .setURL(btn.url)
          .setStyle(ButtonStyle.Link)
      );
    }
    if (row.components.length > 0) components.push(row);
  }

  await channel.send({ embeds: [embed], components });
  logger.info(`Panel sent to channel ${channelId} (title: "${title || 'no title'}")`);
}

/**
 * Locks a channel by denying VIEW_CHANNEL or SEND_MESSAGES for @everyone 
 * and allowing it for specific roles.
 * 
 * @param {object} opts
 * @param {string} opts.channelId
 * @param {string[]} opts.roleIds
 * @returns {Promise<void>}
 */
async function lockChannel({ channelId, roleIds }) {
  if (!discordClient) throw new Error('Client not initialized.');
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) throw new Error('Invalid channel.');

  // Set permissions: Deny @everyone, Allow specific roles
  const overwrites = [
    {
      id: channel.guild.id, // @everyone
      deny: ['ViewChannel'],
    }
  ];

  for (const roleId of roleIds) {
    overwrites.push({
      id: roleId,
      allow: ['ViewChannel', 'SendMessages'],
    });
  }

  await channel.permissionOverwrites.set(overwrites);
  logger.info(`Channel ${channelId} locked for roles: ${roleIds.join(', ')}`);
}

/**
 * Clears a channel by cloning it and deleting the original.
 * 
 * @param {string} channelId
 * @returns {Promise<string>} ID of the new channel
 */
async function clearChat(channelId) {
  if (!discordClient) throw new Error('Client not initialized.');
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) throw new Error('Invalid channel.');

  const newChannel = await channel.clone({
    reason: 'Chat cleared via dashboard (clone method)',
    position: channel.position
  });

  await channel.delete('Chat cleared via dashboard');
  logger.info(`Channel ${channelId} cleared (cloned to ${newChannel.id})`);
  return newChannel.id;
}

module.exports = { init, sendPanel, lockChannel, clearChat };
