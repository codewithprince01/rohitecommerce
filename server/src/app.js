import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // allow same-origin / curl (no origin) and configured origins
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());
  app.use(
    morgan(env.isProd ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );

  // Static uploads
  app.use('/uploads', express.static(env.upload.dir));

  // Rate-limited API surface
  app.use('/api', apiLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
