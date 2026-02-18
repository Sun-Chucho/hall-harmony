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
  'C:\\Users\\PC\\Downloads\\kuringehallsdatabase-firebase-adminsdk-fbsvc-abfa71b989.json';

const defaultPassword = process.env.DEFAULT_STAFF_PASSWORD || '1234';

const staffUsers = [
  {
    uid: '1',
    email: 'diana.mushi@kuringe.co.tz',
    name: 'Diana Mushi',
    role: 'manager',
    isActive: true,
  },
  {
    uid: '2',
    email: 'gladness.tesha@kuringe.co.tz',
    name: 'Gladness Donat Tesha',
    role: 'assistant_hall_manager',
    isActive: true,
  },
  {
    uid: '3',
    email: 'rose.mkonyi@kuringe.co.tz',
    name: 'Rose G. Mkonyi',
    role: 'cashier_1',
    isActive: true,
  },
  {
    uid: '4',
    email: 'anna.barnaba@kuringe.co.tz',
    name: 'Anna Barnaba',
    role: 'cashier_2',
    isActive: true,
  },
  {
    uid: '5',
    email: 'augustino.kilindo@kuringe.co.tz',
    name: 'Augustino George Kilindo',
    role: 'controller',
    isActive: true,
  },
  {
    uid: '6',
    email: 'regina.evarist@kuringe.co.tz',
    name: 'Regina Evarist',
    role: 'store_keeper',
    isActive: true,
  },
  {
    uid: '7',
    email: 'veronika.kileo@kuringe.co.tz',
    name: 'Veronika Visent Kileo',
    role: 'purchaser',
    isActive: true,
  },
  {
    uid: '8',
    email: 'jackline.faustine@kuringe.co.tz',
    name: 'Jackline Faustine',
    role: 'accountant',
    isActive: true,
  },
  {
    uid: '9',
    email: 'david.kinoka@kuringe.co.tz',
    name: 'David Kinoka',
    role: 'accountant',
    isActive: true,
  },
];

function readServiceAccount(filePath) {
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Service account JSON not found: ${resolvedPath}`);
  }
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  return JSON.parse(raw);
}

async function upsertAuthUser(auth, user) {
  try {
    await auth.getUser(user.uid);
    await auth.updateUser(user.uid, {
      email: user.email,
      displayName: user.name,
      disabled: !user.isActive,
      password: defaultPassword,
    });
    return 'updated';
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }
    await auth.createUser({
      uid: user.uid,
      email: user.email,
      displayName: user.name,
      disabled: !user.isActive,
      password: defaultPassword,
    });
    return 'created';
  }
}

async function main() {
  const serviceAccount = readServiceAccount(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();
  const nowIso = new Date().toISOString();

  for (const user of staffUsers) {
    const authResult = await upsertAuthUser(auth, user);

    await auth.setCustomUserClaims(user.uid, {
      role: user.role,
      canResetPasswords: ['manager', 'controller'].includes(user.role),
      canChangeRoles: ['manager', 'controller'].includes(user.role),
    });

    await db.collection('staff_users').doc(user.uid).set(
      {
        id: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: nowIso,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // Keep logs concise without exposing secrets.
    console.log(`[seed] ${authResult}: ${user.name} (${user.role})`);
  }

  console.log('[seed] Completed staff user provisioning.');
}

main().catch((error) => {
  console.error('[seed] Failed:', error.message);
  process.exitCode = 1;
});
