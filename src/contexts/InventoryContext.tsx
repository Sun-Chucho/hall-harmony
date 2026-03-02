import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const lastSyncedStateRef = useRef('');
  const pendingRemoteWriteRef = useRef(false);

  const serializeState = useCallback((nextState: {
    items: InventoryItem[];
    movements: InventoryMovement[];
    damages: DamagedItemRecord[];
    allocations: EventItemAllocation[];
  }) => JSON.stringify(nextState), []);

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
      lastSyncedStateRef.current = '';
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
        const nextState = {
          items: Array.isArray(data?.items) ? data.items : [],
          movements: Array.isArray(data?.movements) ? data.movements : [],
          damages: Array.isArray(data?.damages) ? data.damages : [],
          allocations: Array.isArray(data?.allocations) ? data.allocations : [],
        };
        const serialized = serializeState(nextState);
        if (serialized !== lastSyncedStateRef.current) {
          setItems(nextState.items);
          setMovements(nextState.movements);
          setDamages(nextState.damages);
          setAllocations(nextState.allocations);
          lastSyncedStateRef.current = serialized;
        }
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
    if (!pendingRemoteWriteRef.current) return;
    pendingRemoteWriteRef.current = false;
    const serialized = serializeState({
      items,
      movements,
      damages,
      allocations,
    });
    if (serialized === lastSyncedStateRef.current) return;
    lastSyncedStateRef.current = serialized;
    void setDoc(
      INVENTORY_STATE_REF,
      {
        items,
        movements,
        damages,
        allocations,
        writeToken: 'action_v1',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [allocations, damages, hydrated, items, movements, user]);

  const persistInventoryState = useCallback((overrides?: {
    items?: InventoryItem[];
    movements?: InventoryMovement[];
    damages?: DamagedItemRecord[];
    allocations?: EventItemAllocation[];
  }) => {
    const payload = {
      items: overrides?.items ?? items,
      movements: overrides?.movements ?? movements,
      damages: overrides?.damages ?? damages,
      allocations: overrides?.allocations ?? allocations,
    };
    pendingRemoteWriteRef.current = true;
    localStorage.setItem(INVENTORY_CACHE_KEY, JSON.stringify(payload));
  }, [allocations, damages, items, movements]);

  const canManage = useCallback(() => {
    if (!user) return false;
    return user.role === 'store_keeper' || user.role === 'controller';
  }, [user]);

  const canActWhenFrozen = useCallback(() => user?.role === 'controller', [user]);

  const addItem = useCallback((name: string, unit: string, openingQuantity: number, reorderLevel: number) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can manage inventory.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    if (!name.trim() || !unit.trim()) return { ok: false, message: 'Item name and unit are required.' };
    if (!Number.isFinite(openingQuantity) || openingQuantity < 0 || !Number.isFinite(reorderLevel) || reorderLevel < 0) {
      return { ok: false, message: 'Quantities cannot be negative.' };
    }
    const normalizedOpeningQuantity = Math.round(openingQuantity);
    const normalizedReorderLevel = Math.round(reorderLevel);

    const item: InventoryItem = {
      id: `ITEM-${crypto.randomUUID()}`,
      name: name.trim(),
      unit: unit.trim(),
      currentQuantity: normalizedOpeningQuantity,
      reorderLevel: normalizedReorderLevel,
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
    };
    const nextItems = [item, ...items];
    let nextMovements = movements;
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
      nextMovements = [movement, ...movements];
      setMovements(nextMovements);
    }
    setItems(nextItems);
    persistInventoryState({ items: nextItems, movements: nextMovements });
    return { ok: true, message: 'Inventory item created.' };
  }, [canActWhenFrozen, canManage, items, movements, persistInventoryState, policy.transactionsFrozen, user]);

  const stockIn = useCallback((itemId: string, quantity: number, reference: string, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can stock in.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    if (!items.some((item) => item.id === itemId)) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Stock in quantity must be greater than zero.' };
    const normalizedQuantity = Math.round(quantity);
    const movementReference = reference.trim() || generateReference('STKIN');

    const nextItems = items.map((item) =>
      item.id === itemId ? { ...item, currentQuantity: Math.max(item.currentQuantity + normalizedQuantity, 0) } : item,
    );
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
    const nextMovements = [movement, ...movements];
    setItems(nextItems);
    setMovements(nextMovements);
    persistInventoryState({ items: nextItems, movements: nextMovements });
    return { ok: true, message: 'Stock in recorded.' };
  }, [canActWhenFrozen, canManage, items, movements, persistInventoryState, policy.transactionsFrozen, user]);

  const stockOut = useCallback((itemId: string, quantity: number, reference: string, notes: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can stock out.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Stock out quantity must be greater than zero.' };
    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock quantity.' };
    const movementReference = reference.trim() || generateReference('STKOUT');

    const nextItems = items.map((entry) =>
      entry.id === itemId ? { ...entry, currentQuantity: Math.max(entry.currentQuantity - normalizedQuantity, 0) } : entry,
    );
    const movement: InventoryMovement = {
      id: `MOV-${crypto.randomUUID()}`,
      itemId,
      type: 'stock_out',
      quantity: normalizedQuantity,
      reference: movementReference,
      notes: notes.trim(),
      performedByUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    const nextMovements = [movement, ...movements];
    setItems(nextItems);
    setMovements(nextMovements);
    persistInventoryState({ items: nextItems, movements: nextMovements });
    return { ok: true, message: 'Stock out recorded.' };
  }, [canActWhenFrozen, canManage, items, movements, persistInventoryState, policy.transactionsFrozen, user]);

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
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Allocation quantity must be greater than zero.' };
    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock for allocation.' };

    const nextItems = items.map((entry) =>
      entry.id === itemId ? { ...entry, currentQuantity: Math.max(entry.currentQuantity - normalizedQuantity, 0) } : entry,
    );
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
    const nextMovements = [movement, ...movements];

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
    const nextAllocations = [allocation, ...allocations];
    setItems(nextItems);
    setMovements(nextMovements);
    setAllocations(nextAllocations);
    persistInventoryState({ items: nextItems, movements: nextMovements, allocations: nextAllocations });
    return { ok: true, message: 'Item allocated to event.' };
  }, [allocations, bookings, canActWhenFrozen, canManage, items, movements, persistInventoryState, policy.transactionsFrozen, user]);

  const returnFromEvent = useCallback((allocationId: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can process returns.' };
    const allocation = allocations.find((entry) => entry.id === allocationId);
    if (!allocation) return { ok: false, message: 'Allocation not found.' };
    if (allocation.status === 'returned') return { ok: false, message: 'Allocation already returned.' };

    const nextItems = items.map((entry) =>
      entry.id === allocation.itemId ? { ...entry, currentQuantity: Math.max(entry.currentQuantity + allocation.quantity, 0) } : entry,
    );
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
    const nextMovements = [movement, ...movements];
    const nextAllocations = allocations.map((entry) =>
      entry.id === allocationId
        ? {
            ...entry,
            status: 'returned' as const,
            returnedByUserId: user.id,
            returnedAt: new Date().toISOString(),
          }
        : entry,
    );
    setItems(nextItems);
    setMovements(nextMovements);
    setAllocations(nextAllocations);
    persistInventoryState({ items: nextItems, movements: nextMovements, allocations: nextAllocations });
    return { ok: true, message: 'Items returned to store.' };
  }, [allocations, canManage, items, movements, persistInventoryState, user]);

  const recordDamage = useCallback((itemId: string, quantity: number, reason: string, bookingId?: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!canManage()) return { ok: false, message: 'Only Store Keeper or Controller can record damages.' };
    if (policy.transactionsFrozen && !canActWhenFrozen()) {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: 'Damage quantity must be greater than zero.' };
    const normalizedQuantity = Math.round(quantity);
    if (item.currentQuantity < normalizedQuantity) return { ok: false, message: 'Insufficient stock to mark as damaged.' };
    if (!reason.trim()) return { ok: false, message: 'Damage reason is required.' };

    const nextItems = items.map((entry) =>
      entry.id === itemId ? { ...entry, currentQuantity: Math.max(entry.currentQuantity - normalizedQuantity, 0) } : entry,
    );
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
    const nextMovements = [movement, ...movements];

    const damage: DamagedItemRecord = {
      id: `DMG-${crypto.randomUUID()}`,
      itemId,
      quantity: normalizedQuantity,
      reason: reason.trim(),
      eventBookingId: bookingId || undefined,
      reportedByUserId: user.id,
      reportedAt: new Date().toISOString(),
    };
    const nextDamages = [damage, ...damages];
    setItems(nextItems);
    setMovements(nextMovements);
    setDamages(nextDamages);
    persistInventoryState({ items: nextItems, movements: nextMovements, damages: nextDamages });
    return { ok: true, message: 'Damaged item recorded.' };
  }, [canActWhenFrozen, canManage, damages, items, movements, persistInventoryState, policy.transactionsFrozen, user]);

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
