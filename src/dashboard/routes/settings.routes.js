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

module.exports = router;
