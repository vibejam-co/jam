import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const KEY_LENGTH_BYTES = 32;

export type EncryptedSecretPayload = {
  v: string;
  iv_b64: string;
  tag_b64: string;
  ciphertext_b64: string;
};

const getEncryptionKey = () => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('Missing ENCRYPTION_KEY. Provide a 32-byte base64 key.');
  }

  const decoded = Buffer.from(raw, 'base64');
  if (decoded.length !== KEY_LENGTH_BYTES) {
    throw new Error('ENCRYPTION_KEY must be base64 for exactly 32 bytes.');
  }

  return decoded;
};

const getVersion = () => process.env.ENCRYPTION_KEY_VERSION || 'v1';

export const encryptSecret = (plaintext: string): string => {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedSecretPayload = {
    v: getVersion(),
    iv_b64: iv.toString('base64'),
    tag_b64: tag.toString('base64'),
    ciphertext_b64: encrypted.toString('base64'),
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
};

export const decryptSecret = (encoded: string): string => {
  const key = getEncryptionKey();
  let payload: EncryptedSecretPayload;

  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as EncryptedSecretPayload;
  } catch {
    throw new Error('Encrypted secret payload is malformed.');
  }

  if (!payload?.iv_b64 || !payload?.tag_b64 || !payload?.ciphertext_b64) {
    throw new Error('Encrypted secret payload is incomplete.');
  }

  const iv = Buffer.from(payload.iv_b64, 'base64');
  const tag = Buffer.from(payload.tag_b64, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext_b64, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
};

export const keyFingerprint = (secret: string): string => {
  const tail = secret.slice(-4);
  const head = secret.slice(0, 4);
  return `${head}...${tail}`;
};
