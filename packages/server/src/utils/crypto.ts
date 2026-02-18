import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateApiKey(): string {
  const random = crypto.randomBytes(32).toString('base64url');
  return `ahq_${random}`;
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 12);
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, SALT_ROUNDS);
}

export async function compareApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

export function generateInviteToken(): string {
  const random = crypto.randomBytes(8).toString('base64url');
  const part1 = random.substring(0, 5);
  const part2 = random.substring(5, 9);
  return `AHQ-${part1}-${part2}`;
}
