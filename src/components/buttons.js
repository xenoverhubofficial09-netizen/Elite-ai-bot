const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const { toggleFeature, getState } = require('../store/panelState');
const { buildPanelEmbed, buildPanelComponents } = require('../commands/panel');
const logger = require('../utils/logger');

/**
 * Map of button customId → handler function.
 * Extend this map to register new buttons without touching the router.
 */
const buttonHandlers = {
  // Legacy panel button (kept for backward compatibility)
  panel_get_access:      handleGetAccess,

  // Elite Control Panel buttons
  panel_toggle_aichat:   handleToggleAiChat,
  panel_toggle_automod:  handleToggleAutoMod,
  panel_create_ticket:   handleCreateTicket,
  panel_premium:         handlePremium,
};

/**
 * Central button interaction router.
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {import('discord.js').Client} client
 */
async function handleButtonInteraction(interaction, client) {
  const handler = buttonHandlers[interaction.customId];

  if (!handler) {
    logger.warn(`No handler registered for button: ${interaction.customId}`);
    return interaction.reply({
      content: '⚠️ This button has no handler configured.',
      ephemeral: true,
    });
  }

  await handler(interaction, client);
}

// ─────────────────────────────────────────────
// PANEL BUTTON HANDLERS
// ─────────────────────────────────────────────

/**
 * Toggles AI Chat on/off for the guild and refreshes the panel embed.
 */
async function handleToggleAiChat(interaction) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '🚫 Only Administrators can use this.', ephemeral: true });
  }

  const newState = toggleFeature(interaction.guild.id, 'aiChat');
  const guildState = getState(interaction.guild.id);

  logger.info(`AI Chat toggled ${newState ? 'ON' : 'OFF'} in guild "${interaction.guild.name}"`);

  await interaction.update({
    embeds: [buildPanelEmbed(interaction.guild.name, guildState)],
    components: buildPanelComponents(guildState),
  });
}

/**
 * Toggles Auto Moderation on/off for the guild and refreshes the panel embed.
 */
async function handleToggleAutoMod(interaction) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '🚫 Only Administrators can use this.', ephemeral: true });
  }

  const newState = toggleFeature(interaction.guild.id, 'autoMod');
  const guildState = getState(interaction.guild.id);

  logger.info(`AutoMod toggled ${newState ? 'ON' : 'OFF'} in guild "${interaction.guild.name}"`);

  await interaction.update({
    embeds: [buildPanelEmbed(interaction.guild.name, guildState)],
    components: buildPanelComponents(guildState),
  });
}

/**
 * Responds with a "coming soon" message for the ticket system.
 */
async function handleCreateTicket(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🎫 Ticket System')
    .setDescription(
      '**The ticket system is coming soon!**\n\n' +
      'We\'re building a full support ticket experience with:\n\n' +
      '> 📂 Private ticket channels\n' +
      '> 🏷️ Category & priority tags\n' +
      '> 📝 Transcript logging\n' +
      '> ⏱️ Auto-close on inactivity\n\n' +
      'Stay tuned for the next update.'
    )
    .setFooter({ text: 'Elite Panel • Ticket System' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Shows the Premium upgrade embed with a Buy Now link button.
 */
async function handlePremium(interaction) {
  const premiumUrl = process.env.PREMIUM_URL || 'https://example.com/premium';

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('👑 Upgrade to Premium')
    .setDescription(
      'Take your server to the next level with **Elite Premium**.\n\n' +
      '**What you unlock:**\n\n' +
      '> 🤖 **Advanced AI** — GPT-4 class responses, no limits\n' +
      '> 🛡️ **Smart AutoMod** — Real-time content filtering\n' +
      '> 🎫 **Full Ticket System** — Private channels + transcripts\n' +
      '> 📊 **Analytics Dashboard** — Server insights & stats\n' +
      '> ⚡ **Priority Support** — Direct access to our team\n' +
      '> 🎨 **Custom Branding** — Your logo, your colors\n\n' +
      '**Starting at just $4.99/month.**'
    )
    .addFields({
      name: '🔥 Limited Offer',
      value: 'Use code **`ELITE20`** for 20% off your first month.',
    })
    .setFooter({ text: 'Elite Panel • Premium' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Buy Now')
      .setStyle(ButtonStyle.Link)
      .setURL(premiumUrl)
      .setEmoji('👑')
  );

  return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// ─────────────────────────────────────────────
// LEGACY HANDLER (kept for backward compatibility)
// ─────────────────────────────────────────────

/**
 * Handles the legacy "Get Access" button.
 */
async function handleGetAccess(interaction) {
  const memberRoleId = process.env.MEMBER_ROLE_ID;

  if (memberRoleId) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (member.roles.cache.has(memberRoleId)) {
        return interaction.reply({ content: '✅ You already have member access!', ephemeral: true });
      }

      await member.roles.add(memberRoleId, 'Panel: Get Access button');

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Access Granted!')
        .setDescription('Welcome! You now have full member access.')
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      logger.error(`Failed to assign member role to ${interaction.user.id}:`, err.message);
      return interaction.reply({
        content: '⚠️ Failed to assign your role. Please contact an administrator.',
        ephemeral: true,
      });
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🔓 Getting Access')
    .setDescription(
      'To gain full access:\n\n' +
      '1. Read and agree to **#rules**\n' +
      '2. Introduce yourself in **#introductions**\n' +
      '3. A moderator will assign your role shortly'
    )
    .setTimestamp();

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = { handleButtonInteraction };
