'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const logger = require('../utils/logger');

// Modular Routes
const settingsRoutes = require('./routes/settings.routes');
const panelRoutes = require('./routes/panel.routes');
const authRoutes = require('./routes/auth.routes');

/**
 * Starts the modular Express dashboard server.
 */
function startDashboard(client) {
  const app = express();
  const port = process.env.PORT || 3001;

  // Passport Configuration
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI,
    scope: ['identify', 'guilds']
  }, (accessToken, refreshToken, profile, done) => {
    // Here you could check if the user ID is in an allowed list
    // process.nextTick(() => done(null, profile));
    return done(null, profile);
  }));

  app.use(cors());
  app.use(express.json());
  
  // Session Middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'elite_bot_secret_xyz_123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.set('discordClient', client);
  
  const publicPath = path.join(__dirname, 'public');
  logger.info(`[DASHBOARD] Serving static assets from: ${publicPath}`);

  // ROOT ROUTE: Force serve the dashboard at the main URL
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // Serve static UI assets
  app.use(express.static(publicPath));

  // Attach Routes
  app.use('/auth', authRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/panel', panelRoutes);

  // Health check
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
