require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { startDashboard } = require('./dashboard/server');
const { init: initPanelService } = require('./services/panelService');
const logger = require('./utils/logger');

// Validate required environment variables
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'GROQ_API_KEY',
  'ADMIN_KEY'
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`[STARTUP ERROR] Missing environment variable: ${envVar}`);
    // Only exit on critical bot variables
    if (envVar === 'DISCORD_TOKEN' || envVar === 'ADMIN_KEY') {
       process.exit(1);
    }
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Attach collections to client
client.commands = new Collection();
client.cooldowns = new Collection();

// Load handlers
loadCommands(client);
loadEvents(client);

// Give panel service access to the Discord client
initPanelService(client);

// Start the dashboard (Dashboard server IS the HTTP server)
startDashboard(client);

// Login
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  logger.error('❌ Failed to login to Discord. Check your DISCORD_TOKEN on Railway!');
  logger.error(`Error details: ${err.message}`);
  process.exit(1);
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});
