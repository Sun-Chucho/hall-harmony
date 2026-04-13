import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, query, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { db } from '@/lib/firebase';
import { getFirestoreWriteErrorMessage } from '@/lib/firestoreWriteErrors';
import { DamagedItemRecord, EventItemAllocation, InventoryItem, InventoryMovement } from '@/types/inventory';

interface InventoryReport { totalItems: number; lowStockItems: number; totalUnits: number; totalAllocatedOpen: number; }
interface EditInventoryItemInput {
  name: string;
  unit: string;
  currentQuantity: number;
  reorderLevel: number;
  reason: string;
}
interface InventoryContextValue {
  items: InventoryItem[];
  movements: InventoryMovement[];
  damages: DamagedItemRecord[];
  allocations: EventItemAllocation[];
  canManageInventory: boolean;
  addItem: (name: string, unit: string, openingQuantity: number, reorderLevel: number) => Promise<{ ok: boolean; message: string }>;
  editItem: (itemId: string, input: EditInventoryItemInput) => Promise<{ ok: boolean; message: string }>;
  stockIn: (itemId: string, quantity: number, reference: string, notes: string) => Promise<{ ok: boolean; message: string }>;
  stockOut: (itemId: string, quantity: number, reference: string, notes: string) => Promise<{ ok: boolean; message: string }>;
  allocateToEvent: (bookingId: string, itemId: string, quantity: number, notes: string) => Promise<{ ok: boolean; message: string }>;
  returnFromEvent: (allocationId: string) => Promise<{ ok: boolean; message: string }>;
  recordDamage: (itemId: string, quantity: number, reason: string, bookingId?: string) => Promise<{ ok: boolean; message: string }>;
  getReport: () => InventoryReport;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);
const ITEMS_COLLECTION = 'inventory_items';
const MOVEMENTS_COLLECTION = 'inventory_movements';
const DAMAGES_COLLECTION = 'inventory_damages';
const ALLOCATIONS_COLLECTION = 'inventory_allocations';

function generateReference(prefix: string) { return `${prefix}-${Date.now()}`; }

function createClientStateError(message: string) {
  return Object.assign(new Error(message), { code: 'client-state' });
}

