import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { db } from '@/lib/firebase';
import { DamagedItemRecord, EventItemAllocation, InventoryItem, InventoryMovement } from '@/types/inventory';

interface InventoryReport { totalItems: number; lowStockItems: number; totalUnits: number; totalAllocatedOpen: number; }
interface InventoryContextValue {
  items: InventoryItem[];
  movements: InventoryMovement[];
  damages: DamagedItemRecord[];
  allocations: EventItemAllocation[];
  addItem: (name: string, unit: string, openingQuantity: number, reorderLevel: number) => { ok: boolean; message: string };
  stockIn: (itemId: string, quantity: number, reference: string, notes: string) => { ok: boolean; message: string };
  stockOut: (itemId: string, quantity: number, reference: string, notes: string) => { ok: boolean; message: string };
  allocateToEvent: (bookingId: string, itemId: string, quantity: number, notes: string) => { ok: boolean; message: string };
  returnFromEvent: (allocationId: string) => { ok: boolean; message: string };
  recordDamage: (itemId: string, quantity: number, reason: string, bookingId?: string) => { ok: boolean; message: string };
  getReport: () => InventoryReport;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);
const ITEMS_COLLECTION = 'inventory_items';
const MOVEMENTS_COLLECTION = 'inventory_movements';
const DAMAGES_COLLECTION = 'inventory_damages';
const ALLOCATIONS_COLLECTION = 'inventory_allocations';

