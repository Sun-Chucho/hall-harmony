import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { db } from '@/lib/firebase';
import {
  DamagedItemRecord,
  EventItemAllocation,
  InventoryItem,
  InventoryMovement,
} from '@/types/inventory';

interface InventoryReport {
  totalItems: number;
  lowStockItems: number;
  totalUnits: number;
  totalAllocatedOpen: number;
}

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
const INVENTORY_STATE_REF = doc(db, 'system_state', 'inventory');
const INVENTORY_CACHE_KEY = 'kuringe_inventory_cache_v1';

function generateReference(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { policy } = useAuthorization();
  const { bookings } = useBookings();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [damages, setDamages] = useState<DamagedItemRecord[]>([]);
  const [allocations, setAllocations] = useState<EventItemAllocation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(INVENTORY_CACHE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        items?: InventoryItem[];
        movements?: InventoryMovement[];
        damages?: DamagedItemRecord[];
        allocations?: EventItemAllocation[];
      };
      setItems(Array.isArray(data.items) ? data.items : []);
      setMovements(Array.isArray(data.movements) ? data.movements : []);
      setDamages(Array.isArray(data.damages) ? data.damages : []);
      setAllocations(Array.isArray(data.allocations) ? data.allocations : []);
    } catch {
      localStorage.removeItem(INVENTORY_CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      INVENTORY_CACHE_KEY,
      JSON.stringify({
        items,
        movements,
        damages,
        allocations,
      }),
    );
  }, [allocations, damages, items, movements]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setMovements([]);
      setDamages([]);
      setAllocations([]);
      setHydrated(false);
      return;
    }

    const unsub = onSnapshot(
      INVENTORY_STATE_REF,
      (snapshot) => {
        const data = snapshot.data() as {
          items?: InventoryItem[];
          movements?: InventoryMovement[];
          damages?: DamagedItemRecord[];
          allocations?: EventItemAllocation[];
        } | undefined;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setMovements(Array.isArray(data?.movements) ? data.movements : []);
        setDamages(Array.isArray(data?.damages) ? data.damages : []);
        setAllocations(Array.isArray(data?.allocations) ? data.allocations : []);
        setHydrated(true);
      },
      () => {
        const raw = localStorage.getItem(INVENTORY_CACHE_KEY);
        if (raw) {
          try {
            const data = JSON.parse(raw) as {
              items?: InventoryItem[];
              movements?: InventoryMovement[];
              damages?: DamagedItemRecord[];
              allocations?: EventItemAllocation[];
            };
            setItems(Array.isArray(data.items) ? data.items : []);
            setMovements(Array.isArray(data.movements) ? data.movements : []);
            setDamages(Array.isArray(data.damages) ? data.damages : []);
            setAllocations(Array.isArray(data.allocations) ? data.allocations : []);
          } catch {
            localStorage.removeItem(INVENTORY_CACHE_KEY);
          }
        }
        setHydrated(true);
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !hydrated) return;
    void setDoc(
      INVENTORY_STATE_REF,
      {
        items,
        movements,
        damages,
        allocations,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [allocations, damages, hydrated, items, movements, user]);

  const canManage = useCallback(() => {
    if (!user) return false;
    return user.role === 'store_keeper' || user.role === 'controller';
  }, [user]);

  const canActWhenFrozen = useCallback(() => user?.role === 'controller', [user]);

  const updateItemQuantity = useCallback((itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, currentQuantity: Math.max(item.currentQuantity + delta, 0) } : item,
      ),
    );
  }, []);

  const addMovement = useCallback((
    itemId: string,
    type: InventoryMovement['type'],
    quantity: number,
    reference: string,
    notes: string,
    eventBookingId?: string,
  ) => {
    if (!user) return;
    const movement: InventoryMovement = {
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId,
      type,
      quantity,
      reference: reference.trim(),
      notes: notes.trim(),
      eventBookingId,
      performedByUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    setMovements((prev) => [movement, ...prev]);
  }, [user]);

  const addItem = useCallback((name: string, unit: string, openingQuantity: number, reorderLevel: number) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can manage inventory.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    if (!name.trim() || !unit.trim()) return { ok: false, message: 'Item name and unit are required.' };
    if (openingQuantity < 0 || reorderLevel < 0) return { ok: false, message: 'Quantities cannot be negative.' };

    const item: InventoryItem = {
      id: `ITEM-${Date.now()}`,
      name: name.trim(),
      unit: unit.trim(),
      currentQuantity: openingQuantity,
      reorderLevel,
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
    };
    setItems((prev) => [item, ...prev]);
    if (openingQuantity > 0) {
      addMovement(item.id, 'stock_in', openingQuantity, 'OPENING', 'Opening stock balance');
    }
    return { ok: true, message: 'Inventory item created.' };
  }, [addMovement, canActWhenFrozen, canManage, policy.transactionsFrozen, user]);

  const stockIn = useCallback((itemId: string, quantity: number, reference: string, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can stock in.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    if (!items.some((item) => item.id === itemId)) return { ok: false, message: 'Item not found.' };
    if (quantity <= 0) return { ok: false, message: 'Stock in quantity must be greater than zero.' };
    const movementReference = reference.trim() || generateReference('STKIN');

    updateItemQuantity(itemId, quantity);
    addMovement(itemId, 'stock_in', quantity, movementReference, notes);
    return { ok: true, message: 'Stock in recorded.' };
  }, [addMovement, canActWhenFrozen, canManage, items, policy.transactionsFrozen, updateItemQuantity, user]);

  const stockOut = useCallback((itemId: string, quantity: number, reference: string, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can stock out.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (quantity <= 0) return { ok: false, message: 'Stock out quantity must be greater than zero.' };
    if (item.currentQuantity < quantity) return { ok: false, message: 'Insufficient stock quantity.' };
    const movementReference = reference.trim() || generateReference('STKOUT');

    updateItemQuantity(itemId, -quantity);
    addMovement(itemId, 'stock_out', quantity, movementReference, notes);
    return { ok: true, message: 'Stock out recorded.' };
  }, [addMovement, canActWhenFrozen, canManage, items, policy.transactionsFrozen, updateItemQuantity, user]);

  const allocateToEvent = useCallback((bookingId: string, itemId: string, quantity: number, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can allocate event items.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const booking = bookings.find((entry) => entry.id === bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (booking.bookingStatus !== 'approved') return { ok: false, message: 'Only approved bookings can receive stock allocation.' };
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (quantity <= 0) return { ok: false, message: 'Allocation quantity must be greater than zero.' };
    if (item.currentQuantity < quantity) return { ok: false, message: 'Insufficient stock for allocation.' };

    updateItemQuantity(itemId, -quantity);
    addMovement(itemId, 'allocation', quantity, `EVT-${bookingId}`, notes, bookingId);

    const allocation: EventItemAllocation = {
      id: `ALC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId,
      itemId,
      quantity,
      status: 'allocated',
      notes: notes.trim(),
      allocatedByUserId: user.id,
      allocatedAt: new Date().toISOString(),
    };
    setAllocations((prev) => [allocation, ...prev]);
    return { ok: true, message: 'Item allocated to event.' };
  }, [addMovement, bookings, canActWhenFrozen, canManage, items, policy.transactionsFrozen, updateItemQuantity, user]);

  const returnFromEvent = useCallback((allocationId: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can process returns.' };
    const allocation = allocations.find((entry) => entry.id === allocationId);
    if (!allocation) return { ok: false, message: 'Allocation not found.' };
    if (allocation.status === 'returned') return { ok: false, message: 'Allocation already returned.' };

    updateItemQuantity(allocation.itemId, allocation.quantity);
    addMovement(allocation.itemId, 'return', allocation.quantity, `RET-${allocation.bookingId}`, 'Event return', allocation.bookingId);
    setAllocations((prev) =>
      prev.map((entry) =>
        entry.id === allocationId
          ? {
              ...entry,
              status: 'returned',
              returnedByUserId: user.id,
              returnedAt: new Date().toISOString(),
            }
          : entry,
      ),
    );
    return { ok: true, message: 'Items returned to store.' };
  }, [addMovement, allocations, canManage, updateItemQuantity, user]);

  const recordDamage = useCallback((itemId: string, quantity: number, reason: string, bookingId?: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can record damages.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (quantity <= 0) return { ok: false, message: 'Damage quantity must be greater than zero.' };
    if (item.currentQuantity < quantity) return { ok: false, message: 'Insufficient stock to mark as damaged.' };
    if (!reason.trim()) return { ok: false, message: 'Damage reason is required.' };

    updateItemQuantity(itemId, -quantity);
    addMovement(itemId, 'damaged', quantity, `DMG-${Date.now()}`, reason, bookingId);

    const damage: DamagedItemRecord = {
      id: `DMG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId,
      quantity,
      reason: reason.trim(),
      eventBookingId: bookingId || undefined,
      reportedByUserId: user.id,
      reportedAt: new Date().toISOString(),
    };
    setDamages((prev) => [damage, ...prev]);
    return { ok: true, message: 'Damaged item recorded.' };
  }, [addMovement, canActWhenFrozen, canManage, items, policy.transactionsFrozen, updateItemQuantity, user]);

  const getReport = useCallback((): InventoryReport => {
    const totalUnits = items.reduce((sum, item) => sum + item.currentQuantity, 0);
    const lowStockItems = items.filter((item) => item.currentQuantity <= item.reorderLevel).length;
    const totalAllocatedOpen = allocations
      .filter((allocation) => allocation.status === 'allocated')
      .reduce((sum, allocation) => sum + allocation.quantity, 0);

    return {
      totalItems: items.length,
      lowStockItems,
      totalUnits,
      totalAllocatedOpen,
    };
  }, [allocations, items]);

  const value = useMemo<InventoryContextValue>(() => ({
    items,
    movements,
    damages,
    allocations,
    addItem,
    stockIn,
    stockOut,
    allocateToEvent,
    returnFromEvent,
    recordDamage,
    getReport,
  }), [
    addItem,
    allocations,
    allocateToEvent,
    damages,
    getReport,
    items,
    movements,
    recordDamage,
    returnFromEvent,
    stockIn,
    stockOut,
  ]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
