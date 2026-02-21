import { useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { useInventory } from '@/contexts/InventoryContext';

export default function Rentals() {
  const { user } = useAuth();
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

  const report = getReport();
  const approvedEvents = useMemo(
    () => bookings.filter((booking) => booking.bookingStatus === 'approved'),
    [bookings],
  );
  const lowStock = items.filter((item) => item.currentQuantity <= item.reorderLevel);
  const openAllocations = allocations.filter((allocation) => allocation.status === 'allocated');
  const canManage = user?.role === 'store_keeper' || user?.role === 'controller';

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
              <div className="mt-3 space-y-2">
                {movements.length === 0 ? (
                  <p className="text-sm text-slate-600">No movement records yet.</p>
                ) : (
                  movements.slice(0, 15).map((entry) => {
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
        }
      />
    );
  }

  if (user?.role === 'manager') {
    return (
      <ManagementPageTemplate
        pageTitle="Inventory"
        subtitle="Hall Manager inventory oversight (view-only)."
        stats={stats}
        sections={[
          {
            title: 'Inventory Oversight',
            bullets: [
              'View stock table, stock in/out history, and damaged items.',
              'No inventory edits are allowed for Hall Manager.',
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
              <div className="mt-3 space-y-2">
                {movements.length === 0 ? (
                  <p className="text-sm text-slate-600">No movement records yet.</p>
                ) : (
                  movements.slice(0, 20).map((entry) => {
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

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Damaged Items</p>
              <div className="mt-3 space-y-2">
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

  if (user?.role === 'store_keeper' || user?.role === 'controller') {
    return (
      <ManagementPageTemplate
        pageTitle="Inventory & Store"
        subtitle="Stock in, stock out, and damaged item control."
        stats={stats}
        sections={[
          {
            title: 'Inventory Operations',
            bullets: [
              'Stock In and Stock Out register every movement with reference and notes.',
              'Damaged items are tracked with reason and optional event link.',
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
                        disabled={!canManage}
                        onClick={() => setMessage(addItem(itemForm.name, itemForm.unit, itemForm.openingQuantity, itemForm.reorderLevel).message)}
                      >
                        Add Item
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
                        disabled={!canManage}
                        onClick={() =>
                          setMessage(
                            stockIn(
                              stockInForm.itemId,
                              stockInForm.quantity,
                              stockInForm.reference,
                              stockInForm.notes,
                            ).message,
                          )
                        }
                      >
                        Record Stock In
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
                      disabled={!canManage}
                      onClick={() =>
                        setMessage(
                          stockOut(
                            stockOutForm.itemId,
                            stockOutForm.quantity,
                            stockOutForm.reference,
                            stockOutForm.notes,
                          ).message,
                        )
                      }
                    >
                      Record Stock Out
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
                      disabled={!canManage}
                      onClick={() =>
                        setMessage(
                          recordDamage(
                            damageForm.itemId,
                            damageForm.quantity,
                            damageForm.reason,
                            damageForm.bookingId || undefined,
                          ).message,
                        )
                      }
                    >
                      Record Damage
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
            </Tabs>
          </div>
        }
      />
    );
  }

  return (
    <ManagementPageTemplate
      pageTitle="Inventory & Store"
      subtitle="Store Keeper workspace for stock control, item allocation, and inventory reporting."
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
                      disabled={!canManage}
                      onClick={() => setMessage(addItem(itemForm.name, itemForm.unit, itemForm.openingQuantity, itemForm.reorderLevel).message)}
                    >
                      Add Item
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
                      disabled={!canManage}
                      onClick={() =>
                        setMessage(
                          stockIn(
                            stockInForm.itemId,
                            stockInForm.quantity,
                            stockInForm.reference,
                            stockInForm.notes,
                          ).message,
                        )
                      }
                    >
                      Record Stock In
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
                    disabled={!canManage}
                    onClick={() =>
                      setMessage(
                        stockOut(
                          stockOutForm.itemId,
                          stockOutForm.quantity,
                          stockOutForm.reference,
                          stockOutForm.notes,
                        ).message,
                      )
                    }
                  >
                    Record Stock Out
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
                    disabled={!canManage}
                    onClick={() =>
                      setMessage(
                        recordDamage(
                          damageForm.itemId,
                          damageForm.quantity,
                          damageForm.reason,
                          damageForm.bookingId || undefined,
                        ).message,
                      )
                    }
                  >
                    Record Damage
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
                      disabled={!canManage}
                      onClick={() =>
                        setMessage(
                          allocateToEvent(
                            allocationForm.bookingId,
                            allocationForm.itemId,
                            allocationForm.quantity,
                            allocationForm.notes,
                          ).message,
                        )
                      }
                    >
                      Allocate Item
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
                              <Button size="sm" variant="outline" disabled={!canManage} onClick={() => setMessage(returnFromEvent(entry.id).message)}>
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
