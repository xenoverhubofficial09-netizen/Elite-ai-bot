const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

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
          name: '/ask | /panel',
          type: ActivityType.Listening,
        },
      ],
      status: 'online',
    });
  },
};
