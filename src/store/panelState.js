/**
 * In-memory state store for panel toggles.
 * Keyed by guildId so each server has independent state.
 *
 * Structure:
 * {
 *   [guildId]: {
 *     aiChat: boolean,
 *     autoMod: boolean,
 *   }
 * }
 */

/** @type {Map<string, { aiChat: boolean, autoMod: boolean }>} */
const state = new Map();

/**
 * Returns the panel state for a guild, initializing defaults if needed.
 * @param {string} guildId
 * @returns {{ aiChat: boolean, autoMod: boolean }}
 */
function getState(guildId) {
  if (!state.has(guildId)) {
    state.set(guildId, { aiChat: true, autoMod: false });
  }
  return state.get(guildId);
}

/**
 * Toggles a boolean feature for a guild and returns the new value.
 * @param {string} guildId
 * @param {'aiChat' | 'autoMod'} feature
 * @returns {boolean} New state after toggle.
 */
function toggleFeature(guildId, feature) {
  const current = getState(guildId);
  current[feature] = !current[feature];
  state.set(guildId, current);
  return current[feature];
}

module.exports = { getState, toggleFeature };
