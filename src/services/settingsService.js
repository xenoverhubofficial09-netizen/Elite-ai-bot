'use strict';

const { getState, toggleFeature } = require('../store/panelState');

/**
 * Returns dashboard-facing settings for a guild.
 * @param {string} guildId
 * @returns {{ aiEnabled: boolean }}
 */
function getSettings(guildId) {
  const state = getState(guildId);
  return { aiEnabled: state.aiChat };
}

/**
 * Toggles the AI chat feature for a guild.
 * @param {string} guildId
 * @returns {{ aiEnabled: boolean }}
 */
function toggleAI(guildId) {
  const newValue = toggleFeature(guildId, 'aiChat');
  return { aiEnabled: newValue };
}

module.exports = { getSettings, toggleAI };
