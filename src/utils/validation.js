/**
 * Sanitizes user input by stripping control characters and trimming whitespace.
 * Returns null if the result is empty.
 *
 * @param {string} input
 * @returns {string|null}
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return null;

  // Remove zero-width characters, control characters (except newlines/tabs)
  const cleaned = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g, '')
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Validates that a string does not exceed a maximum byte length.
 * Useful for preventing oversized payloads.
 *
 * @param {string} input
 * @param {number} maxBytes
 * @returns {boolean}
 */
function isWithinByteLimit(input, maxBytes) {
  return Buffer.byteLength(input, 'utf8') <= maxBytes;
}

module.exports = { sanitizeInput, isWithinByteLimit };
