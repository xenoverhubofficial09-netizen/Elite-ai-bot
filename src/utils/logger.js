/**
 * Lightweight structured logger.
 * Outputs JSON lines in production, human-readable in development.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const LEVELS = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
};

/**
 * Formats and writes a log entry to stdout/stderr.
 * @param {'info'|'warn'|'error'|'debug'} level
 * @param {string} message
 * @param {...any} args
 */
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const label = LEVELS[level] || 'LOG';

  if (IS_PRODUCTION) {
    const entry = {
      timestamp,
      level: label,
      message,
      ...(args.length > 0 && { details: args }),
    };
    const output = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  } else {
    const extra = args.length > 0 ? ' ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') : '';
    const line = `[${timestamp}] [${label}] ${message}${extra}`;
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}

const logger = {
  info: (msg, ...args) => log('info', msg, ...args),
  warn: (msg, ...args) => log('warn', msg, ...args),
  error: (msg, ...args) => log('error', msg, ...args),
  debug: (msg, ...args) => {
    if (process.env.DEBUG === 'true') log('debug', msg, ...args);
  },
};

module.exports = logger;
