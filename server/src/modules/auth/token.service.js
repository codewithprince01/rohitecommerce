import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export function signAccessToken(admin) {
  return jwt.sign(
    { sub: admin.id || admin._id?.toString(), role: admin.role, email: admin.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl }
  );
}

export function signRefreshToken(admin) {
  return jwt.sign(
    { sub: admin.id || admin._id?.toString(), type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshTtl }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}
