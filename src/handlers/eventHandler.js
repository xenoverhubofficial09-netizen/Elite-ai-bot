const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Loads all event files from the events directory and registers them on the client.
 * @param {import('discord.js').Client} client
 */
function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

  let loaded = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const event = require(filePath);
      if (!event.name || typeof event.execute !== 'function') {
        logger.warn(`Skipping event file ${file} — missing "name" or "execute".`);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      loaded++;
      logger.info(`Event registered: ${event.name}`);
    } catch (err) {
      logger.error(`Failed to load event ${file}:`, err.message);
    }
  }

  logger.info(`Events: ${loaded} registered.`);
}

module.exports = { loadEvents };
