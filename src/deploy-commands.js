require('dotenv').config();

const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    logger.info(`Loaded command for deployment: ${command.data.name}`);
  } else {
    logger.warn(`Skipping ${file} — missing "data" or "execute" property.`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`Deploying ${commands.length} application (/) commands...`);

    const route = process.env.DISCORD_GUILD_ID
      ? Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)
      : Routes.applicationCommands(process.env.DISCORD_CLIENT_ID);

    const data = await rest.put(route, { body: commands });

    logger.info(`Successfully deployed ${data.length} application (/) commands.`);
  } catch (err) {
    logger.error('Failed to deploy commands:', err.message);
    process.exit(1);
  }
})();
