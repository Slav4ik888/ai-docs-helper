import bcrypt from 'bcryptjs';
import { configRepository } from '../repositories/config.repository.js';
import { signToken } from '../lib/jwt.js';

const PIN_KEY = 'admin_pin_hash';
const DEFAULT_PIN = process.env.ADMIN_PIN || '1234';

export async function ensurePinInitialized() {
  const existing = configRepository.get(PIN_KEY);
  if (!existing) {
    const hash = await bcrypt.hash(DEFAULT_PIN, 10);
    configRepository.set(PIN_KEY, hash);
    console.log(`[pin] initialized with default pin "${DEFAULT_PIN}"`);
  }
}

export async function verifyPin(pin) {
  const hash = configRepository.get(PIN_KEY);
  if (!hash || typeof pin !== 'string') return null;
  const ok = await bcrypt.compare(pin, hash);
  if (!ok) return null;
  return signToken({ role: 'admin' });
}
