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
  process.argv[2] ||
  'C:\\Users\\PC\\Downloads\\kuringehallsdatabase-firebase-adminsdk-fbsvc-12dcc87f09.json';

function readServiceAccount(filePath) {
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Service account JSON not found: ${resolvedPath}`);
  }
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  return JSON.parse(raw);
}

function normalizeToken(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^0-9A-Z/]/g, '')
    .split('/')
    .map((part) => part.replace(/^0+/, '') || '0')
    .filter(Boolean);
}

function sanitizeReference(value, fallbackPrefix, fallbackId) {
  const text = String(value || '').trim();
  if (text) return text;
  return `${fallbackPrefix}-${String(fallbackId).slice(0, 6).toUpperCase()}`;
}

function createStage(code, label, at, note) {
  return {
    id: `${code}-${at}`,
    code,
    label,
    at,
    ...(note ? { note } : {}),
  };
}

function labelsForLegacyCompletion(voucher) {
  const note = voucher?.fields?.voucher_number
    ? `Imported from legacy payment voucher ${voucher.fields.voucher_number}`
    : 'Imported from legacy payment voucher';
  return [
    createStage('approved_by_accountant', 'Approved by Accountant', voucher.submittedAt, note),
    createStage('moved_to_halls_manager', 'Moved to Halls Manager', voucher.submittedAt, note),
    createStage('approved_by_halls_manager', 'Approved by Halls Manager', voucher.submittedAt, note),
    createStage('moved_to_cashier', 'Moved to Cashier', voucher.submittedAt, note),
    createStage('payment_voucher_created', 'Payment Voucher Created', voucher.submittedAt, note),
    createStage('sent_to_accountant', 'Sent to Accountant', voucher.submittedAt, note),
    createStage('completed', 'Request Approved / Completed', voucher.submittedAt, note),
  ];
}

async function main() {
  const serviceAccount = readServiceAccount(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();

  const outputsSnapshot = await db.collection('document_form_outputs').get();
  const outputs = outputsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const cashOutputs = outputs
    .filter((entry) => entry.formId === 'cash_request')
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  const purchaseOutputs = outputs
    .filter((entry) => entry.formId === 'purchase_items' || entry.formId === 'purchase_request')
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  const voucherOutputs = outputs
    .filter((entry) => entry.formId === 'payment_voucher')
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const vouchersByToken = new Map();
  for (const voucher of voucherOutputs) {
    for (const token of normalizeToken(voucher?.fields?.request_number || voucher?.fields?.request_reference)) {
      if (!vouchersByToken.has(token)) vouchersByToken.set(token, []);
      vouchersByToken.get(token).push(voucher);
    }
  }

  let createdCash = 0;
  let skippedCash = 0;
  let completedCash = 0;
  let pendingCash = 0;

  for (const output of cashOutputs) {
    const workflowRef = db.collection('cash_request_workflow').doc(output.id);
    if ((await workflowRef.get()).exists) {
      skippedCash += 1;
      continue;
    }

    const pefTokens = normalizeToken(output?.fields?.pef_no);
    const matchedVouchers = pefTokens.flatMap((token) => vouchersByToken.get(token) || []);
    const voucher = matchedVouchers[0];
    const stages = [
      createStage('submitted', 'Submitted', output.submittedAt),
      createStage('moved_to_accountant', 'Moved to Accountant', output.submittedAt),
      ...(voucher ? labelsForLegacyCompletion(voucher) : []),
    ];

    const payload = {
      reference: sanitizeReference(output?.fields?.pef_no, 'CR', output.id),
      submittedAt: output.submittedAt,
      submittedBy: output.submittedBy,
      submittedByRole: output.submittedByRole,
      fields: output.fields || {},
      currentStatus: voucher ? 'completed' : 'pending_accountant',
      status: voucher ? 'completed' : 'pending_accountant',
      currentAssigneeRole: voucher ? null : 'accountant',
      stages,
      paymentVoucherId: voucher?.id || null,
      paymentVoucherNumber: voucher?.fields?.voucher_number || null,
      paymentVoucherCreatedAt: voucher?.submittedAt || null,
      completedAt: voucher?.submittedAt || null,
      sourceOutputId: output.id,
      migratedFromLegacy: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await workflowRef.set(payload, { merge: true });
    createdCash += 1;
    if (voucher) completedCash += 1;
    else pendingCash += 1;
  }

  let createdPurchase = 0;
  let skippedPurchase = 0;

  for (const output of purchaseOutputs) {
    const workflowRef = db.collection('purchase_item_workflow').doc(output.id);
    if ((await workflowRef.get()).exists) {
      skippedPurchase += 1;
      continue;
    }

    await workflowRef.set({
      reference: sanitizeReference(output?.fields?.request_no || output?.fields?.requested_by, 'PR', output.id),
      submittedAt: output.submittedAt,
      submittedBy: output.submittedBy,
      submittedByRole: output.submittedByRole,
      fields: output.fields || {},
      currentStatus: 'pending_purchaser',
      status: 'pending_purchaser',
      sourceOutputId: output.id,
      migratedFromLegacy: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    createdPurchase += 1;
  }

  console.log(`[backfill] Cash workflows created: ${createdCash}`);
  console.log(`[backfill] Cash workflows skipped: ${skippedCash}`);
  console.log(`[backfill] Cash workflows completed from voucher matches: ${completedCash}`);
  console.log(`[backfill] Cash workflows left pending accountant: ${pendingCash}`);
  console.log(`[backfill] Purchase workflows created: ${createdPurchase}`);
  console.log(`[backfill] Purchase workflows skipped: ${skippedPurchase}`);
}

main().catch((error) => {
  console.error('[backfill] Failed:', error.message);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
