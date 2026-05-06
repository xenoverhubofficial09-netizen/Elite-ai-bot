'use strict';

const express = require('express');
const router = express.Router();
const queueService = require('../../services/queueService');
const { sendPanel, lockChannel, clearChat } = require('../../services/panelService');
const authMiddleware = require('../middleware/auth');

/**
 * POST /api/panel/send
 * Pushes a new embed panel request to the queue.
 */
router.post('/send', authMiddleware, (req, res) => {
  const { channelId, title, description, image, thumbnail, buttons } = req.body;

  if (!channelId) {
    return res.status(400).json({ success: false, message: "channelId is required" });
  }

  // Basic validation
  if (title && title.length > 256) return res.status(400).json({ error: "Title too long" });
  if (description && description.length > 2000) return res.status(400).json({ error: "Description too long" });

  queueService.add({
    channelId,
    title,
    description,
    image,
    thumbnail,
    buttons: Array.isArray(buttons) ? buttons.slice(0, 5) : []
  });

  res.json({ success: true, message: "Panel added to queue" });
});

/**
 * POST /api/panel/lock
 * Locks a channel for specific roles.
 */
router.post('/lock', authMiddleware, async (req, res) => {
  const { channelId, roleIds } = req.body;
  if (!channelId || !roleIds) return res.status(400).json({ error: "Missing parameters" });

  try {
    await lockChannel({ channelId, roleIds });
    res.json({ success: true, message: "Channel locked successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/panel/clear
 * Clears a channel by cloning.
 */
router.post('/clear', authMiddleware, async (req, res) => {
  const { channelId } = req.body;
  if (!channelId) return res.status(400).json({ error: "channelId is required" });

  try {
    const newId = await clearChat(channelId);
    res.json({ success: true, message: "Channel cleared", newChannelId: newId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
