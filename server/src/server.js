import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function start() {
  try {
    await connectDB();
    const app = createApp();
    const server = app.listen(env.port, () => {
      logger.info(`FreshMart API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down…`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`, err.stack);
    process.exit(1);
  }
}

start();
