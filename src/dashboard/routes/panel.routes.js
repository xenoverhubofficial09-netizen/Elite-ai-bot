'use strict';

const express = require('express');
const router = express.Router();
const queueService = require('../../services/queueService');
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

module.exports = router;
