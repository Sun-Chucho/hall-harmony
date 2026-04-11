import { useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useToast } from '@/hooks/use-toast';
import { confirmAction } from '@/lib/confirmAction';
import { downloadCsv } from '@/lib/requestWorkflows';
import { InventoryItem, InventoryMovement } from '@/types/inventory';

interface EditFormState {
  name: string;
  unit: string;
  currentQuantity: string;
  reorderLevel: string;
  reason: string;
}

function getMovementLabel(type: InventoryMovement['type']) {
  switch (type) {
    case 'stock_in':
      return 'Stock In';
    case 'stock_out':
      return 'Stock Out';
    case 'allocation':
      return 'Allocated to Event';
    case 'return':
      return 'Returned from Event';
    case 'damaged':
      return 'Damage Recorded';
    case 'adjustment':
      return 'Item Edited';
  }
}

function formatQuantityDelta(value: number) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return '0';
}

function getItemStatus(item: InventoryItem) {
  if (item.currentQuantity === 0) return { label: 'Out of Stock', className: 'bg-rose-100 text-rose-700' };
  if (item.currentQuantity <= item.reorderLevel) return { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' };
  return { label: 'In Stock', className: 'bg-emerald-100 text-emerald-700' };
}

function buildEditDefaults(item: InventoryItem): EditFormState {
  return {
    name: item.name,
    unit: item.unit,
    currentQuantity: String(item.currentQuantity),
    reorderLevel: String(item.reorderLevel),
    reason: '',
  };
}

export default function Inventory() {
  const { user, staffUsers } = useAuth();
  const { toast } = useToast();
  const { items, movements, getReport, canManageInventory, editItem } = useInventory();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    unit: '',
    currentQuantity: '',
    reorderLevel: '',
    reason: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const report = getReport();
  const inventoryRows = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  );
  const itemLookup = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const staffLookup = useMemo(
    () => new Map(staffUsers.map((staff) => [staff.id, staff])),
    [staffUsers],
  );
  const auditTrail = useMemo(
    () => [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [movements],
  );

  if (!user) return null;

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditForm(buildEditDefaults(item));
  };

  const closeEditDialog = () => {
    setSelectedItem(null);
    setEditForm({
      name: '',
      unit: '',
      currentQuantity: '',
      reorderLevel: '',
      reason: '',
    });
  };

  const handleSaveEdit = () => {
    if (!selectedItem || isSaving) return;
    if (!confirmAction(`Save changes to ${selectedItem.name}?`)) return;

    setIsSaving(true);
    const result = editItem(selectedItem.id, {
      name: editForm.name,
      unit: editForm.unit,
      currentQuantity: Number(editForm.currentQuantity),
      reorderLevel: Number(editForm.reorderLevel),
      reason: editForm.reason,
    });
    toast({
      title: result.ok ? 'Inventory updated' : 'Update failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
    if (result.ok) closeEditDialog();
    setIsSaving(false);
  };

  return (
    <ManagementPageTemplate
      pageTitle="Inventory"
      subtitle="Full inventory table for Event Planner / Storekeeper with download, editing, and audit visibility."
      stats={[
        { title: 'Stock Items', value: `${report.totalItems}`, description: 'registered inventory records' },
        { title: 'Total Units', value: `${report.totalUnits}`, description: 'current quantity across all items' },
        { title: 'Low Stock Alerts', value: `${report.lowStockItems}`, description: 'items at or below reorder level' },
        { title: 'Audit Events', value: `${auditTrail.length}`, description: 'inventory changes recorded in movement history' },
      ]}
      sections={[]}
      action={
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Inventory Table</p>
                <p className="mt-1 text-sm text-slate-600">All stock items in a table view. Download the full register or edit individual rows.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadCsv('inventory-register.csv', [
                  ['Item ID', 'Item', 'Unit', 'Current Quantity', 'Reorder Level', 'Status', 'Created At'],
                  ...inventoryRows.map((item) => [
                    item.id,
                    item.name,
                    item.unit,
                    item.currentQuantity,
                    item.reorderLevel,
                    getItemStatus(item).label,
                    item.createdAt,
                  ]),
                ])}
              >
                Download CSV
              </Button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3">Item</th>
                    <th className="px-3 py-3">Unit</th>
                    <th className="px-3 py-3">Current Qty</th>
                    <th className="px-3 py-3">Reorder Level</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Created</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={7}>No inventory items found.</td>
                    </tr>
                  ) : (
                    inventoryRows.map((item) => {
                      const status = getItemStatus(item);
                      return (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="px-3 py-3 text-slate-700">{item.unit}</td>
                          <td className="px-3 py-3 text-slate-700">{item.currentQuantity}</td>
                          <td className="px-3 py-3 text-slate-700">{item.reorderLevel}</td>
                          <td className="px-3 py-3">
                            <Badge className={status.className}>{status.label}</Badge>
                          </td>
                          <td className="px-3 py-3 text-slate-700">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-3">
                            {canManageInventory ? (
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                                Edit
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">View only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Inventory Audit Trail</p>
                <p className="mt-1 text-sm text-slate-600">Every stock action and item edit is recorded from the movement history.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-100 text-slate-700">{auditTrail.length} events</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCsv('inventory-audit-trail.csv', [
                    ['Date', 'Action', 'Item', 'Qty Change', 'Reference', 'Actor', 'Notes'],
                    ...auditTrail.map((entry) => {
                      const item = itemLookup.get(entry.itemId);
                      const actor = staffLookup.get(entry.performedByUserId);
                      return [
                        entry.createdAt,
                        getMovementLabel(entry.type),
                        item?.name ?? entry.itemId,
                        formatQuantityDelta(entry.quantity),
                        entry.reference,
                        actor?.name ?? entry.performedByUserId,
                        entry.notes || '-',
                      ];
                    }),
                  ])}
                >
                  Download Audit CSV
                </Button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Item</th>
                    <th className="px-3 py-3">Qty Change</th>
                    <th className="px-3 py-3">Reference</th>
                    <th className="px-3 py-3">Actor</th>
                    <th className="px-3 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={7}>No inventory audit activity recorded yet.</td>
                    </tr>
                  ) : (
                    auditTrail.map((entry) => {
                      const item = itemLookup.get(entry.itemId);
                      const actor = staffLookup.get(entry.performedByUserId);
                      return (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 text-slate-700">{new Date(entry.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-3 text-slate-700">{getMovementLabel(entry.type)}</td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{item?.name ?? entry.itemId}</td>
                          <td className="px-3 py-3 text-slate-700">{formatQuantityDelta(entry.quantity)}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.reference}</td>
                          <td className="px-3 py-3 text-slate-700">
                            {actor?.name ?? entry.performedByUserId}
                            {entry.performedByRole ? ` (${entry.performedByRole.replace(/_/g, ' ')})` : ''}
                          </td>
                          <td className="px-3 py-3 text-slate-700">{entry.notes || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && closeEditDialog()}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Inventory Item</DialogTitle>
                <DialogDescription>Update the selected inventory row and save a reason for the audit trail.</DialogDescription>
              </DialogHeader>
              {selectedItem ? (
                <div className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="inventory-name">Item name</Label>
                      <Input id="inventory-name" value={editForm.name} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inventory-unit">Unit</Label>
                      <Input id="inventory-unit" value={editForm.unit} onChange={(event) => setEditForm((prev) => ({ ...prev, unit: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inventory-quantity">Current quantity</Label>
                      <Input id="inventory-quantity" type="number" value={editForm.currentQuantity} onChange={(event) => setEditForm((prev) => ({ ...prev, currentQuantity: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inventory-reorder">Reorder level</Label>
                      <Input id="inventory-reorder" type="number" value={editForm.reorderLevel} onChange={(event) => setEditForm((prev) => ({ ...prev, reorderLevel: event.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inventory-reason">Reason for edit</Label>
                    <Input id="inventory-reason" value={editForm.reason} onChange={(event) => setEditForm((prev) => ({ ...prev, reason: event.target.value }))} placeholder="Describe why you changed this item" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={closeEditDialog}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      }
    />
  );
}
