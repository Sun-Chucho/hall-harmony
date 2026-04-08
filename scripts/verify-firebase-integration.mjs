import process from 'node:process';
import { initializeApp, getApps } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyA08M8_yfVofSgG4xnNghAbObQaxLeYKVQ',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'kuringehallsdatabase.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'kuringehallsdatabase',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'kuringehallsdatabase.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '449466711430',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:449466711430:web:947979d6e5b2edeaa0c007',
};

const managerEmail = process.env.VERIFY_MANAGER_EMAIL || 'diana.mushi@kuringe.co.tz';
const managerPassword = process.env.VERIFY_MANAGER_PASSWORD || '1234';
const assistantEmail = process.env.VERIFY_ASSISTANT_EMAIL || 'gladness.tesha@kuringe.co.tz';
const assistantPassword = process.env.VERIFY_ASSISTANT_PASSWORD || '1234';
const cashierEmail = process.env.VERIFY_CASHIER1_EMAIL || 'rose.mkonyi@kuringe.co.tz';
const cashierPassword = process.env.VERIFY_CASHIER1_PASSWORD || '1234';
const runPasswordRotation = String(process.env.VERIFY_PASSWORD_ROTATION || 'false').toLowerCase() === 'true';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function nowIso() {
  return new Date().toISOString();
}

async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

async function logout() {
  await signOut(auth);
}

async function getRoleForCurrentUser() {
  if (!auth.currentUser) return null;
  const snap = await getDoc(doc(db, 'staff_users', auth.currentUser.uid));
  if (!snap.exists()) return null;
  return snap.data().role || null;
}

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const flag = ok ? 'PASS' : 'FAIL';
  console.log(`[${flag}] ${name}${detail ? ` - ${detail}` : ''}`);
}

async function expectFailure(name, fn) {
  try {
    await fn();
    record(name, false, 'Expected failure but succeeded');
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown';
    record(name, true, `Blocked as expected (${code})`);
  }
}

