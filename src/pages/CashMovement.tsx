import { useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { BudgetCategory } from '@/types/eventFinance';

const categories: BudgetCategory[] = [
  'decoration',
  'cooking',
  'drinks',
  'cleaning',
  'logistics',
  'other',
];

function label(value: string) {
  return value.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function CashMovement() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const {
    budgets,
    allocations,
    distributions,
    logs,
    createBudget,
    requestAllocation,
    controllerDecision,
    releaseFunds,
    addDistribution,
    getAllocationSummary,
    generateExpenseSheet,
  } = useEventFinance();

  const [message, setMessage] = useState('');
  const [sheetPreview, setSheetPreview] = useState('');
  const [budgetForm, setBudgetForm] = useState({
    bookingId: '',
    notes: '',
    decoration: 0,
    cooking: 0,
    drinks: 0,
    cleaning: 0,
    logistics: 0,
    other: 0,
  });
  const [allocationForm, setAllocationForm] = useState({
    budgetId: '',
    requestedAmount: 0,
    purpose: '',
  });
  const [distributionForm, setDistributionForm] = useState({
    allocationRequestId: '',
    category: 'decoration' as BudgetCategory,
    amount: 0,
    description: '',
    proofReference: '',
  });
  const [releaseReference, setReleaseReference] = useState('');

  const approvedEvents = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.bookingStatus === 'approved' &&
          (booking.eventDetailStatus === 'approved_assistant' || booking.eventDetailStatus === 'approved_controller'),
      ),
    [bookings],
  );

  const stats = useMemo(() => {
    const pendingController = allocations.filter((item) => item.status === 'pending_controller').length;
    const released = allocations.filter((item) => item.status === 'funds_released').length;
    const totalDistributed = distributions.reduce((sum, item) => sum + item.amount, 0);
    return [
      { title: 'Pending Requests', value: `${pendingController}`, description: 'awaiting controller decision' },
      { title: 'Funds Released', value: `${released}`, description: 'released by cashier 1' },
      { title: 'Budgets', value: `${budgets.length}`, description: 'event budget sheets prepared' },
      { title: 'Distributed Total', value: `TZS ${totalDistributed.toLocaleString()}`, description: 'allocated to categories' },
    ];
  }, [allocations, budgets.length, distributions]);

  const sections = [
    {
      title: 'Step 4 Flow',
      bullets: [
        'Cashier 2 prepares event budget and submits allocation request.',
        'Controller approves or rejects the allocation request.',
        'Cashier 1 releases approved funds; Cashier 2 records distribution by category.',
      ],
    },
  ];

  const canCashier2 = user?.role === 'cashier_2' || user?.role === 'controller';
  const canController = user?.role === 'controller';
  const canCashier1 = user?.role === 'cashier_1' || user?.role === 'controller';

  const handleCreateBudget = () => {
    const result = createBudget({
      bookingId: budgetForm.bookingId,
      notes: budgetForm.notes,
      categories: {
        decoration: Number(budgetForm.decoration) || 0,
        cooking: Number(budgetForm.cooking) || 0,
        drinks: Number(budgetForm.drinks) || 0,
        cleaning: Number(budgetForm.cleaning) || 0,
        logistics: Number(budgetForm.logistics) || 0,
        other: Number(budgetForm.other) || 0,
      },
    });
    setMessage(result.message);
  };

  const handleRequestAllocation = () => {
    const result = requestAllocation({
      budgetId: allocationForm.budgetId,
      requestedAmount: Number(allocationForm.requestedAmount) || 0,
      purpose: allocationForm.purpose,
    });
    setMessage(result.message);
  };

  const handleAddDistribution = () => {
    const result = addDistribution({
      allocationRequestId: distributionForm.allocationRequestId,
      category: distributionForm.category,
      amount: Number(distributionForm.amount) || 0,
      description: distributionForm.description,
      proofReference: distributionForm.proofReference,
    });
    setMessage(result.message);
  };

  const distributionReadyRequests = allocations.filter((item) => item.status === 'funds_released');

  return (
    <ManagementPageTemplate
      pageTitle="Cash Movement"
      subtitle="Event budgeting, fund allocation, and category-based expense distribution."
      stats={stats}
      sections={sections}
      action={
        <div className="space-y-6">
          {message ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>
          ) : null}

          <Tabs defaultValue="budget" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="budget">Event Budget Tab</TabsTrigger>
              <TabsTrigger value="allocation">Event Allocation Request Tab</TabsTrigger>
              <TabsTrigger value="distribution">Expense Distribution Tab</TabsTrigger>
              <TabsTrigger value="history">Event Expense History Tab</TabsTrigger>
            </TabsList>

            <TabsContent value="budget">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Create Event Budget</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2"
                    value={budgetForm.bookingId}
                    onChange={(event) => setBudgetForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                  >
                    <option value="">Select Approved Event</option>
                    {approvedEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.id} | {event.eventName} | {event.customerName}
                      </option>
                    ))}
                  </select>
                  {categories.map((category) => (
                    <input
                      key={category}
                      type="number"
                      placeholder={`${label(category)} (TZS)`}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={budgetForm[category] || ''}
                      onChange={(event) =>
                        setBudgetForm((prev) => ({
                          ...prev,
                          [category]: Number(event.target.value),
                        }))
                      }
                    />
                  ))}
                  <input
                    type="text"
                    placeholder="Budget notes"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2"
                    value={budgetForm.notes}
                    onChange={(event) => setBudgetForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>
                <div className="mt-4">
                  <Button size="sm" disabled={!canCashier2} onClick={handleCreateBudget}>
                    Save Budget
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="allocation">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Request Event Allocation</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={allocationForm.budgetId}
                      onChange={(event) => setAllocationForm((prev) => ({ ...prev, budgetId: event.target.value }))}
                    >
                      <option value="">Select Budget</option>
                      {budgets.map((budget) => (
                        <option key={budget.id} value={budget.id}>
                          {budget.id} | {budget.bookingId} | TZS {budget.totalAmount.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Requested Amount"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={allocationForm.requestedAmount || ''}
                      onChange={(event) =>
                        setAllocationForm((prev) => ({ ...prev, requestedAmount: Number(event.target.value) }))
                      }
                    />
                    <input
                      type="text"
                      placeholder="Purpose"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={allocationForm.purpose}
                      onChange={(event) => setAllocationForm((prev) => ({ ...prev, purpose: event.target.value }))}
                    />
                    <Button size="sm" disabled={!canCashier2} onClick={handleRequestAllocation}>
                      Submit
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Approval and Fund Release Queue</p>
                  <div className="mt-3 space-y-3">
                    {allocations.length === 0 ? (
                      <p className="text-sm text-slate-600">No allocation requests yet.</p>
                    ) : (
                      allocations.map((request) => (
                        <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{request.id}</p>
                            <Badge className="bg-slate-200 text-slate-900">{label(request.status)}</Badge>
                          </div>
                          <p className="text-slate-600">
                            Booking: {request.bookingId} | Requested: TZS {request.requestedAmount.toLocaleString()}
                          </p>
                          <p className="text-slate-500">Purpose: {request.purpose}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {canController && request.status === 'pending_controller' ? (
                              <>
                                <Button size="sm" onClick={() => setMessage(controllerDecision(request.id, 'approved', 'Approved by controller').message)}>
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setMessage(controllerDecision(request.id, 'rejected', 'Rejected by controller').message)}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : null}
                            {canCashier1 && request.status === 'approved_controller' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Release reference"
                                  className="rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs"
                                  value={releaseReference}
                                  onChange={(event) => setReleaseReference(event.target.value)}
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setMessage(releaseFunds(request.id, releaseReference).message)}
                                >
                                  Release Funds
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="distribution">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Record Expense Distribution</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={distributionForm.allocationRequestId}
                      onChange={(event) =>
                        setDistributionForm((prev) => ({ ...prev, allocationRequestId: event.target.value }))
                      }
                    >
                      <option value="">Select Released Allocation</option>
                      {distributionReadyRequests.map((request) => (
                        <option key={request.id} value={request.id}>
                          {request.id} | {request.bookingId}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={distributionForm.category}
                      onChange={(event) =>
                        setDistributionForm((prev) => ({ ...prev, category: event.target.value as BudgetCategory }))
                      }
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {label(category)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={distributionForm.amount || ''}
                      onChange={(event) =>
                        setDistributionForm((prev) => ({ ...prev, amount: Number(event.target.value) }))
                      }
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={distributionForm.description}
                      onChange={(event) =>
                        setDistributionForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                    <input
                      type="text"
                      placeholder="Proof reference (optional)"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2"
                      value={distributionForm.proofReference}
                      onChange={(event) =>
                        setDistributionForm((prev) => ({ ...prev, proofReference: event.target.value }))
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <Button size="sm" disabled={!canCashier2} onClick={handleAddDistribution}>
                      Add Distribution
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Allocation Balances</p>
                  <div className="mt-3 space-y-3">
                    {distributionReadyRequests.length === 0 ? (
                      <p className="text-sm text-slate-600">No released allocations yet.</p>
                    ) : (
                      distributionReadyRequests.map((request) => {
                        const summary = getAllocationSummary(request.id);
                        return (
                          <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                            <p className="font-semibold text-slate-900">{request.id}</p>
                            <p className="text-slate-600">
                              Requested: TZS {summary.requested.toLocaleString()} | Distributed: TZS {summary.distributed.toLocaleString()} | Remaining: TZS {summary.remaining.toLocaleString()}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Event Expense History</p>
                  <div className="mt-3 space-y-3">
                    {allocations.length === 0 ? (
                      <p className="text-sm text-slate-600">No expense history yet.</p>
                    ) : (
                      allocations.map((request) => (
                        <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{request.id} | {request.bookingId}</p>
                            <Badge className="bg-slate-200 text-slate-900">{label(request.status)}</Badge>
                          </div>
                          <p className="text-slate-600">Requested: TZS {request.requestedAmount.toLocaleString()} | Purpose: {request.purpose}</p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const sheet = generateExpenseSheet(request.id);
                                setMessage(sheet.message);
                                if (sheet.ok && sheet.sheet) {
                                  setSheetPreview(sheet.sheet);
                                }
                              }}
                            >
                              Generate Expense Sheet
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Expense Sheet Preview</p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    {sheetPreview || 'No sheet generated yet.'}
                  </pre>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Event Finance Log</p>
                  <div className="mt-3 space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-sm text-slate-600">No log entries yet.</p>
                    ) : (
                      logs.slice(0, 30).map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                          <p className="font-semibold text-slate-900">{entry.action}</p>
                          <p>{new Date(entry.timestamp).toLocaleString()} | {entry.actorRole} | {entry.referenceId}</p>
                          <p>{entry.detail}</p>
                        </div>
                      ))
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
