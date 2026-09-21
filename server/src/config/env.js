import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4000),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/freshmart'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
  },

  seed: {
    email: process.env.SEED_ADMIN_EMAIL || 'agrawalshop@gmail.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'agrawalshop@1234',
    name: process.env.SEED_ADMIN_NAME || 'Agrawal General & Provisional Store',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxMb: Number(process.env.MAX_UPLOAD_MB || 5),
    /**
     * Origin written into the URLs handed back for uploaded files. Left empty
     * we fall back to the request's own host, which is right in development
     * (client on :5173, API on :4000) but must be set behind a proxy/CDN so the
     * URL stored on the product keeps working.
     */
    publicUrl: (process.env.PUBLIC_URL || '').replace(/\/$/, ''),
  },
};