async function main() {
  let tempAuth = null;
  let tempAuthUser = null;
  let tempStaffDocId = '';
  let managerBookingId = '';
  let assistantOwnBookingId = '';
  let publicBookingId = '';

  try {
    const manager = await login(managerEmail, managerPassword);
    const managerRole = await getRoleForCurrentUser();
    record('Manager login', true, `uid=${manager.uid}, role=${managerRole}`);
    if (managerRole !== 'manager' && managerRole !== 'accountant') {
      record('Manager role check', false, `Expected manager/accountant, got ${managerRole}`);
      return;
    }

    // 1) Manager add/remove user backend flow
    const stamp = Date.now();
    const tmpEmail = `tmp.verify.${stamp}@kuringe.co.tz`;
    const tmpPassword = `Tmp!${stamp}x`;
    const tmpApp = initializeApp(firebaseConfig, `verify-temp-${stamp}`);
    tempAuth = getAuth(tmpApp);
    const tmpCredential = await createUserWithEmailAndPassword(tempAuth, tmpEmail, tmpPassword);
    tempAuthUser = tmpCredential.user;
    tempStaffDocId = tempAuthUser.uid;

    await setDoc(doc(db, 'staff_users', tempStaffDocId), {
      id: tempStaffDocId,
      email: tmpEmail,
      name: 'Temporary Verify User',
      role: 'assistant_hall_manager',
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }, { merge: true });
    const createdStaff = await getDoc(doc(db, 'staff_users', tempStaffDocId));
    record('Manager can add staff user document', createdStaff.exists(), createdStaff.exists() ? 'Created' : 'Missing');

    await deleteDoc(doc(db, 'staff_users', tempStaffDocId));
    const deletedStaff = await getDoc(doc(db, 'staff_users', tempStaffDocId));
    record('Manager can remove staff user document', !deletedStaff.exists(), !deletedStaff.exists() ? 'Removed' : 'Still exists');

    // 2) Website booking creation, cashier visibility, manager cleanup
    publicBookingId = `BOOK-VERIFY-PUBLIC-${Date.now()}`;
    await logout();
    await setDoc(doc(db, 'bookings', publicBookingId), {
      id: publicBookingId,
      customerName: 'Public Verify Customer',
      customerPhone: '255700000001',
      eventName: 'Website Verify Event',
      eventType: 'Wedding',
      hall: 'Witness Hall',
      date: new Date().toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '12:00',
      expectedGuests: 100,
      quotedAmount: 2301000,
      notes: 'public integration verify',
      createdAt: nowIso(),
      createdByUserId: 'public-web',
      bookingStatus: 'pending',
      eventDetailStatus: 'pending_assistant',
      assignedToRole: 'cashier_1',
      sentToCashier1At: nowIso(),
      updatedAt: nowIso(),
    }, { merge: true });
    record('Public website booking create (unauth)', true, publicBookingId);

    await login(cashierEmail, cashierPassword);
    const cashierCanReadPublic = await getDoc(doc(db, 'bookings', publicBookingId));
    record('Cashier can see website booking', cashierCanReadPublic.exists(), cashierCanReadPublic.exists() ? 'Visible' : 'Not visible');
    await logout();

    await login(managerEmail, managerPassword);
    await deleteDoc(doc(db, 'bookings', publicBookingId));
    const publicDeleted = await getDoc(doc(db, 'bookings', publicBookingId));
    record('Manager can delete website booking', !publicDeleted.exists(), !publicDeleted.exists() ? 'Deleted' : 'Still exists');

    // 3) Delete booking permissions per user
    managerBookingId = `BOOK-VERIFY-MANAGER-${Date.now()}`;
    await setDoc(doc(db, 'bookings', managerBookingId), {
      id: managerBookingId,
      customerName: 'Manager Booking',
      customerPhone: '255700000002',
      eventName: 'Manager Event',
      eventType: 'Conference',
      hall: 'Kilimanjaro Hall',
      date: new Date().toISOString().slice(0, 10),
      startTime: '13:00',
      endTime: '15:00',
      expectedGuests: 80,
      quotedAmount: 1534000,
      notes: 'manager booking verify',
      createdAt: nowIso(),
      createdByUserId: auth.currentUser.uid,
      bookingStatus: 'pending',
      eventDetailStatus: 'pending_assistant',
      updatedAt: nowIso(),
    }, { merge: true });
    record('Manager created own booking for permission test', true, managerBookingId);
    await logout();

    const assistant = await login(assistantEmail, assistantPassword);
    const assistantRole = await getRoleForCurrentUser();
    record('Assistant login', true, `uid=${assistant.uid}, role=${assistantRole}`);

    await expectFailure('Assistant cannot delete manager booking', async () => {
      await deleteDoc(doc(db, 'bookings', managerBookingId));
    });

    assistantOwnBookingId = `BOOK-VERIFY-ASST-${Date.now()}`;
    await setDoc(doc(db, 'bookings', assistantOwnBookingId), {
      id: assistantOwnBookingId,
      customerName: 'Assistant Booking',
      customerPhone: '255700000003',
      eventName: 'Assistant Event',
      eventType: 'Other',
      hall: 'Hall D',
      date: new Date().toISOString().slice(0, 10),
      startTime: '16:00',
      endTime: '17:00',
      expectedGuests: 40,
      quotedAmount: 236000,
      notes: 'assistant booking verify',
      createdAt: nowIso(),
      createdByUserId: assistant.uid,
      bookingStatus: 'pending',
      eventDetailStatus: 'pending_assistant',
      updatedAt: nowIso(),
    }, { merge: true });
    await deleteDoc(doc(db, 'bookings', assistantOwnBookingId));
    const assistantOwnDeleted = await getDoc(doc(db, 'bookings', assistantOwnBookingId));
    record('Assistant can delete own booking', !assistantOwnDeleted.exists(), !assistantOwnDeleted.exists() ? 'Deleted' : 'Still exists');
    await logout();

    await login(managerEmail, managerPassword);
    await deleteDoc(doc(db, 'bookings', managerBookingId));
    const managerBookingDeleted = await getDoc(doc(db, 'bookings', managerBookingId));
    record('Manager cleanup delete own booking', !managerBookingDeleted.exists(), !managerBookingDeleted.exists() ? 'Deleted' : 'Still exists');

    // 4) Assistant cannot add users
    await logout();
    await login(assistantEmail, assistantPassword);
    await expectFailure('Assistant cannot create staff user document', async () => {
      await setDoc(doc(db, 'staff_users', `tmp-no-perm-${Date.now()}`), {
        id: `tmp-no-perm-${Date.now()}`,
        email: `tmp.no.perm.${Date.now()}@kuringe.co.tz`,
        name: 'No Perm User',
        role: 'cashier_1',
        isActive: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    });
    await logout();

    // 5) Optional manager password rotation smoke
    if (runPasswordRotation) {
      const rotationNewPassword = `MgrTmp!${Date.now()}`;
      await login(managerEmail, managerPassword);
      await updatePassword(auth.currentUser, rotationNewPassword);
      await logout();

      await login(managerEmail, rotationNewPassword);
      record('Manager password change works (rotate forward)', true, 'Able to login with new password');
      await updatePassword(auth.currentUser, managerPassword);
      await logout();

      await login(managerEmail, managerPassword);
      record('Manager password change works (rotate back)', true, 'Reverted and login restored');
      await logout();
    } else {
      record('Manager password rotation test', true, 'Skipped (set VERIFY_PASSWORD_ROTATION=true to run)');
    }

    // 6) Quick cross-check that website bookings are queryable to manager
    await login(managerEmail, managerPassword);
    const q = query(
      collection(db, 'bookings'),
      where('createdByUserId', '==', 'public-web'),
    );
    const snapshot = await getDocs(q);
    record('Manager can query website bookings', true, `count=${snapshot.size}`);
    await logout();
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
    record('Fatal test error', false, message);
  } finally {
    try {
      await logout();
    } catch {
      // Ignore.
    }
    if (tempAuthUser) {
      try {
        await deleteUser(tempAuthUser);
      } catch {
        // Ignore cleanup failures.
      }
    }
    if (tempAuth) {
      try {
        await signOut(tempAuth);
      } catch {
        // Ignore.
      }
    }
  }

  const passed = results.filter((item) => item.ok).length;
  const failed = results.filter((item) => !item.ok).length;
  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
