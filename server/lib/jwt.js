import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const TTL_SECONDS = 60 * 60; // 1 hour

export function signToken(payload = { role: 'admin' }) {
  return jwt.sign(payload, SECRET, { expiresIn: TTL_SECONDS });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
