import { useMemo, useRef, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useToast } from '@/hooks/use-toast';

interface EventPlanItemDraft {
  itemId: string;
  quantity: number;
}

export default function Rentals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { bookings } = useBookings();
  const {
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
  } = useInventory();

  const [message, setMessage] = useState('');
  const [itemForm, setItemForm] = useState({
    name: '',
    unit: '',
    openingQuantity: 0,
    reorderLevel: 0,
  });
  const [stockInForm, setStockInForm] = useState({
    itemId: '',
    quantity: 0,
    reference: '',
    notes: '',
  });
  const [stockOutForm, setStockOutForm] = useState({
    itemId: '',
    quantity: 0,
    reference: '',
    notes: '',
  });
  const [damageForm, setDamageForm] = useState({
    itemId: '',
    quantity: 0,
    reason: '',
    bookingId: '',
  });
  const [allocationForm, setAllocationForm] = useState({
    bookingId: '',
    itemId: '',
    quantity: 0,
    notes: '',
  });
  const [plannerForm, setPlannerForm] = useState({
    bookingId: '',
    itemId: '',
    quantity: 1,
    notes: '',
    eventNotes: '',
  });
  const [plannerItems, setPlannerItems] = useState<EventPlanItemDraft[]>([]);
  const [isCreatingEventPlan, setIsCreatingEventPlan] = useState(false);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const lastInventoryActionAtRef = useRef(0);

  const report = getReport();
  const approvedEvents = useMemo(
    () => bookings.filter((booking) => booking.bookingStatus === 'approved'),
    [bookings],
  );
  const lowStock = items.filter((item) => item.currentQuantity <= item.reorderLevel);
  const openAllocations = allocations.filter((allocation) => allocation.status === 'allocated');
  const stockInMovements = movements.filter((movement) => movement.type === 'stock_in');
  const stockOutMovements = movements.filter((movement) => movement.type === 'stock_out');
  const canManage = user?.role === 'store_keeper' || user?.role === 'accountant';

  const runInventoryAction = async (
    action: () => Promise<{ ok: boolean; message: string }>,
    successTitle: string,
    failureTitle: string,
    onSuccess?: () => void,
  ) => {
    if (isSavingAction) return;
    const now = Date.now();
    if (now - lastInventoryActionAtRef.current < 900) return;
    setIsSavingAction(true);
    try {
      const result = await action();
      setMessage(result.message);
      toast({
        title: result.ok ? successTitle : failureTitle,
        description: result.message,
        variant: result.ok ? 'default' : 'destructive',
      });
      if (result.ok) onSuccess?.();
    } finally {
      lastInventoryActionAtRef.current = now;
      window.setTimeout(() => setIsSavingAction(false), 700);
    }
  };

  const handleAddItem = () => {
    if (!itemForm.name.trim() || !itemForm.unit.trim()) {
      setMessage('Item name and unit are required.');
      toast({ title: 'Missing fields', description: 'Item name and unit are required.', variant: 'destructive' });
      return;
    }
    void runInventoryAction(
      () => addItem(itemForm.name, itemForm.unit, itemForm.openingQuantity, itemForm.reorderLevel),
      'Inventory item saved',
      'Save failed',
      () => setItemForm({ name: '', unit: '', openingQuantity: 0, reorderLevel: 0 }),
    );
  };

  const handleStockIn = () => {
    if (!stockInForm.itemId || stockInForm.quantity <= 0) {
      setMessage('Select item and enter stock in quantity.');
      toast({ title: 'Incomplete stock in', description: 'Select item and enter stock in quantity.', variant: 'destructive' });
      return;
    }
    void runInventoryAction(
      () => stockIn(stockInForm.itemId, stockInForm.quantity, stockInForm.reference, stockInForm.notes),
      'Stock in saved',
      'Stock in failed',
      () => setStockInForm({ itemId: '', quantity: 0, reference: '', notes: '' }),
    );
  };

  const handleStockOut = () => {
    if (!stockOutForm.itemId || stockOutForm.quantity <= 0) {
      setMessage('Select item and enter stock out quantity.');
      toast({ title: 'Incomplete stock out', description: 'Select item and enter stock out quantity.', variant: 'destructive' });
      return;
    }
    void runInventoryAction(
      () => stockOut(stockOutForm.itemId, stockOutForm.quantity, stockOutForm.reference, stockOutForm.notes),
      'Stock out saved',
      'Stock out failed',
      () => setStockOutForm({ itemId: '', quantity: 0, reference: '', notes: '' }),
    );
  };

  const handleRecordDamage = () => {
    if (!damageForm.itemId || damageForm.quantity <= 0 || !damageForm.reason.trim()) {
      setMessage('Select item, quantity, and reason for damage.');
      toast({ title: 'Incomplete damage form', description: 'Select item, quantity, and reason for damage.', variant: 'destructive' });
      return;
    }
    void runInventoryAction(
      () => recordDamage(damageForm.itemId, damageForm.quantity, damageForm.reason, damageForm.bookingId || undefined),
      'Damage saved',
      'Damage save failed',
      () => setDamageForm({ itemId: '', quantity: 0, reason: '', bookingId: '' }),
    );
  };

  const handleAllocateItem = () => {
    if (!allocationForm.bookingId || !allocationForm.itemId || allocationForm.quantity <= 0) {
      setMessage('Select event, item, and quantity before allocation.');
      toast({ title: 'Incomplete allocation form', description: 'Select event, item, and quantity before allocation.', variant: 'destructive' });
      return;
    }
    void runInventoryAction(
      () => allocateToEvent(allocationForm.bookingId, allocationForm.itemId, allocationForm.quantity, allocationForm.notes),
      'Allocation saved',
      'Allocation failed',
      () => setAllocationForm({ bookingId: '', itemId: '', quantity: 0, notes: '' }),
    );
  };

  const plannerResolvedItems = plannerItems.map((entry) => {
    const item = items.find((stockItem) => stockItem.id === entry.itemId);
    return {
      ...entry,
      item,
    };
  });

  const plannerTotalUnits = plannerItems.reduce((sum, entry) => sum + entry.quantity, 0);

  const handleAddPlannerItem = () => {
    if (!plannerForm.itemId || plannerForm.quantity <= 0) {
      setMessage('Select a store item and quantity before adding it to the event plan.');
      toast({ title: 'Incomplete event plan item', description: 'Select a store item and quantity before adding it to the event plan.', variant: 'destructive' });
      return;
    }

    setPlannerItems((prev) => {
      const existing = prev.find((entry) => entry.itemId === plannerForm.itemId);
      if (existing) {
        return prev.map((entry) => (
          entry.itemId === plannerForm.itemId
            ? { ...entry, quantity: entry.quantity + Math.round(plannerForm.quantity) }
            : entry
        ));
      }
      return [...prev, { itemId: plannerForm.itemId, quantity: Math.round(plannerForm.quantity) }];
    });
    setPlannerForm((prev) => ({ ...prev, itemId: '', quantity: 1, notes: '' }));
  };

  const handleSaveEventPlan = async () => {
    if (!plannerForm.bookingId) {
      setMessage('Select an approved event before saving the event plan.');
      toast({ title: 'Missing event', description: 'Select an approved event before saving the event plan.', variant: 'destructive' });
      return;
    }
    if (plannerItems.length === 0) {
      setMessage('Add at least one store item to the event plan.');
      toast({ title: 'No planned items', description: 'Add at least one store item to the event plan.', variant: 'destructive' });
      return;
    }
    if (isSavingAction) return;

    const stockIssue = plannerResolvedItems.find((entry) => !entry.item || entry.item.currentQuantity < entry.quantity);
    if (stockIssue) {
      const name = stockIssue.item?.name ?? 'Selected item';
      const description = `${name} does not have enough stock for this event plan.`;
      setMessage(description);
      toast({ title: 'Insufficient stock', description, variant: 'destructive' });
      return;
    }

    setIsSavingAction(true);
    setIsCreatingEventPlan(true);
    let hasFailure = false;

    for (const entry of plannerItems) {
      const item = items.find((stockItem) => stockItem.id === entry.itemId);
      const result = await allocateToEvent(
        plannerForm.bookingId,
        entry.itemId,
        entry.quantity,
        [plannerForm.eventNotes.trim(), plannerForm.notes.trim(), item?.name ? `Planned: ${item.name}` : '']
          .filter(Boolean)
          .join(' | '),
      );
      if (!result.ok) {
        hasFailure = true;
        setMessage(result.message);
        toast({ title: 'Event plan save failed', description: result.message, variant: 'destructive' });
        break;
      }
    }

    if (!hasFailure) {
      const successMessage = 'Event plan saved and items allocated from store.';
      setMessage(successMessage);
      toast({ title: 'Event plan saved', description: successMessage });
      setPlannerItems([]);
      setPlannerForm({ bookingId: '', itemId: '', quantity: 1, notes: '', eventNotes: '' });
      lastInventoryActionAtRef.current = Date.now();
    }

    window.setTimeout(() => {
      setIsSavingAction(false);
      setIsCreatingEventPlan(false);
    }, 700);
  };

  const handleReturnAllocation = (allocationId: string) => {
    void runInventoryAction(
      () => returnFromEvent(allocationId),
      'Return saved',
      'Return failed',
    );
  };

  const stats = [
    { title: 'Stock Items', value: `${report.totalItems}`, description: 'registered inventory records' },
    { title: 'Total Units', value: `${report.totalUnits}`, description: 'available in store' },
    { title: 'Low Stock Alerts', value: `${report.lowStockItems}`, description: 'at or below reorder level' },
    { title: 'Allocated Units', value: `${report.totalAllocatedOpen}`, description: 'currently issued to events' },
  ];

  const sections = [
    {
      title: 'Inventory Operations',
      bullets: [
        'Stock In and Stock Out register every movement with reference and notes.',
        'Damaged items are tracked separately with reason and optional event link.',
        'Event item allocation supports issue and return workflow per approved event.',
      ],
    },
  ];

  if (user?.role === 'assistant_hall_manager') {
    return (
      <ManagementPageTemplate
        pageTitle="Inventory"
        subtitle="Read-only inventory overview."
        stats={stats}
        sections={[
          {
            title: 'Assistant Inventory Access',
            bullets: [
              'You can view stock and movement summary only.',
              'Editing, stock adjustments, and allocations are restricted.',
            ],
          },
        ]}
        action={
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Inventory Overview</p>
                <Badge className="bg-slate-100 text-slate-700">{items.length} items</Badge>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="px-2 py-2">Item</th>
                      <th className="px-2 py-2">Unit</th>
                      <th className="px-2 py-2">Current Qty</th>
                      <th className="px-2 py-2">Reorder Level</th>
                      <th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-slate-900">{item.name}</td>
                        <td className="px-2 py-2 text-slate-700">{item.unit}</td>
                        <td className="px-2 py-2 text-slate-700">{item.currentQuantity}</td>
                        <td className="px-2 py-2 text-slate-700">{item.reorderLevel}</td>
                        <td className="px-2 py-2">
                          {item.currentQuantity <= item.reorderLevel ? (
                            <Badge className="bg-amber-100 text-amber-800">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recent Inventory Movements</p>
              {movements.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No movement records yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-2 py-2">Date</th>
                        <th className="px-2 py-2">Type</th>
                        <th className="px-2 py-2">Item</th>
                        <th className="px-2 py-2">Quantity</th>
                        <th className="px-2 py-2">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.slice(0, 15).map((entry) => {
                        const item = items.find((x) => x.id === entry.itemId);
                        return (
                          <tr key={entry.id} className="border-b border-slate-100">
                            <td className="px-2 py-2 text-slate-700">{new Date(entry.createdAt).toLocaleString()}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.type}</td>
                            <td className="px-2 py-2 text-slate-900">{item?.name ?? 'Unknown item'}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.quantity}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.reference}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        }
      />
    );
  }

  if (user?.role === 'manager' || user?.role === 'accountant') {
    return (
      <ManagementPageTemplate
        pageTitle="Inventory"
        subtitle="Halls Manager & Accountant inventory oversight (view-only)."
        stats={stats}
        sections={[
          {
            title: 'Inventory Oversight',
            bullets: [
              'View stock table, stock in/out history, and damaged items.',
              'No inventory edits are allowed for your role.',
            ],
          },
        ]}
        action={
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Inventory Table</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="px-2 py-2">Item</th>
                      <th className="px-2 py-2">Unit</th>
                      <th className="px-2 py-2">Current Qty</th>
                      <th className="px-2 py-2">Reorder Level</th>
                      <th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-slate-900">{item.name}</td>
                        <td className="px-2 py-2 text-slate-700">{item.unit}</td>
                        <td className="px-2 py-2 text-slate-700">{item.currentQuantity}</td>
                        <td className="px-2 py-2 text-slate-700">{item.reorderLevel}</td>
                        <td className="px-2 py-2">
                          {item.currentQuantity <= item.reorderLevel ? (
                            <Badge className="bg-amber-100 text-amber-800">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Stock In / Stock Out History</p>
              {movements.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No movement records yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-2 py-2">Date</th>
                        <th className="px-2 py-2">Type</th>
                        <th className="px-2 py-2">Item</th>
                        <th className="px-2 py-2">Quantity</th>
                        <th className="px-2 py-2">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.slice(0, 20).map((entry) => {
                        const item = items.find((x) => x.id === entry.itemId);
                        return (
                          <tr key={entry.id} className="border-b border-slate-100">
                            <td className="px-2 py-2 text-slate-700">{new Date(entry.createdAt).toLocaleString()}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.type}</td>
                            <td className="px-2 py-2 text-slate-900">{item?.name ?? 'Unknown item'}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.quantity}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.reference}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Damaged Items</p>
              {damages.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No damaged records yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-2 py-2">Date</th>
                        <th className="px-2 py-2">Item</th>
                        <th className="px-2 py-2">Quantity</th>
                        <th className="px-2 py-2">Reason</th>
                        <th className="px-2 py-2">Event Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {damages.slice(0, 20).map((entry) => {
                        const item = items.find((x) => x.id === entry.itemId);
                        return (
                          <tr key={entry.id} className="border-b border-slate-100">
                            <td className="px-2 py-2 text-slate-700">{new Date(entry.reportedAt).toLocaleString()}</td>
                            <td className="px-2 py-2 text-slate-900">{item?.name ?? 'Unknown item'}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.quantity}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.reason}</td>
                            <td className="px-2 py-2 text-slate-700">{entry.eventBookingId ?? '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        }
      />
    );
  }

  if (user?.role === 'purchaser') {
    return (
      <ManagementPageTemplate
        pageTitle="Inventory"
        subtitle="Purchaser view-only inventory with low stock alerts."
        stats={stats}
        sections={[
          {
            title: 'Purchaser Inventory Visibility',
            bullets: [
              'View current stock levels and low stock alerts.',
              'No stock editing actions are available in purchaser view.',
            ],
          },
        ]}
        action={
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Low Stock Alerts</p>
              <div className="mt-3 space-y-2">
                {lowStock.length === 0 ? (
                  <p className="text-sm text-slate-600">No low stock alerts.</p>
                ) : (
                  lowStock.map((item) => (
                    <div key={item.id} className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                      {item.name}: {item.currentQuantity} {item.unit} (reorder at {item.reorderLevel})
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Inventory Overview</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="px-2 py-2">Item</th>
                      <th className="px-2 py-2">Unit</th>
                      <th className="px-2 py-2">Current Qty</th>
                      <th className="px-2 py-2">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-slate-900">{item.name}</td>
                        <td className="px-2 py-2 text-slate-700">{item.unit}</td>
                        <td className="px-2 py-2 text-slate-700">{item.currentQuantity}</td>
                        <td className="px-2 py-2 text-slate-700">{item.reorderLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      />
    );
  }

  if (user?.role === 'store_keeper') {
    return (
      <ManagementPageTemplate
        pageTitle="Inventory & Store"
        subtitle={user.role === 'store_keeper' ? 'Storekeeper workspace for stock control and event planning.' : 'Stock in, stock out, and damaged item control.'}
        stats={stats}
        sections={[
          {
            title: 'Inventory Operations',
            bullets: [
              'Stock In and Stock Out register every movement with reference and notes.',
              'Damaged items are tracked with reason and optional event link.',
              'Event Planner lets store teams save event supply plans directly from current stock.',
            ],
          },
        ]}
        action={
          <div className="space-y-6">
            {message ? (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>
            ) : null}

            <Tabs defaultValue="stock-in" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="stock-in">Stock In</TabsTrigger>
                <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
                <TabsTrigger value="damaged">Damaged Items</TabsTrigger>
              </TabsList>

              <TabsContent value="stock-in">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Create Inventory Item</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <input
                        type="text"
                        placeholder="Item name"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={itemForm.name}
                        onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Unit (pcs, crates, boxes)"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={itemForm.unit}
                        onChange={(event) => setItemForm((prev) => ({ ...prev, unit: event.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Opening quantity"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={itemForm.openingQuantity || ''}
                        onChange={(event) => setItemForm((prev) => ({ ...prev, openingQuantity: Number(event.target.value) }))}
                      />
                      <input
                        type="number"
                        placeholder="Reorder level"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={itemForm.reorderLevel || ''}
                        onChange={(event) => setItemForm((prev) => ({ ...prev, reorderLevel: Number(event.target.value) }))}
                      />
                    </div>
                    <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={!canManage || isSavingAction}
                      onClick={handleAddItem}
                    >
                      {isSavingAction ? 'Saving...' : 'Add Item'}
                    </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Stock In Entry</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <select
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={stockInForm.itemId}
                        onChange={(event) => setStockInForm((prev) => ({ ...prev, itemId: event.target.value }))}
                      >
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.currentQuantity} {item.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Quantity"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={stockInForm.quantity || ''}
                        onChange={(event) => setStockInForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                      />
                      <input
                        type="text"
                        placeholder="Reference"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={stockInForm.reference}
                        onChange={(event) => setStockInForm((prev) => ({ ...prev, reference: event.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Notes"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={stockInForm.notes}
                        onChange={(event) => setStockInForm((prev) => ({ ...prev, notes: event.target.value }))}
                      />
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        disabled={!canManage || isSavingAction}
                        onClick={handleStockIn}
                      >
                        {isSavingAction ? 'Saving...' : 'Record Stock In'}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Stock In Records</p>
                    {stockInMovements.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-600">No stock in records yet.</p>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                            <tr className="border-b border-slate-200">
                              <th className="px-2 py-2">Date</th>
                              <th className="px-2 py-2">Item</th>
                              <th className="px-2 py-2">Quantity</th>
                              <th className="px-2 py-2">Reference</th>
                              <th className="px-2 py-2">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockInMovements.slice(0, 30).map((entry) => {
                              const item = items.find((x) => x.id === entry.itemId);
                              return (
                                <tr key={entry.id} className="border-b border-slate-100">
                                  <td className="px-2 py-2 text-slate-700">{new Date(entry.createdAt).toLocaleString()}</td>
                                  <td className="px-2 py-2 text-slate-900">{item?.name ?? 'Unknown item'}</td>
                                  <td className="px-2 py-2 text-slate-700">{entry.quantity}</td>
                                  <td className="px-2 py-2 text-slate-700">{entry.reference}</td>
                                  <td className="px-2 py-2 text-slate-700">{entry.notes || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stock-out">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Stock Out Entry</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <select
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={stockOutForm.itemId}
                        onChange={(event) => setStockOutForm((prev) => ({ ...prev, itemId: event.target.value }))}
                      >
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.currentQuantity} {item.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Quantity"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={stockOutForm.quantity || ''}
                        onChange={(event) => setStockOutForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                      />
                      <input
                        type="text"
                        placeholder="Reference"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={stockOutForm.reference}
                        onChange={(event) => setStockOutForm((prev) => ({ ...prev, reference: event.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Notes"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={stockOutForm.notes}
                        onChange={(event) => setStockOutForm((prev) => ({ ...prev, notes: event.target.value }))}
                      />
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        disabled={!canManage || isSavingAction}
                        onClick={handleStockOut}
                      >
                        {isSavingAction ? 'Saving...' : 'Record Stock Out'}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Stock Out Records</p>
                    {stockOutMovements.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-600">No stock out records yet.</p>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                            <tr className="border-b border-slate-200">
                              <th className="px-2 py-2">Date</th>
                              <th className="px-2 py-2">Item</th>
                              <th className="px-2 py-2">Quantity</th>
                              <th className="px-2 py-2">Reference</th>
                              <th className="px-2 py-2">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockOutMovements.slice(0, 30).map((entry) => {
                              const item = items.find((x) => x.id === entry.itemId);
                              return (
                                <tr key={entry.id} className="border-b border-slate-100">
                                  <td className="px-2 py-2 text-slate-700">{new Date(entry.createdAt).toLocaleString()}</td>
                                  <td className="px-2 py-2 text-slate-900">{item?.name ?? 'Unknown item'}</td>
                                  <td className="px-2 py-2 text-slate-700">{entry.quantity}</td>
                                  <td className="px-2 py-2 text-slate-700">{entry.reference}</td>
                                  <td className="px-2 py-2 text-slate-700">{entry.notes || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="damaged">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Damaged Item Register</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={damageForm.itemId}
                      onChange={(event) => setDamageForm((prev) => ({ ...prev, itemId: event.target.value }))}
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={damageForm.quantity || ''}
                      onChange={(event) => setDamageForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                    />
                    <input
                      type="text"
                      placeholder="Reason"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={damageForm.reason}
                      onChange={(event) => setDamageForm((prev) => ({ ...prev, reason: event.target.value }))}
                    />
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={damageForm.bookingId}
                      onChange={(event) => setDamageForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                    >
                      <option value="">Event (optional)</option>
                      {approvedEvents.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.id} | {booking.eventName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={!canManage || isSavingAction}
                      onClick={handleRecordDamage}
                    >
                      {isSavingAction ? 'Saving...' : 'Record Damage'}
                    </Button>
                  </div>

                  {damages.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-600">No damaged records yet.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                          <tr className="border-b border-slate-200">
                            <th className="px-2 py-2">Date</th>
                            <th className="px-2 py-2">Item</th>
                            <th className="px-2 py-2">Quantity</th>
                            <th className="px-2 py-2">Reason</th>
                            <th className="px-2 py-2">Event Ref</th>
                          </tr>
                        </thead>
                        <tbody>
                          {damages.slice(0, 30).map((entry) => {
                            const item = items.find((x) => x.id === entry.itemId);
                            return (
                              <tr key={entry.id} className="border-b border-slate-100">
                                <td className="px-2 py-2 text-slate-700">{new Date(entry.reportedAt).toLocaleString()}</td>
                                <td className="px-2 py-2 text-slate-900">{item?.name ?? 'Unknown item'}</td>
                                <td className="px-2 py-2 text-slate-700">{entry.quantity}</td>
                                <td className="px-2 py-2 text-slate-700">{entry.reason}</td>
                                <td className="px-2 py-2 text-slate-700">{entry.eventBookingId ?? '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        }
      />
    );
  }

  if (!canManage) return null;

  return (
    <ManagementPageTemplate
      pageTitle="Stock"
      subtitle="Storekeeper workspace for stock control, item allocation, and inventory reporting."
      stats={stats}
      sections={sections}
      action={
        <div className="space-y-6">
          {message ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>
          ) : null}

          <Tabs defaultValue="stock-in" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="stock-in">Stock In</TabsTrigger>
              <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
              <TabsTrigger value="damaged">Damaged Items</TabsTrigger>
              <TabsTrigger value="event-planner">Event Planner</TabsTrigger>
              <TabsTrigger value="reports">Inventory Reports</TabsTrigger>
              <TabsTrigger value="allocation">Event Item Allocation</TabsTrigger>
            </TabsList>

            <TabsContent value="stock-in">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Create Inventory Item</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <input
                      type="text"
                      placeholder="Item name"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={itemForm.name}
                      onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                    <input
                      type="text"
                      placeholder="Unit (pcs, crates, boxes)"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={itemForm.unit}
                      onChange={(event) => setItemForm((prev) => ({ ...prev, unit: event.target.value }))}
                    />
                    <input
                      type="number"
                      placeholder="Opening quantity"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={itemForm.openingQuantity || ''}
                      onChange={(event) => setItemForm((prev) => ({ ...prev, openingQuantity: Number(event.target.value) }))}
                    />
                    <input
                      type="number"
                      placeholder="Reorder level"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={itemForm.reorderLevel || ''}
                      onChange={(event) => setItemForm((prev) => ({ ...prev, reorderLevel: Number(event.target.value) }))}
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={!canManage || isSavingAction}
                      onClick={handleAddItem}
                    >
                      {isSavingAction ? 'Saving...' : 'Add Item'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Stock In Entry</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={stockInForm.itemId}
                      onChange={(event) => setStockInForm((prev) => ({ ...prev, itemId: event.target.value }))}
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.currentQuantity} {item.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={stockInForm.quantity || ''}
                      onChange={(event) => setStockInForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                    />
                    <input
                      type="text"
                      placeholder="Reference"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={stockInForm.reference}
                      onChange={(event) => setStockInForm((prev) => ({ ...prev, reference: event.target.value }))}
                    />
                    <input
                      type="text"
                      placeholder="Notes"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={stockInForm.notes}
                      onChange={(event) => setStockInForm((prev) => ({ ...prev, notes: event.target.value }))}
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={!canManage || isSavingAction}
                      onClick={handleStockIn}
                    >
                      {isSavingAction ? 'Saving...' : 'Record Stock In'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stock-out">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Stock Out Entry</p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <select
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={stockOutForm.itemId}
                    onChange={(event) => setStockOutForm((prev) => ({ ...prev, itemId: event.target.value }))}
                  >
                    <option value="">Select item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.currentQuantity} {item.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={stockOutForm.quantity || ''}
                    onChange={(event) => setStockOutForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                  />
                  <input
                    type="text"
                    placeholder="Reference"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={stockOutForm.reference}
                    onChange={(event) => setStockOutForm((prev) => ({ ...prev, reference: event.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Notes"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={stockOutForm.notes}
                    onChange={(event) => setStockOutForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>
                <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={!canManage || isSavingAction}
                      onClick={handleStockOut}
                    >
                      {isSavingAction ? 'Saving...' : 'Record Stock Out'}
                    </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="damaged">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Damaged Item Register</p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <select
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={damageForm.itemId}
                    onChange={(event) => setDamageForm((prev) => ({ ...prev, itemId: event.target.value }))}
                  >
                    <option value="">Select item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={damageForm.quantity || ''}
                    onChange={(event) => setDamageForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                  />
                  <input
                    type="text"
                    placeholder="Reason"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={damageForm.reason}
                    onChange={(event) => setDamageForm((prev) => ({ ...prev, reason: event.target.value }))}
                  />
                  <select
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={damageForm.bookingId}
                    onChange={(event) => setDamageForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                  >
                    <option value="">Event (optional)</option>
                    {approvedEvents.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.id} | {booking.eventName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={!canManage || isSavingAction}
                      onClick={handleRecordDamage}
                    >
                      {isSavingAction ? 'Saving...' : 'Record Damage'}
                    </Button>
                </div>

                <div className="mt-4 space-y-2">
                  {damages.length === 0 ? (
                    <p className="text-sm text-slate-600">No damaged records yet.</p>
                  ) : (
                    damages.slice(0, 20).map((entry) => {
                      const item = items.find((x) => x.id === entry.itemId);
                      return (
                        <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          {item?.name ?? 'Unknown item'} - {entry.quantity} ({entry.reason})
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="event-planner">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Event Planner</p>
                      <p className="mt-2 text-sm text-slate-600">Create an event plan, pick store items, then save and allocate them from stock.</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isCreatingEventPlan ? 'secondary' : 'default'}
                      onClick={() => setIsCreatingEventPlan((prev) => !prev)}
                    >
                      {isCreatingEventPlan ? 'Close Planner' : 'Create Event'}
                    </Button>
                  </div>

                  {isCreatingEventPlan ? (
                    <div className="mt-5 space-y-5">
                      <div className="grid gap-3 md:grid-cols-2">
                        <select
                          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                          value={plannerForm.bookingId}
                          onChange={(event) => setPlannerForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                        >
                          <option value="">Select approved event</option>
                          {approvedEvents.map((booking) => (
                            <option key={booking.id} value={booking.id}>
                              {booking.id} | {booking.eventName}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Event planning notes"
                          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                          value={plannerForm.eventNotes}
                          onChange={(event) => setPlannerForm((prev) => ({ ...prev, eventNotes: event.target.value }))}
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Plan Items From Store</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_0.6fr_1fr_auto]">
                          <select
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                            value={plannerForm.itemId}
                            onChange={(event) => setPlannerForm((prev) => ({ ...prev, itemId: event.target.value }))}
                          >
                            <option value="">Select item</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.currentQuantity} {item.unit})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                            value={plannerForm.quantity || ''}
                            onChange={(event) => setPlannerForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                          />
                          <input
                            type="text"
                            placeholder="Line notes"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                            value={plannerForm.notes}
                            onChange={(event) => setPlannerForm((prev) => ({ ...prev, notes: event.target.value }))}
                          />
                          <Button size="sm" type="button" onClick={handleAddPlannerItem}>
                            Add Item
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Planned Store Items</p>
                          <Badge className="bg-blue-100 text-blue-700">{plannerTotalUnits} total units</Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          {plannerResolvedItems.length === 0 ? (
                            <p className="text-sm text-slate-600">No items have been added to this event plan yet.</p>
                          ) : (
                            plannerResolvedItems.map((entry) => (
                              <div key={entry.itemId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                                <div>
                                  <p className="font-semibold text-slate-900">{entry.item?.name ?? 'Unknown item'}</p>
                                  <p className="text-xs text-slate-500">Available now: {entry.item?.currentQuantity ?? 0} {entry.item?.unit ?? 'units'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-slate-200 text-slate-900">{entry.quantity}</Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    type="button"
                                    onClick={() => setPlannerItems((prev) => prev.filter((item) => item.itemId !== entry.itemId))}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button size="sm" disabled={isSavingAction} onClick={handleSaveEventPlan}>
                            {isSavingAction ? 'Saving...' : 'Save Event Plan'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            disabled={isSavingAction}
                            onClick={() => {
                              setPlannerItems([]);
                              setPlannerForm({ bookingId: '', itemId: '', quantity: 1, notes: '', eventNotes: '' });
                            }}
                          >
                            Clear Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Low Stock Alerts</p>
                  <div className="mt-3 space-y-2">
                    {lowStock.length === 0 ? (
                      <p className="text-sm text-slate-600">No low stock alerts.</p>
                    ) : (
                      lowStock.map((item) => (
                        <div key={item.id} className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                          {item.name}: {item.currentQuantity} {item.unit} (reorder at {item.reorderLevel})
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Recent Inventory Movements</p>
                  <div className="mt-3 space-y-2">
                    {movements.length === 0 ? (
                      <p className="text-sm text-slate-600">No movement records yet.</p>
                    ) : (
                      movements.slice(0, 30).map((entry) => {
                        const item = items.find((x) => x.id === entry.itemId);
                        return (
                          <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between">
                              <span>{item?.name ?? 'Unknown item'}</span>
                              <Badge className="bg-slate-200 text-slate-900">{entry.type}</Badge>
                            </div>
                            <p className="text-xs text-slate-500">
                              Qty: {entry.quantity} | Ref: {entry.reference} | {new Date(entry.createdAt).toLocaleString()}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="allocation">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Allocate Items to Event</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={allocationForm.bookingId}
                      onChange={(event) => setAllocationForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                    >
                      <option value="">Select approved event</option>
                      {approvedEvents.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.id} | {booking.eventName}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={allocationForm.itemId}
                      onChange={(event) => setAllocationForm((prev) => ({ ...prev, itemId: event.target.value }))}
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.currentQuantity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={allocationForm.quantity || ''}
                      onChange={(event) => setAllocationForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                    />
                    <input
                      type="text"
                      placeholder="Notes"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={allocationForm.notes}
                      onChange={(event) => setAllocationForm((prev) => ({ ...prev, notes: event.target.value }))}
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={!canManage || isSavingAction}
                      onClick={handleAllocateItem}
                    >
                      {isSavingAction ? 'Saving...' : 'Allocate Item'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Open Event Allocations</p>
                  <div className="mt-3 space-y-2">
                    {openAllocations.length === 0 ? (
                      <p className="text-sm text-slate-600">No open allocations.</p>
                    ) : (
                      openAllocations.map((entry) => {
                        const item = items.find((x) => x.id === entry.itemId);
                        return (
                          <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between">
                              <span>{entry.bookingId} - {item?.name ?? 'Unknown item'} ({entry.quantity})</span>
                              <Button size="sm" variant="outline" disabled={!canManage || isSavingAction} onClick={() => handleReturnAllocation(entry.id)}>
                                Return
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
