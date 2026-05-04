const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const { getState } = require('../store/panelState');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Open the Elite AI Control Panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    // Permission guard — setDefaultMemberPermissions handles Discord-side,
    // but we double-check server-side for safety.
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('🚫 Access Denied')
            .setDescription('You need **Administrator** permission to use this panel.'),
        ],
        ephemeral: true,
      });
    }

    const guildState = getState(interaction.guild.id);

    const embed = buildPanelEmbed(interaction.guild.name, guildState);
    const rows = buildPanelComponents(guildState);

    await interaction.reply({ embeds: [embed], components: rows });
    logger.info(`Control panel opened in guild "${interaction.guild.name}" by ${interaction.user.tag}`);
  },
};

/**
 * Builds the main panel embed reflecting current guild state.
 * @param {string} guildName
 * @param {{ aiChat: boolean, autoMod: boolean }} state
 * @returns {EmbedBuilder}
 */
function buildPanelEmbed(guildName, state) {
  const aiStatus  = state.aiChat  ? '🟢 **Enabled**'  : '🔴 **Disabled**';
  const modStatus = state.autoMod ? '🟢 **Enabled**'  : '🔴 **Disabled**';

  return new EmbedBuilder()
    .setColor(0x7b3fe4)
    .setTitle('⚙️ Elite AI Control Panel')
    .setDescription('Manage your server with one click. All changes apply instantly.')
    .addFields(
      {
        name: '╔══════════════════════╗',
        value: '\u200b',
      },
      {
        name: '🤖 AI Chat',
        value: aiStatus,
        inline: true,
      },
      {
        name: '🛡️ Auto Moderation',
        value: modStatus,
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: true,
      },
      {
        name: '🎫 Ticket System',
        value: '🔧 **Coming Soon**',
        inline: true,
      },
      {
        name: '👑 Premium',
        value: '✨ **Upgrade Available**',
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: true,
      },
      {
        name: '╚══════════════════════╝',
        value: `> 🏠 **Server:** ${guildName}\n> 🕐 **Last Updated:** <t:${Math.floor(Date.now() / 1000)}:R>`,
      }
    )
    .setFooter({ text: 'Elite Panel • Changes are server-scoped' })
    .setTimestamp();
}

/**
 * Builds the button rows for the panel.
 * @param {{ aiChat: boolean, autoMod: boolean }} state
 * @returns {ActionRowBuilder[]}
 */
function buildPanelComponents(state) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('panel_toggle_aichat')
      .setLabel(state.aiChat ? 'AI Chat: ON' : 'AI Chat: OFF')
      .setStyle(state.aiChat ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setEmoji('🤖'),
    new ButtonBuilder()
      .setCustomId('panel_toggle_automod')
      .setLabel(state.autoMod ? 'AutoMod: ON' : 'AutoMod: OFF')
      .setStyle(state.autoMod ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setEmoji('🛡️'),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('panel_create_ticket')
      .setLabel('Create Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫'),
    new ButtonBuilder()
      .setCustomId('panel_premium')
      .setLabel('Premium / Buy')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('👑'),
  );

  return [row1, row2];
}

module.exports.buildPanelEmbed = buildPanelEmbed;
module.exports.buildPanelComponents = buildPanelComponents;