function generateReference(prefix: string) { return `${prefix}-${Date.now()}`; }

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
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<InventoryItem, 'id'>) }))
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

  const canManage = useCallback(() => !!user && (user.role === 'store_keeper' || user.role === 'accountant' || user.role === 'controller'), [user]);
  const canActWhenFrozen = useCallback(() => user?.role === 'accountant', [user]);
  const addItem = useCallback((name: string, unit: string, openingQuantity: number, reorderLevel: number) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper, Controller, or Accountant can manage inventory.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };
    if (!name.trim() || !unit.trim()) return { ok: false, message: 'Item name and unit are required.' };
    if (!Number.isFinite(openingQuantity) || openingQuantity < 0 || !Number.isFinite(reorderLevel) || reorderLevel < 0) return { ok: false, message: 'Quantities cannot be negative.' };

    const normalizedOpeningQuantity = Math.round(openingQuantity);
    const item: InventoryItem = {
      id: `ITEM-${crypto.randomUUID()}`,
      name: name.trim(),
      unit: unit.trim(),
      currentQuantity: normalizedOpeningQuantity,
      reorderLevel: Math.round(reorderLevel),
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
    };
    setItems((prev) => [item, ...prev]);
    void setDoc(doc(db, ITEMS_COLLECTION, item.id), { ...item, updatedAt: serverTimestamp() }, { merge: true });

    if (normalizedOpeningQuantity > 0) {
      const movement: InventoryMovement = {
        id: `MOV-${crypto.randomUUID()}`,
        itemId: item.id,
        type: 'stock_in',
        quantity: normalizedOpeningQuantity,
        reference: 'OPENING',
        notes: 'Opening stock balance',
        performedByUserId: user.id,
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [movement, ...prev]);
      void setDoc(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
    }
    return { ok: true, message: 'Inventory item created.' };
  }, [canActWhenFrozen, canManage, policy.transactionsFrozen, user]);

  const stockIn = useCallback((itemId: string, quantity: number, reference: string, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper, Controller, or Accountant can stock in.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };
    if (!items.some((item) => item.id === itemId)) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Stock in quantity must be greater than zero.' };

    const normalizedQuantity = Math.round(quantity);
    const movementReference = reference.trim() || generateReference('STKIN');
    const nextItem = items.find((item) => item.id === itemId)!;
    const updatedItem = { ...nextItem, currentQuantity: Math.max(nextItem.currentQuantity + normalizedQuantity, 0) };
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'stock_in',
      quantity: normalizedQuantity,
      reference: movementReference,
      notes: notes.trim(),
      performedByUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));
    setMovements((prev) => [movement, ...prev]);
    void updateDoc(doc(db, ITEMS_COLLECTION, itemId), { currentQuantity: updatedItem.currentQuantity, updatedAt: serverTimestamp() });
    void setDoc(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true, message: 'Stock in recorded.' };
  }, [canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);

  const stockOut = useCallback((itemId: string, quantity: number, reference: string, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper, Controller, or Accountant can stock out.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Stock out quantity must be greater than zero.' };
    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock quantity.' };

    const updatedItem = { ...item, currentQuantity: Math.max(item.currentQuantity - normalizedQuantity, 0) };
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'stock_out',
      quantity: normalizedQuantity,
      reference: reference.trim() || generateReference('STKOUT'),
      notes: notes.trim(),
      performedByUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => prev.map((entry) => (entry.id === itemId ? updatedItem : entry)));
    setMovements((prev) => [movement, ...prev]);
    void updateDoc(doc(db, ITEMS_COLLECTION, itemId), { currentQuantity: updatedItem.currentQuantity, updatedAt: serverTimestamp() });
    void setDoc(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true, message: 'Stock out recorded.' };
  }, [canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);

  const allocateToEvent = useCallback((bookingId: string, itemId: string, quantity: number, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper, Controller, or Accountant can allocate event items.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };
    const booking = bookings.find((entry) => entry.id === bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (booking.bookingStatus !== 'approved') return { ok: false, message: 'Only approved bookings can receive stock allocation.' };
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Allocation quantity must be greater than zero.' };
    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock for allocation.' };

    const updatedItem = { ...item, currentQuantity: Math.max(item.currentQuantity - normalizedQuantity, 0) };
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'allocation',
      quantity: normalizedQuantity,
      reference: `EVT-${bookingId}`,
      notes: notes.trim(),
      eventBookingId: bookingId,
      performedByUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    const allocation: EventItemAllocation = {
      id: `ALC-${crypto.randomUUID()}`,
      bookingId,
      itemId,
      quantity: normalizedQuantity,
      status: 'allocated',
      notes: notes.trim(),
      allocatedByUserId: user.id,
      allocatedAt: new Date().toISOString(),
    };
    setItems((prev) => prev.map((entry) => (entry.id === itemId ? updatedItem : entry)));
    setMovements((prev) => [movement, ...prev]);
    setAllocations((prev) => [allocation, ...prev]);
    void updateDoc(doc(db, ITEMS_COLLECTION, itemId), { currentQuantity: updatedItem.currentQuantity, updatedAt: serverTimestamp() });
    void setDoc(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
    void setDoc(doc(db, ALLOCATIONS_COLLECTION, allocation.id), { ...allocation, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true, message: 'Item allocated to event.' };
  }, [bookings, canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);
  const returnFromEvent = useCallback((allocationId: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper, Controller, or Accountant can process returns.' };
    const allocation = allocations.find((entry) => entry.id === allocationId);
    if (!allocation) return { ok: false, message: 'Allocation not found.' };
    if (allocation.status === 'returned') return { ok: false, message: 'Allocation already returned.' };

    const item = items.find((entry) => entry.id === allocation.itemId);
    if (!item) return { ok: false, message: 'Item not found.' };

    const updatedItem = { ...item, currentQuantity: Math.max(item.currentQuantity + allocation.quantity, 0) };
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId: allocation.itemId,
      type: 'return',
      quantity: allocation.quantity,
      reference: `RET-${allocation.bookingId}`,
      notes: 'Event return',
      eventBookingId: allocation.bookingId,
      performedByUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    const updatedAllocation: EventItemAllocation = {
      ...allocation,
      status: 'returned',
      returnedByUserId: user.id,
      returnedAt: new Date().toISOString(),
    };
    setItems((prev) => prev.map((entry) => (entry.id === allocation.itemId ? updatedItem : entry)));
    setMovements((prev) => [movement, ...prev]);
    setAllocations((prev) => prev.map((entry) => (entry.id === allocationId ? updatedAllocation : entry)));
    void updateDoc(doc(db, ITEMS_COLLECTION, allocation.itemId), { currentQuantity: updatedItem.currentQuantity, updatedAt: serverTimestamp() });
    void setDoc(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
    void setDoc(doc(db, ALLOCATIONS_COLLECTION, allocationId), { ...updatedAllocation, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true, message: 'Items returned to store.' };
  }, [allocations, canManage, items, user]);

  const recordDamage = useCallback((itemId: string, quantity: number, reason: string, bookingId?: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Storekeeper, Controller, or Accountant can record damages.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) return { ok: false, message: 'Transactions are frozen by accountant.' };
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Damage quantity must be greater than zero.' };
    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock to mark as damaged.' };
    if (!reason.trim()) return { ok: false, message: 'Damage reason is required.' };

    const updatedItem = { ...item, currentQuantity: Math.max(item.currentQuantity - normalizedQuantity, 0) };
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'damaged',
      quantity: normalizedQuantity,
      reference: `DMG-${Date.now()}`,
      notes: reason.trim(),
      eventBookingId: bookingId,
      performedByUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    const damage: DamagedItemRecord = {
      id: `DMG-${crypto.randomUUID()}`,
      itemId,
      quantity: normalizedQuantity,
      reason: reason.trim(),
      eventBookingId: bookingId || undefined,
      reportedByUserId: user.id,
      reportedAt: new Date().toISOString(),
    };
    setItems((prev) => prev.map((entry) => (entry.id === itemId ? updatedItem : entry)));
    setMovements((prev) => [movement, ...prev]);
    setDamages((prev) => [damage, ...prev]);
    void updateDoc(doc(db, ITEMS_COLLECTION, itemId), { currentQuantity: updatedItem.currentQuantity, updatedAt: serverTimestamp() });
    void setDoc(doc(db, MOVEMENTS_COLLECTION, movement.id), { ...movement, updatedAt: serverTimestamp() }, { merge: true });
    void setDoc(doc(db, DAMAGES_COLLECTION, damage.id), { ...damage, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true, message: 'Damaged item recorded.' };
  }, [canActWhenFrozen, canManage, items, policy.transactionsFrozen, user]);

  const getReport = useCallback((): InventoryReport => {
    const totalUnits = items.reduce((sum, item) => sum + item.currentQuantity, 0);
    const lowStockItems = items.filter((item) => item.currentQuantity <= item.reorderLevel).length;
    const totalAllocatedOpen = allocations.filter((allocation) => allocation.status === 'allocated').reduce((sum, allocation) => sum + allocation.quantity, 0);
    return { totalItems: items.length, lowStockItems, totalUnits, totalAllocatedOpen };
  }, [allocations, items]);

  const value = useMemo<InventoryContextValue>(() => ({
    items, movements, damages, allocations, addItem, stockIn, stockOut, allocateToEvent, returnFromEvent, recordDamage, getReport,
  }), [addItem, allocations, allocateToEvent, damages, getReport, items, movements, recordDamage, returnFromEvent, stockIn, stockOut]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
