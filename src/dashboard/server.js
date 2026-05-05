'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const logger = require('../utils/logger');

// Modular Routes
const settingsRoutes = require('./routes/settings.routes');
const panelRoutes = require('./routes/panel.routes');

/**
 * Starts the modular Express dashboard server.
 */
function startDashboard(client) {
  const app = express();
  const port = process.env.PORT || 3001;

  app.use(cors());
  app.use(express.json());
  
  const publicPath = path.join(__dirname, 'public');
  logger.info(`[DASHBOARD] Serving static assets from: ${publicPath}`);

  // ROOT ROUTE: Force serve the dashboard at the main URL
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // Serve static UI assets
  app.use(express.static(publicPath));

  // Attach API Routes
  app.use('/api/settings', settingsRoutes);
  app.use('/api/panel', panelRoutes);

  // Health check (Moved to a different path to avoid conflict)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'online', bot: client.user?.tag || 'connecting' });
  });

  // Start Listener
  app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 DASHBOARD ACTIVE: http://localhost:${port}`);
  }).on('error', (err) => {
    logger.error(`Dashboard server error: ${err.message}`);
  });

  return app;
}

module.exports = { startDashboard };
