const express = require('express');
const https = require('https');
const logger = require('./logger');

/**
 * Starts a minimal Express HTTP server so Render keeps the process alive,
 * and optionally self-pings the app URL to prevent spin-down on free tier.
 */
function startKeepAlive() {
  const port = parseInt(process.env.PORT, 10) || 3000;
  const app = express();

  app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.listen(port, () => {
    logger.info(`Keep-alive server listening on port ${port}`);
  });

  // Self-ping every 14 minutes to prevent Render free-tier spin-down
  const pingUrl = process.env.KEEP_ALIVE_URL;
  if (pingUrl) {
    const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

    setInterval(() => {
      ping(pingUrl);
    }, PING_INTERVAL_MS);

    logger.info(`Keep-alive pinger configured for: ${pingUrl}`);
  }
}

/**
 * Sends a GET request to the given URL for keep-alive purposes.
 * @param {string} url
 */
function ping(url) {
  https
    .get(url, (res) => {
      logger.debug(`Keep-alive ping → ${url} [${res.statusCode}]`);
    })
    .on('error', (err) => {
      logger.warn(`Keep-alive ping failed for ${url}:`, err.message);
    });
}

module.exports = { startKeepAlive };