function normalizeInventoryItemRecord(
  id: string,
  raw: Partial<InventoryItem> | undefined,
  fallback?: InventoryItem,
): InventoryItem {
  const quantity = Number(raw?.currentQuantity);
  const reorderLevel = Number(raw?.reorderLevel);

  return {
    id,
    name: typeof raw?.name === 'string' ? raw.name : fallback?.name ?? '',
    unit: typeof raw?.unit === 'string' ? raw.unit : fallback?.unit ?? '',
    currentQuantity: Number.isFinite(quantity) ? Math.round(quantity) : fallback?.currentQuantity ?? 0,
    reorderLevel: Number.isFinite(reorderLevel) ? Math.round(reorderLevel) : fallback?.reorderLevel ?? 0,
    createdAt: typeof raw?.createdAt === 'string' ? raw.createdAt : fallback?.createdAt ?? new Date().toISOString(),
    createdByUserId: typeof raw?.createdByUserId === 'string' ? raw.createdByUserId : fallback?.createdByUserId ?? '',
  };
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { policy } = useAuthorization();
  const { bookings } = useBookings();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [damages, setDamages] = useState<DamagedItemRecord[]>([]);
  const [allocations, setAllocations] = useState<EventItemAllocation[]>([]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    const unsub = onSnapshot(query(collection(db, ITEMS_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => normalizeInventoryItemRecord(item.id, item.data() as Partial<InventoryItem>))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(next);
    }, () => setItems([]));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setMovements([]); return; }
    const unsub = onSnapshot(query(collection(db, MOVEMENTS_COLLECTION), limit(5000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<InventoryMovement, 'id'>) }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMovements(next);
    }, () => setMovements([]));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setDamages([]); return; }
    const unsub = onSnapshot(query(collection(db, DAMAGES_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<DamagedItemRecord, 'id'>) }))
        .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
      setDamages(next);
    }, () => setDamages([]));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setAllocations([]); return; }
    const unsub = onSnapshot(query(collection(db, ALLOCATIONS_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<EventItemAllocation, 'id'>) }))
        .sort((a, b) => new Date(b.allocatedAt).getTime() - new Date(a.allocatedAt).getTime());
      setAllocations(next);
    }, () => setAllocations([]));
    return () => unsub();
  }, [user]);

  const canManage = useCallback(() => !!user && (user.role === 'store_keeper' || user.role === 'accountant'), [user]);
  const canActWhenFrozen = useCallback(() => user?.role === 'accountant', [user]);
  const addItem = useCallback(async (name: string, unit: string, openingQuantity: number, reorderLevel: number) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper or Accountant can manage inventory.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };
    if (!name.trim() || !unit.trim()) return { ok: false, message: 'Item name and unit are required.' };
    if (!Number.isFinite(openingQuantity) || openingQuantity < 0 || !Number.isFinite(reorderLevel) || reorderLevel < 0) {
      return { ok: false, message: 'Quantities cannot be negative.' };
    }

    const normalizedOpeningQuantity = Math.round(openingQuantity);
    const createdAt = new Date().toISOString();
    const item: InventoryItem = {
      id: `ITEM-${crypto.randomUUID()}`,
      name: name.trim(),
      unit: unit.trim(),
      currentQuantity: normalizedOpeningQuantity,
      reorderLevel: Math.round(reorderLevel),
      createdAt,
      createdByUserId: user.id,
    };
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId: item.id,
      type: normalizedOpeningQuantity > 0 ? 'stock_in' : 'adjustment',
      quantity: normalizedOpeningQuantity,
      reference: normalizedOpeningQuantity > 0 ? 'OPENING' : 'ITEM-CREATE',
      notes: normalizedOpeningQuantity > 0 ? 'Opening stock balance' : 'Inventory item created with zero opening balance',
      performedByUserId: user.id,
      performedByRole: user.role,
      createdAt,
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, ITEMS_COLLECTION, item.id), { ...item, updatedAt: serverTimestamp() }, { merge: true });
      batch.set(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
      await batch.commit();

      setItems((prev) => [item, ...prev]);
      setMovements((prev) => [movement, ...prev]);
      return { ok: true, message: 'Inventory item created.' };
    } catch (error) {
      return {
        ok: false,
        message: getFirestoreWriteErrorMessage(error, {
          fallback: 'Unable to create inventory item right now.',
          permissionDenied: 'Backend rejected the inventory item. Please sign in again and retry.',
        }),
      };
    }
  }, [canActWhenFrozen, canManage, policy.transactionsFrozen, user]);

  const editItem = useCallback(async (itemId: string, input: EditInventoryItemInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper or Accountant can edit inventory.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };

    const targetItem = items.find((item) => item.id === itemId);
    if (!targetItem) return { ok: false, message: 'Item not found.' };

    const nextName = input.name.trim();
    const nextUnit = input.unit.trim();
    const nextQuantity = Math.round(input.currentQuantity);
    const nextReorderLevel = Math.round(input.reorderLevel);
    const changeReason = input.reason.trim();

    if (!nextName || !nextUnit) return { ok: false, message: 'Item name and unit are required.' };
    if (!Number.isFinite(nextQuantity) || nextQuantity < 0 || !Number.isFinite(nextReorderLevel) || nextReorderLevel < 0) {
      return { ok: false, message: 'Quantities cannot be negative.' };
    }
    if (!changeReason) return { ok: false, message: 'Edit reason is required.' };

    const updatedItem: InventoryItem = {
      ...targetItem,
      name: nextName,
      unit: nextUnit,
      currentQuantity: nextQuantity,
      reorderLevel: nextReorderLevel,
    };

    const changes: string[] = [];
    if (targetItem.name !== updatedItem.name) changes.push(`Name: ${targetItem.name} -> ${updatedItem.name}`);
    if (targetItem.unit !== updatedItem.unit) changes.push(`Unit: ${targetItem.unit} -> ${updatedItem.unit}`);
    if (targetItem.currentQuantity !== updatedItem.currentQuantity) changes.push(`Quantity: ${targetItem.currentQuantity} -> ${updatedItem.currentQuantity}`);
    if (targetItem.reorderLevel !== updatedItem.reorderLevel) changes.push(`Reorder level: ${targetItem.reorderLevel} -> ${updatedItem.reorderLevel}`);
    if (changes.length === 0) return { ok: false, message: 'No changes detected.' };

    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'adjustment',
      quantity: updatedItem.currentQuantity - targetItem.currentQuantity,
      reference: generateReference('EDIT'),
      notes: `${changeReason}. ${changes.join(' | ')}`,
      performedByUserId: user.id,
      performedByRole: user.role,
      createdAt: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, ITEMS_COLLECTION, itemId), { ...updatedItem, updatedAt: serverTimestamp() }, { merge: true });
      batch.set(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
      await batch.commit();

      setItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));
      setMovements((prev) => [movement, ...prev]);
      return { ok: true, message: 'Inventory item updated.' };
    } catch (error) {
      return {
        ok: false,
        message: getFirestoreWriteErrorMessage(error, {
          fallback: 'Unable to update inventory item right now.',
          permissionDenied: 'Backend rejected the inventory update. Please sign in again and retry.',
          notFound: 'Inventory item was not found in backend. Refresh the page and retry.',
        }),
      };
    }
  }, [canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);

  const stockIn = useCallback(async (itemId: string, quantity: number, reference: string, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper or Accountant can stock in.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };
    const nextItem = items.find((item) => item.id === itemId);
    if (!nextItem) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Stock in quantity must be greater than zero.' };

    const normalizedQuantity = Math.round(quantity);
    const movementReference = reference.trim() || generateReference('STKIN');
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'stock_in',
      quantity: normalizedQuantity,
      reference: movementReference,
      notes: notes.trim(),
      performedByUserId: user.id,
      performedByRole: user.role,
      createdAt: new Date().toISOString(),
    };

    try {
      const { updatedItem } = await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        const snapshot = await transaction.get(itemRef);
        if (!snapshot.exists()) throw createClientStateError('Item not found.');

        const liveItem = normalizeInventoryItemRecord(itemId, snapshot.data() as Partial<InventoryItem>, nextItem);
        const updatedItem = { ...liveItem, currentQuantity: liveItem.currentQuantity + normalizedQuantity };

        transaction.set(itemRef, { ...updatedItem, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
        return { updatedItem };
      });

      setItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));
      setMovements((prev) => [movement, ...prev]);
      return { ok: true, message: 'Stock in recorded.' };
    } catch (error) {
      return {
        ok: false,
        message: getFirestoreWriteErrorMessage(error, {
          fallback: 'Unable to record stock in right now.',
          permissionDenied: 'Backend rejected the stock in update. Please sign in again and retry.',
          notFound: 'Inventory item was not found in backend. Refresh the page and retry.',
        }),
      };
    }
  }, [canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);

  const stockOut = useCallback(async (itemId: string, quantity: number, reference: string, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper or Accountant can stock out.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Stock out quantity must be greater than zero.' };

    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock quantity.' };

    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'stock_out',
      quantity: normalizedQuantity,
      reference: reference.trim() || generateReference('STKOUT'),
      notes: notes.trim(),
      performedByUserId: user.id,
      performedByRole: user.role,
      createdAt: new Date().toISOString(),
    };

    try {
      const { updatedItem } = await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        const snapshot = await transaction.get(itemRef);
        if (!snapshot.exists()) throw createClientStateError('Item not found.');

        const liveItem = normalizeInventoryItemRecord(itemId, snapshot.data() as Partial<InventoryItem>, item);
        if (liveItem.currentQuantity < normalizedQuantity) {
          throw createClientStateError('Insufficient stock quantity.');
        }

        const updatedItem = { ...liveItem, currentQuantity: Math.max(liveItem.currentQuantity - normalizedQuantity, 0) };
        transaction.set(itemRef, { ...updatedItem, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
        return { updatedItem };
      });

      setItems((prev) => prev.map((entry) => (entry.id === itemId ? updatedItem : entry)));
      setMovements((prev) => [movement, ...prev]);
      return { ok: true, message: 'Stock out recorded.' };
    } catch (error) {
      return {
        ok: false,
        message: getFirestoreWriteErrorMessage(error, {
          fallback: 'Unable to record stock out right now.',
          permissionDenied: 'Backend rejected the stock out update. Please sign in again and retry.',
          notFound: 'Inventory item was not found in backend. Refresh the page and retry.',
        }),
      };
    }
  }, [canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);

  const allocateToEvent = useCallback(async (bookingId: string, itemId: string, quantity: number, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper or Accountant can allocate event items.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };

    const booking = bookings.find((entry) => entry.id === bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (booking.bookingStatus !== 'approved') return { ok: false, message: 'Only approved bookings can receive stock allocation.' };

    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Allocation quantity must be greater than zero.' };

    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock for allocation.' };

    const createdAt = new Date().toISOString();
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'allocation',
      quantity: normalizedQuantity,
      reference: `EVT-${bookingId}`,
      notes: notes.trim(),
      eventBookingId: bookingId,
      performedByUserId: user.id,
      performedByRole: user.role,
      createdAt,
    };
    const allocation: EventItemAllocation = {
      id: `ALC-${crypto.randomUUID()}`,
      bookingId,
      itemId,
      quantity: normalizedQuantity,
      status: 'allocated',
      notes: notes.trim(),
      allocatedByUserId: user.id,
      allocatedAt: createdAt,
    };

    try {
      const { updatedItem } = await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        const snapshot = await transaction.get(itemRef);
        if (!snapshot.exists()) throw createClientStateError('Item not found.');

        const liveItem = normalizeInventoryItemRecord(itemId, snapshot.data() as Partial<InventoryItem>, item);
        if (liveItem.currentQuantity < normalizedQuantity) {
          throw createClientStateError('Insufficient stock for allocation.');
        }

        const updatedItem = { ...liveItem, currentQuantity: Math.max(liveItem.currentQuantity - normalizedQuantity, 0) };
        transaction.set(itemRef, { ...updatedItem, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(doc(db, ALLOCATIONS_COLLECTION, allocation.id), { ...allocation, updatedAt: serverTimestamp() }, { merge: true });
        return { updatedItem };
      });

      setItems((prev) => prev.map((entry) => (entry.id === itemId ? updatedItem : entry)));
      setMovements((prev) => [movement, ...prev]);
      setAllocations((prev) => [allocation, ...prev]);
      return { ok: true, message: 'Item allocated to event.' };
    } catch (error) {
      return {
        ok: false,
        message: getFirestoreWriteErrorMessage(error, {
          fallback: 'Unable to allocate item to event right now.',
          permissionDenied: 'Backend rejected the event allocation. Please sign in again and retry.',
          notFound: 'Inventory item was not found in backend. Refresh the page and retry.',
        }),
      };
    }
  }, [bookings, canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);
  const returnFromEvent = useCallback(async (allocationId: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper or Accountant can process returns.' };

    const allocation = allocations.find((entry) => entry.id === allocationId);
    if (!allocation) return { ok: false, message: 'Allocation not found.' };
    if (allocation.status === 'returned') return { ok: false, message: 'Allocation already returned.' };

    const item = items.find((entry) => entry.id === allocation.itemId);
    if (!item) return { ok: false, message: 'Item not found.' };

    const createdAt = new Date().toISOString();
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId: allocation.itemId,
      type: 'return',
      quantity: allocation.quantity,
      reference: `RET-${allocation.bookingId}`,
      notes: 'Event return',
      eventBookingId: allocation.bookingId,
      performedByUserId: user.id,
      performedByRole: user.role,
      createdAt,
    };
    try {
      const { updatedAllocation, updatedItem } = await runTransaction(db, async (transaction) => {
        const allocationRef = doc(db, ALLOCATIONS_COLLECTION, allocationId);
        const allocationSnapshot = await transaction.get(allocationRef);
        if (!allocationSnapshot.exists()) throw createClientStateError('Allocation not found.');

        const liveAllocation = {
          ...allocation,
          ...(allocationSnapshot.data() as Partial<EventItemAllocation>),
          id: allocationId,
        };
        if (liveAllocation.status === 'returned') {
          throw createClientStateError('Allocation already returned.');
        }
        const normalizedAllocationQuantity = Number(liveAllocation.quantity);
        if (!Number.isFinite(normalizedAllocationQuantity) || normalizedAllocationQuantity <= 0) {
          throw createClientStateError('Allocation quantity is invalid.');
        }

        const itemRef = doc(db, ITEMS_COLLECTION, liveAllocation.itemId);
        const itemSnapshot = await transaction.get(itemRef);
        if (!itemSnapshot.exists()) throw createClientStateError('Item not found.');

        const liveItem = normalizeInventoryItemRecord(liveAllocation.itemId, itemSnapshot.data() as Partial<InventoryItem>, item);
        const updatedItem = { ...liveItem, currentQuantity: liveItem.currentQuantity + normalizedAllocationQuantity };
        const updatedAllocation: EventItemAllocation = {
          ...liveAllocation,
          quantity: normalizedAllocationQuantity,
          status: 'returned',
          returnedByUserId: user.id,
          returnedAt: createdAt,
        };

        transaction.set(itemRef, { ...updatedItem, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(allocationRef, { ...updatedAllocation, updatedAt: serverTimestamp() }, { merge: true });
        return { updatedAllocation, updatedItem };
      });

      setItems((prev) => prev.map((entry) => (entry.id === allocation.itemId ? updatedItem : entry)));
      setMovements((prev) => [movement, ...prev]);
      setAllocations((prev) => prev.map((entry) => (entry.id === allocationId ? updatedAllocation : entry)));
      return { ok: true, message: 'Items returned to store.' };
    } catch (error) {
      return {
        ok: false,
        message: getFirestoreWriteErrorMessage(error, {
          fallback: 'Unable to process the return right now.',
          permissionDenied: 'Backend rejected the stock return. Please sign in again and retry.',
          notFound: 'Allocation record was not found in backend. Refresh the page and retry.',
        }),
      };
    }
  }, [allocations, canManage, items, user]);

  const recordDamage = useCallback(async (itemId: string, quantity: number, reason: string, bookingId?: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper or Accountant can record damages.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };

    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Damage quantity must be greater than zero.' };
    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock to mark as damaged.' };
    if (!reason.trim()) return { ok: false, message: 'Damage reason is required.' };

    const createdAt = new Date().toISOString();
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'damaged',
      quantity: normalizedQuantity,
      reference: `DMG-${Date.now()}`,
      notes: reason.trim(),
      eventBookingId: bookingId,
      performedByUserId: user.id,
      performedByRole: user.role,
      createdAt,
    };
    const damage: DamagedItemRecord = {
      id: `DMG-${crypto.randomUUID()}`,
      itemId,
      quantity: normalizedQuantity,
      reason: reason.trim(),
      eventBookingId: bookingId || undefined,
      reportedByUserId: user.id,
      reportedAt: createdAt,
    };

    try {
      const { updatedItem } = await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        const snapshot = await transaction.get(itemRef);
        if (!snapshot.exists()) throw createClientStateError('Item not found.');

        const liveItem = normalizeInventoryItemRecord(itemId, snapshot.data() as Partial<InventoryItem>, item);
        if (liveItem.currentQuantity < normalizedQuantity) {
          throw createClientStateError('Insufficient stock to mark as damaged.');
        }

        const updatedItem = { ...liveItem, currentQuantity: Math.max(liveItem.currentQuantity - normalizedQuantity, 0) };
        transaction.set(itemRef, { ...updatedItem, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(doc(db, DAMAGES_COLLECTION, damage.id), { ...damage, updatedAt: serverTimestamp() }, { merge: true });
        return { updatedItem };
      });

      setItems((prev) => prev.map((entry) => (entry.id === itemId ? updatedItem : entry)));
      setMovements((prev) => [movement, ...prev]);
      setDamages((prev) => [damage, ...prev]);
      return { ok: true, message: 'Damaged item recorded.' };
    } catch (error) {
      return {
        ok: false,
        message: getFirestoreWriteErrorMessage(error, {
          fallback: 'Unable to record the damaged item right now.',
          permissionDenied: 'Backend rejected the damage record. Please sign in again and retry.',
          notFound: 'Inventory item was not found in backend. Refresh the page and retry.',
        }),
      };
    }
  }, [canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);

  const getReport = useCallback((): InventoryReport => {
    const totalUnits = items.reduce((sum, item) => sum + item.currentQuantity, 0);
    const lowStockItems = items.filter((item) => item.currentQuantity <= item.reorderLevel).length;
    const totalAllocatedOpen = allocations.filter((allocation) => allocation.status === 'allocated').reduce((sum, allocation) => sum + allocation.quantity, 0);
    return { totalItems: items.length, lowStockItems, totalUnits, totalAllocatedOpen };
  }, [allocations, items]);

  const value = useMemo<InventoryContextValue>(() => ({
    items,
    movements,
    damages,
    allocations,
    canManageInventory: canManage(),
    addItem,
    editItem,
    stockIn,
    stockOut,
    allocateToEvent,
    returnFromEvent,
    recordDamage,
    getReport,
  }), [addItem, allocations, allocateToEvent, canManage, damages, editItem, getReport, items, movements, recordDamage, returnFromEvent, stockIn, stockOut]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
