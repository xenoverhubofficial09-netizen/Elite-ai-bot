const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const queueService = require('../services/queueService');
const { sendPanel } = require('../services/panelService');

module.exports = {
  name: Events.ClientReady,
  once: true,

  /**
   * @param {import('discord.js').Client} client
   */
  execute(client) {
    logger.info(`Bot is online as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);

    client.user.setPresence({
      activities: [
        {
          name: 'dashboard | /ask',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // --- Queue Processor ---
    // Check for pending dashboard panels every 5 seconds
    setInterval(async () => {
      const pending = queueService.fetchAndClear();
      if (pending.length === 0) return;

      logger.info(`Processing ${pending.length} pending panels from queue...`);

      for (const panel of pending) {
        try {
          await sendPanel(panel);
          logger.info(`✅ Successfully sent queued panel to channel: ${panel.channelId}`);
        } catch (err) {
          logger.error(`❌ Failed to send queued panel: ${err.message}`);
        }
      }
    }, 5000);
  },
};
