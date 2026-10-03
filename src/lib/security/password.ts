import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 1024;

const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;

export const SCRYPT_PARAMS = {
  N: SCRYPT_N,
  r: SCRYPT_R,
  p: SCRYPT_P,
  keyLength: SCRYPT_KEY_LENGTH,
  maxmem: SCRYPT_MAX_MEMORY,
};

export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return "A palavra-passe excede o limite permitido.";
  }
  return null;
}

function deriveScrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAX_MEMORY },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(Buffer.from(derivedKey));
      },
    );
  });
}

/**
 * Node.js reviewed, memory-hard scrypt KDF.
 * Standard format: scrypt$N=32768,r=8,p=1$<salt_base64url>$<digest_base64url>
 */
export async function hashPassword(password: string): Promise<string> {
  const validationError = validatePassword(password);
  if (validationError) throw new Error(validationError);

  const salt = randomBytes(16);
  const digest = await deriveScrypt(password, salt);
  return [
    "scrypt",
    `N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}`,
    salt.toString("base64url"),
    digest.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedHash: string | null | undefined,
): Promise<boolean> {
  if (!encodedHash) return false;
  const [algorithm, parameters, encodedSalt, encodedDigest] = encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    parameters !== `N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}` ||
    !encodedSalt ||
    !encodedDigest
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(encodedDigest, "base64url");
    if (expected.length !== SCRYPT_KEY_LENGTH) return false;
    const actual = await deriveScrypt(password, Buffer.from(encodedSalt, "base64url"));
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
