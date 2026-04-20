import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  'C:\\Users\\PC\\Downloads\\kuringehallsdatabase-firebase-adminsdk-fbsvc-12dcc87f09.json';

function readServiceAccount(filePath) {
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Service account JSON not found: ${resolvedPath}`);
  }
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

async function getAccessToken(serviceAccount) {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse?.token) {
    throw new Error('Unable to acquire access token for Firestore Admin API.');
  }
  return tokenResponse.token;
}

async function createDefaultDatabase(projectId, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases?databaseId=(default)`;
  const body = {
    type: 'FIRESTORE_NATIVE',
    locationId: 'us-central',
    concurrencyMode: 'PESSIMISTIC',
    appEngineIntegrationMode: 'DISABLED',
    pointInTimeRecoveryEnablement: 'POINT_IN_TIME_RECOVERY_DISABLED',
    deleteProtectionState: 'DELETE_PROTECTION_DISABLED',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (response.ok) {
    console.log('[firestore] Default database creation started.');
    return;
  }

  const message = String(payload?.error?.message || '');
  if (response.status === 409 || message.includes('already exists')) {
    console.log('[firestore] Default database already exists.');
    return;
  }

  throw new Error(`Firestore DB creation failed (${response.status}): ${message || 'Unknown error'}`);
}

async function checkDefaultDatabase(projectId, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    console.log('[firestore] Default database already exists.');
    return true;
  }

  if (response.status === 404) {
    return false;
  }

  const payload = await response.json().catch(() => ({}));
  const message = String(payload?.error?.message || '');
  throw new Error(`Firestore DB check failed (${response.status}): ${message || 'Unknown error'}`);
}

async function main() {
  const serviceAccount = readServiceAccount(serviceAccountPath);
  const projectId = serviceAccount.project_id;
  if (!projectId) {
    throw new Error('project_id missing in service account file.');
  }

  const token = await getAccessToken(serviceAccount);
  const exists = await checkDefaultDatabase(projectId, token);
  if (exists) {
    return;
  }
  await createDefaultDatabase(projectId, token);
}

main().catch((error) => {
  console.error('[firestore] Failed:', error.message);
  process.exitCode = 1;
});
