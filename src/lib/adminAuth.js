import crypto from 'crypto';

/**
 * Retrieves the configured Admin Master Key from environment variables.
 * Can be changed at any time in .env.local via ADMIN_MASTER_KEY.
 */
export function getAdminMasterKey() {
  return (
    process.env.ADMIN_MASTER_KEY ||
    process.env.ADMIN_SECRET_KEY ||
    process.env.ADMIN_PASSCODE ||
    'FlowerSpot@2026'
  ).trim();
}

/**
 * Generates a tamper-proof session token when the admin enters the correct master key.
 */
export function generateAdminSessionToken(key) {
  const masterKey = getAdminMasterKey();
  if (!key || key.trim() !== masterKey) {
    return null;
  }
  const hmac = crypto.createHmac('sha256', masterKey);
  hmac.update(`fs-admin-auth-${masterKey}`);
  return hmac.digest('hex');
}

/**
 * Verifies if an incoming HTTP request is from an authenticated administrator.
 * Checks Bearer tokens, x-admin-key, x-admin-token, and x-admin-passcode headers.
 */
export function isAuthorizedAdmin(request) {
  const masterKey = getAdminMasterKey();
  const validToken = generateAdminSessionToken(masterKey);

  const authHeader = request.headers.get('authorization') || '';
  const adminKeyHeader = request.headers.get('x-admin-key') || '';
  const adminTokenHeader = request.headers.get('x-admin-token') || '';
  const adminPasscodeHeader = request.headers.get('x-admin-passcode') || '';

  const candidates = [
    adminKeyHeader.trim(),
    adminTokenHeader.trim(),
    adminPasscodeHeader.trim()
  ];

  if (authHeader.startsWith('Bearer ')) {
    candidates.push(authHeader.replace('Bearer ', '').trim());
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate === masterKey || candidate === validToken) {
      return true;
    }
  }

  return false;
}
