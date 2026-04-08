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
    name: 'Anonymous',
    role: 'manager',
    notes: '',
    isActive: true,
  },
  {
    uid: '10',
    email: 'edward.mushi@kuringe.co.tz',
    name: 'MD',
    role: 'managing_director',
    notes: '',
    isActive: true,
    password: 'EDWARD MUSHI',
  },
  {
    uid: '2',
    email: 'gladness.tesha@kuringe.co.tz',
    name: 'Gladness Donat Tesha',
    role: 'assistant_hall_manager',
    notes: '',
    isActive: true,
  },
  {
    uid: '3',
    email: 'rose.mkonyi@kuringe.co.tz',
    name: 'Rose G. Mkonyi',
    role: 'cashier_1',
    notes: '',
    isActive: true,
  },
  {
    uid: '4',
    email: 'anna.barnaba@kuringe.co.tz',
    name: 'Anna Barnaba',
    role: 'cashier_1',
    notes: '',
    isActive: false,
  },
  {
    uid: '5',
    email: 'augustino.kilindo@kuringe.co.tz',
    name: 'Augustino George Kilindo',
    role: 'accountant',
    notes: '',
    isActive: false,
  },
  {
    uid: '6',
    email: 'regina.evarist@kuringe.co.tz',
    name: 'Regina Evarist',
    role: 'store_keeper',
    notes: '',
    isActive: true,
  },
  {
    uid: '7',
    email: 'veronika.kileo@kuringe.co.tz',
    name: 'Veronika Visent Kileo',
    role: 'purchaser',
    notes: '',
    isActive: true,
  },
  {
    uid: '8',
    email: 'jackline.faustine@kuringe.co.tz',
    name: 'Jackline Faustine',
    role: 'accountant',
    notes: '',
    isActive: true,
  },
  {
    uid: '9',
    email: 'david.kinoka@kuringe.co.tz',
    name: 'David Kinoka',
    role: 'accountant',
    notes: '',
    isActive: true,
  },
  {
    uid: '11',
    email: 'md@kuringe.co.tz',
    name: 'MD',
    role: 'managing_director',
    notes: '',
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
  const password = user.password || defaultPassword;
  try {
    await auth.getUser(user.uid);
    await auth.updateUser(user.uid, {
      email: user.email,
      displayName: user.name,
      disabled: !user.isActive,
      password,
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
      password,
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
    try {
      const authResult = await upsertAuthUser(auth, user);

      await auth.setCustomUserClaims(user.uid, {
        role: user.role,
        canResetPasswords: ['manager', 'accountant'].includes(user.role),
        canChangeRoles: ['manager', 'accountant'].includes(user.role),
      });

      try {
        await db.collection('staff_users').doc(user.uid).set(
          {
            id: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            notes: user.notes ?? '',
            isActive: user.isActive,
            createdAt: nowIso,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (firestoreError) {
        const message = firestoreError?.message || 'Unknown Firestore error';
        console.warn(`[seed] Firestore skipped for ${user.name}: ${message}`);
      }

      console.log(`[seed] ${authResult}: ${user.name} (${user.role})`);
    } catch (userError) {
      const message = userError?.message || 'Unknown error';
      console.error(`[seed] Failed for ${user.name}: ${message}`);
    }
  }

  console.log('[seed] Completed staff user provisioning.');
}

main().catch((error) => {
  console.error('[seed] Failed:', error.message);
  if (error?.code) {
    console.error('[seed] Code:', error.code);
  }
  if (error?.stack) {
    console.error(error.stack);
  }
  process.exitCode = 1;
});
