'use strict';

const express = require('express');
const router = express.Router();
const { getSettings, toggleAI } = require('../../services/settingsService');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/settings
 * Returns current AI state.
 */
router.get('/', authMiddleware, (req, res) => {
  res.json(getSettings());
});

/**
 * POST /api/settings/toggle
 * Toggles the AI ON/OFF.
 */
router.post('/toggle', authMiddleware, (req, res) => {
  const result = toggleAI();
  res.json(result);
});

/**
 * GET /api/settings/guilds
 * Returns list of guilds the bot is in (to verify access).
 */
router.get('/guilds', authMiddleware, (req, res) => {
  const guilds = req.app.get('discordClient').guilds.cache.map(g => ({
    id: g.id,
    name: g.name,
    icon: g.iconURL()
  }));
  res.json(guilds);
});

/**
 * GET /api/settings/:guildId/channels
 */
router.get('/:guildId/channels', authMiddleware, (req, res) => {
  const { guildId } = req.params;
  const client = req.app.get('discordClient');
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).json({ error: 'Guild not found' });

  const channels = guild.channels.cache
    .filter(c => c.type === 0) // Text channels
    .map(c => ({ id: c.id, name: c.name }));
  res.json(channels);
});

/**
 * GET /api/settings/:guildId/roles
 */
router.get('/:guildId/roles', authMiddleware, (req, res) => {
  const { guildId } = req.params;
  const client = req.app.get('discordClient');
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).json({ error: 'Guild not found' });

  const roles = guild.roles.cache.map(r => ({
    id: r.id,
    name: r.name,
    color: r.color
  }));
  res.json(roles);
});

module.exports = router;
