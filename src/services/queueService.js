'use strict';

/**
 * In-memory queue for pending embed panels.
 * This ensures the bot can process them sequentially.
 */
let pendingPanels = [];

module.exports = {
  /**
   * Add a panel request to the queue.
   */
  add: (data) => {
    pendingPanels.push({
      ...data,
      id: Date.now().toString(),
      timestamp: new Date(),
      status: 'pending'
    });
  },

  /**
   * Fetch and clear all pending panels.
   */
  fetchAndClear: () => {
    const panels = [...pendingPanels];
    pendingPanels = [];
    return panels;
  },

  /**
   * Get queue length
   */
  getQueueLength: () => pendingPanels.length
};
