import { env } from './env.js';

// Tiny dependency-free structured logger. Swap for pino/winston if needed.
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = env.isProd ? LEVELS.info : LEVELS.debug;

function log(level, message, meta) {
  if (LEVELS[level] > threshold) return;
  const time = new Date().toISOString();
  const base = `${time} [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](base, meta);
  } else {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](base);
  }
}

export const logger = {
  error: (m, meta) => log('error', m, meta),
  warn: (m, meta) => log('warn', m, meta),
  info: (m, meta) => log('info', m, meta),
  debug: (m, meta) => log('debug', m, meta),
};
