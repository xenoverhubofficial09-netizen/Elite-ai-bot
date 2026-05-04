const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Loads all command files from the commands directory into client.commands.
 * @param {import('discord.js').Client} client
 */
function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

  let loaded = 0;
  let skipped = 0;

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        loaded++;
        logger.info(`Command loaded: /${command.data.name}`);
      } else {
        logger.warn(`Skipping ${file} — missing "data" or "execute".`);
        skipped++;
      }
    } catch (err) {
      logger.error(`Failed to load command ${file}:`, err.message);
      skipped++;
    }
  }

  logger.info(`Commands: ${loaded} loaded, ${skipped} skipped.`);
}

module.exports = { loadCommands };
