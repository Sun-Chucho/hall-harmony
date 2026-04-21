import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

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
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const bookingIds = process.argv.slice(2).map((value) => value.trim()).filter(Boolean);
  if (bookingIds.length === 0) {
    throw new Error('Provide at least one booking ID. Example: node scripts/delete-bookings.mjs BOOK-123');
  }

  const serviceAccount = readServiceAccount(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();

  for (const bookingId of bookingIds) {
    const ref = db.collection('bookings').doc(bookingId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      console.log(`[delete-bookings] skipped ${bookingId}: not found`);
      continue;
    }

    await ref.delete();
    console.log(`[delete-bookings] deleted ${bookingId}`);
  }
}

main().catch((error) => {
  console.error('[delete-bookings] failed:', error.message);
  if (error?.stack) {
    console.error(error.stack);
  }
  process.exitCode = 1;
});
