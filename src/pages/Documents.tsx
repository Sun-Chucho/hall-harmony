import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { confirmAction } from '@/lib/confirmAction';
import { db } from '@/lib/firebase';
import { ROLE_LABELS, UserRole } from '@/types/auth';

type FormId =
  | 'lpo'
  | 'delivery_note'
  | 'grn'
  | 'stores_ledger'
  | 'tax_invoice'
  | 'payment_voucher'
  | 'petty_cash'
  | 'cash_request'
  | 'hall_registration';

interface ManualForm {
  id: FormId;
  title: string;
  roles: UserRole[];
}

interface FormSubmission {
  id: string;
  formId: FormId;
  formTitle: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
}

type CashRequestStatus =
  | 'pending_controller'
  | 'declined_controller'
  | 'pending_manager'
  | 'approved_manager'
  | 'declined_manager';

interface CashRequestWorkflow {
  id: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
  status: CashRequestStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

const DOCUMENT_OUTPUTS_COLLECTION = 'document_form_outputs';
const DOCUMENT_OUTPUTS_CACHE_KEY = 'kuringe_documents_form_outputs_v1';
const CASH_REQUEST_WORKFLOW_COLLECTION = 'cash_request_workflow';
const CASH_REQUEST_WORKFLOW_CACHE_KEY = 'kuringe_cash_request_workflow_v1';

const manualForms: ManualForm[] = [
  { id: 'lpo', title: 'Local Purchase Order', roles: ['purchaser', 'accountant'] },
  { id: 'delivery_note', title: 'Delivery Note', roles: ['accountant', 'store_keeper'] },
  { id: 'grn', title: 'Goods Received Note (GRN)', roles: ['store_keeper', 'accountant'] },
  { id: 'stores_ledger', title: 'Stores Ledger Book', roles: ['store_keeper', 'accountant'] },
  { id: 'tax_invoice', title: 'Tax Invoice', roles: ['cashier_1', 'accountant'] },
  { id: 'cash_request', title: 'Cash Request Form', roles: ['assistant_hall_manager', 'cashier_1', 'store_keeper', 'purchaser', 'accountant'] },
  { id: 'payment_voucher', title: 'Payment Voucher', roles: ['assistant_hall_manager', 'cashier_1', 'accountant'] },
  { id: 'petty_cash', title: 'Petty Cash Voucher', roles: ['cashier_1', 'accountant', 'manager'] },
  { id: 'hall_registration', title: 'Hall Registration Form', roles: ['cashier_1', 'manager'] },
];

function inputClass(extra = '') {
  return `h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm ${extra}`;
}

function serialHeader(title: string) {
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Serial No. 001</p>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    </div>
  );
}

export default function Documents() {
  const { user } = useAuth();
  const { sendManagerAlert } = useMessages();
  const [outputs, setOutputs] = useState<FormSubmission[]>([]);
  const [cashRequests, setCashRequests] = useState<CashRequestWorkflow[]>([]);
  const [outputFormFilter, setOutputFormFilter] = useState<'all' | FormId>('all');
  const [outputDateFrom, setOutputDateFrom] = useState('');
  const [outputDateTo, setOutputDateTo] = useState('');
  const [accountantComment, setAccountantComment] = useState<Record<string, string>>({});
  const [managerComment, setManagerComment] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = localStorage.getItem(DOCUMENT_OUTPUTS_CACHE_KEY);
    if (!raw) return;
    try {
      setOutputs(JSON.parse(raw) as FormSubmission[]);
    } catch {
      localStorage.removeItem(DOCUMENT_OUTPUTS_CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DOCUMENT_OUTPUTS_CACHE_KEY, JSON.stringify(outputs));
  }, [outputs]);

  useEffect(() => {
    const raw = localStorage.getItem(CASH_REQUEST_WORKFLOW_CACHE_KEY);
    if (!raw) return;
    try {
      setCashRequests(JSON.parse(raw) as CashRequestWorkflow[]);
    } catch {
      localStorage.removeItem(CASH_REQUEST_WORKFLOW_CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CASH_REQUEST_WORKFLOW_CACHE_KEY, JSON.stringify(cashRequests));
  }, [cashRequests]);

  useEffect(() => {
    if (!user) {
      setOutputs([]);
      return;
    }

    const q = query(collection(db, DOCUMENT_OUTPUTS_COLLECTION), orderBy('submittedAt', 'desc'), limit(300));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((item) => {
          const data = item.data() as Omit<FormSubmission, 'id'>;
          return {
            id: item.id,
            ...data,
          } as FormSubmission;
        });
        setOutputs(next);
      },
      () => {
        const raw = localStorage.getItem(DOCUMENT_OUTPUTS_CACHE_KEY);
        if (!raw) return;
        try {
          setOutputs(JSON.parse(raw) as FormSubmission[]);
        } catch {
          localStorage.removeItem(DOCUMENT_OUTPUTS_CACHE_KEY);
        }
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCashRequests([]);
      return;
    }

    const q = query(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc'), limit(300));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((item) => {
          const data = item.data() as Omit<CashRequestWorkflow, 'id'>;
          return { id: item.id, ...data } as CashRequestWorkflow;
        });
        setCashRequests(next);
      },
      () => {
        const raw = localStorage.getItem(CASH_REQUEST_WORKFLOW_CACHE_KEY);
        if (!raw) return;
        try {
          setCashRequests(JSON.parse(raw) as CashRequestWorkflow[]);
        } catch {
          localStorage.removeItem(CASH_REQUEST_WORKFLOW_CACHE_KEY);
        }
      },
    );

    return () => unsub();
  }, [user]);

  const allowedForms = useMemo(() => {
    if (!user) return [];
    if (user.role === 'manager') return [];
    return manualForms.filter((item) => item.roles.includes(user.role));
  }, [user]);

  const myForms = allowedForms.length;
  const myRole = user?.role;
  const externalOutputs = outputs.filter((entry) => entry.submittedBy !== user?.id);
  const filteredExternalOutputs = externalOutputs.filter((entry) => {
    if (outputFormFilter !== 'all' && entry.formId !== outputFormFilter) {
      return false;
    }

    const entryDay = entry.submittedAt.slice(0, 10);
    if (outputDateFrom && entryDay < outputDateFrom) {
      return false;
    }
    if (outputDateTo && entryDay > outputDateTo) {
      return false;
    }
    return true;
  });

  const pendingForController = cashRequests.filter((entry) => entry.status === 'pending_controller');
  const pendingForManager = cashRequests.filter((entry) => entry.status === 'pending_manager');

  const stats = [
    { title: 'Fillable Forms', value: String(myForms), description: 'forms assigned to your role' },
    { title: 'All Form Types', value: String(manualForms.length), description: 'manual register list' },
    { title: 'Submitted Outputs', value: String(outputs.length), description: 'all saved form entries' },
    {
      title: user?.role === 'accountant' ? 'Pending Cash Requests' : user?.role === 'manager' ? 'Manager Queue' : 'My Role',
      value:
        user?.role === 'accountant'
          ? String(pendingForController.length)
          : user?.role === 'manager'
            ? String(pendingForManager.length)
            : user
              ? ROLE_LABELS[user.role]
              : 'N/A',
      description:
        user?.role === 'accountant'
          ? 'awaiting accountant decision'
          : user?.role === 'manager'
            ? 'awaiting hall manager decision'
            : 'current user designation',
    },
  ];

  const saveSubmission = async (formId: FormId, formTitle: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (!confirmAction(`Are you sure you want to save ${formTitle}?`)) return;

    const formData = new FormData(event.currentTarget);
    const fields: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      const normalized = String(value).trim();
      if (!normalized) continue;
      if (fields[key]) {
        fields[key] = `${fields[key]}, ${normalized}`;
      } else {
        fields[key] = normalized;
      }
    }

    const payload = {
      formId,
      formTitle,
      submittedAt: new Date().toISOString(),
      submittedBy: user.id,
      submittedByRole: user.role,
      fields,
      updatedAt: serverTimestamp(),
    };

    if (formId === 'cash_request') {
      const workflowPayload = {
        submittedAt: new Date().toISOString(),
        submittedBy: user.id,
        submittedByRole: user.role,
        fields,
        status: user.role === 'accountant' ? 'pending_manager' : 'pending_controller',
        reviewedAt: user.role === 'accountant' ? new Date().toISOString() : undefined,
        reviewedBy: user.role === 'accountant' ? user.id : undefined,
        reviewComment: user.role === 'accountant' ? 'Accountant submitted and forwarded to Managing Director.' : undefined,
        updatedAt: serverTimestamp(),
      };
      try {
        await addDoc(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION), workflowPayload);
      } catch {
        const localFallback: CashRequestWorkflow = {
          id: `LOCAL-CR-${Date.now()}`,
          submittedAt: new Date().toISOString(),
          submittedBy: user.id,
          submittedByRole: user.role,
          fields,
          status: user.role === 'accountant' ? 'pending_manager' : 'pending_controller',
          reviewedAt: user.role === 'accountant' ? new Date().toISOString() : undefined,
          reviewedBy: user.role === 'accountant' ? user.id : undefined,
          reviewComment: user.role === 'accountant' ? 'Accountant submitted and forwarded to Managing Director.' : undefined,
        };
        setCashRequests((prev) => [localFallback, ...prev]);
      }

      if (user.role === 'accountant') {
        await sendManagerAlert({
          title: 'Cash Request Pending Managing Director',
          body: `Accountant submitted/validated a cash request: TZS ${fields.total_requested ?? '0'}. Awaiting Managing Director decision.`,
        });
      }
    }

    try {
      await addDoc(collection(db, DOCUMENT_OUTPUTS_COLLECTION), payload);
      event.currentTarget.reset();
    } catch {
      const localFallback: FormSubmission = {
        id: `LOCAL-${Date.now()}`,
        formId,
        formTitle,
        submittedAt: new Date().toISOString(),
        submittedBy: user.id,
        submittedByRole: user.role,
        fields,
      };
      setOutputs((prev) => [localFallback, ...prev]);
      event.currentTarget.reset();
    }
  };

  const handleControllerCashDecision = async (requestId: string, decision: 'approve' | 'decline') => {
    if (!user || user.role !== 'accountant') return;
    if (!confirmAction(`Are you sure you want to ${decision} this cash request?`)) return;
    const request = cashRequests.find((entry) => entry.id === requestId);
    if (!request) return;
    const comment = accountantComment[requestId]?.trim() ?? '';

    try {
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, requestId), {
        status: decision === 'approve' ? 'pending_manager' : 'declined_controller',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id,
        reviewComment: comment || (decision === 'approve' ? 'Approved by accountant.' : 'Declined by accountant.'),
        updatedAt: serverTimestamp(),
      });
    } catch {
      setCashRequests((prev) =>
        prev.map((entry) =>
          entry.id === requestId
            ? {
                ...entry,
                status: decision === 'approve' ? 'pending_manager' : 'declined_controller',
                reviewedAt: new Date().toISOString(),
                reviewedBy: user.id,
                reviewComment: comment || (decision === 'approve' ? 'Approved by accountant.' : 'Declined by accountant.'),
              }
            : entry,
        ),
      );
    }

    if (decision === 'approve') {
      await sendManagerAlert({
        title: 'Cash Request Pending Managing Director',
        body: `Cash request ${request.id} approved by accountant and forwarded to Managing Director. Requested amount: TZS ${request.fields.total_requested ?? '0'}.`,
      });
    }
  };

  const handleManagerCashDecision = async (requestId: string, decision: 'approve' | 'decline') => {
    if (!user || user.role !== 'manager') return;
    if (!confirmAction(`Are you sure you want to ${decision} this cash request?`)) return;
    const request = cashRequests.find((entry) => entry.id === requestId);
    if (!request) return;
    const comment = managerComment[requestId]?.trim() ?? '';
    if (!comment) return;

    try {
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, requestId), {
        status: decision === 'approve' ? 'approved_manager' : 'declined_manager',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id,
        reviewComment: comment,
        updatedAt: serverTimestamp(),
      });
    } catch {
      setCashRequests((prev) =>
        prev.map((entry) =>
          entry.id === requestId
            ? {
                ...entry,
                status: decision === 'approve' ? 'approved_manager' : 'declined_manager',
                reviewedAt: new Date().toISOString(),
                reviewedBy: user.id,
                reviewComment: comment,
              }
            : entry,
        ),
      );
    }
  };

  const formShell = (formId: FormId, title: string, body: React.ReactNode) => (
    <form className="space-y-3" onSubmit={(event) => void saveSubmission(formId, title, event)}>
      {serialHeader(title)}
      {body}
      <div className="flex items-center gap-2">
        <Button type="submit">Save Form Output</Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>Print</Button>
      </div>
    </form>
  );

  return (
    <ManagementPageTemplate
      pageTitle="Documents"
      subtitle="Fill manual forms by role. Other roles see submitted outputs only."
      stats={stats}
      sections={[]}
      action={
        <div className="space-y-6">
          {myForms > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Tabs defaultValue={allowedForms[0].id} className="space-y-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                  {allowedForms.map((form) => (
                    <TabsTrigger key={form.id} value={form.id}>{form.title}</TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="lpo" className="space-y-3">
                  {formShell('lpo', 'Local Purchase Order', (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                        <input name="supplier_name" className={inputClass()} placeholder="Supplier Name" />
                        <input name="date" className={inputClass()} placeholder="Date" />
                        <input name="contact_no" className={inputClass()} placeholder="Contact No" />
                        <input name="email" className={inputClass()} placeholder="Email" />
                        <input name="address" className={inputClass('md:col-span-2')} placeholder="Address" />
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Order Information</p>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-xs uppercase text-slate-500 font-semibold">
                          <p>Item Description</p><p>Quantity</p><p>Unit Price</p><p>Amount</p>
                        </div>
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className="mt-2 grid grid-cols-4 gap-2">
                            <input name={`item_${i}`} className={inputClass()} />
                            <input name={`qty_${i}`} className={inputClass()} />
                            <input name={`unit_price_${i}`} className={inputClass()} />
                            <input name={`amount_${i}`} className={inputClass()} />
                          </div>
                        ))}
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <input name="subtotal" className={inputClass()} placeholder="Subtotal" />
                          <input name="tax" className={inputClass()} placeholder="Tax" />
                          <input name="tax_amount" className={inputClass()} placeholder="Tax Amount" />
                          <input name="shipping_fee" className={inputClass()} placeholder="Shipping Fee" />
                          <input name="total" className={inputClass()} placeholder="Total" />
                          <input name="payment_type" className={inputClass()} placeholder="Payment Type" />
                        </div>
                      </div>
                    </>
                  ))}
                </TabsContent>

                <TabsContent value="delivery_note" className="space-y-3">
                  {formShell('delivery_note', 'Delivery Note', (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                        <input name="to" className={inputClass()} placeholder="To" />
                        <input name="order_number" className={inputClass()} placeholder="Order Number" />
                        <input name="address" className={inputClass()} placeholder="Address" />
                        <input name="invoice_number" className={inputClass()} placeholder="Invoice Number" />
                        <input name="contact_person" className={inputClass()} placeholder="Contact Person" />
                        <input name="phone" className={inputClass()} placeholder="Phone" />
                        <input name="shipping_date" className={inputClass()} placeholder="Shipping Date" />
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-3">
                        <input name="hod_signature" className={inputClass()} placeholder="HOD Authorization Signature" />
                        <input name="designation" className={inputClass()} placeholder="Designation" />
                        <input name="name" className={inputClass()} placeholder="Name" />
                      </div>
                    </>
                  ))}
                </TabsContent>

                <TabsContent value="grn" className="space-y-3">
                  {formShell('grn', 'Goods Received Note (GRN)', (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                        <input name="grn_number" className={inputClass()} placeholder="GRN Number" />
                        <input name="date" className={inputClass()} placeholder="Date" />
                        <input name="delivery_note_number" className={inputClass()} placeholder="Delivery Note Number" />
                        <input name="supplier_name" className={inputClass()} placeholder="Supplier Name" />
                        <input name="delivery_date" className={inputClass()} placeholder="Delivery Date" />
                        <input name="supplier_address" className={inputClass()} placeholder="Supplier Address" />
                        <input name="carrier_driver" className={inputClass()} placeholder="Carrier/Driver Name" />
                        <input name="supplier_contact" className={inputClass()} placeholder="Supplier Contact Information" />
                        <input name="received_by" className={inputClass()} placeholder="Received By" />
                        <input name="receiving_department" className={inputClass()} placeholder="Receiving Department" />
                      </div>
                    </>
                  ))}
                </TabsContent>

                <TabsContent value="stores_ledger" className="space-y-3">
                  {formShell('stores_ledger', 'Stores Ledger Book', (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="grid grid-cols-8 gap-2 text-xs uppercase text-slate-500 font-semibold">
                        <p>Date</p><p>GRN No</p><p>Qty In</p><p>Unit In</p><p>MRN No</p><p>Qty Out</p><p>Balance</p><p>Remarks</p>
                      </div>
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="mt-2 grid grid-cols-8 gap-2">
                          <input name={`date_${i}`} className={inputClass()} />
                          <input name={`grn_${i}`} className={inputClass()} />
                          <input name={`qty_in_${i}`} className={inputClass()} />
                          <input name={`unit_in_${i}`} className={inputClass()} />
                          <input name={`mrn_${i}`} className={inputClass()} />
                          <input name={`qty_out_${i}`} className={inputClass()} />
                          <input name={`balance_${i}`} className={inputClass()} />
                          <input name={`remarks_${i}`} className={inputClass()} />
                        </div>
                      ))}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="tax_invoice" className="space-y-3">
                  {formShell('tax_invoice', 'Tax Invoice', (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                        <input name="invoice_number" className={inputClass()} placeholder="Invoice Number" />
                        <input name="date" className={inputClass()} placeholder="Date" />
                        <input name="bill_to" className={inputClass()} placeholder="Bill To" />
                        <input name="for" className={inputClass()} placeholder="For" />
                        <textarea name="item_description" className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows={3} placeholder="Item Description (Goods or Service)" />
                        <input name="amount" className={inputClass()} placeholder="Amount" />
                        <input name="vat" className={inputClass()} placeholder="VAT" />
                        <input name="sum_inclusive" className={inputClass()} placeholder="Sum Inclusive" />
                        <textarea name="amount_words" className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows={2} placeholder="Amount Due In Words" />
                        <input name="issuing_authority" className={inputClass()} placeholder="Issuing Authority" />
                        <input name="signature" className={inputClass()} placeholder="Signature" />
                      </div>
                    </>
                  ))}
                </TabsContent>

                <TabsContent value="payment_voucher" className="space-y-3">
                  {formShell('payment_voucher', 'Payment Voucher', (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                        <input name="payee_name" className={inputClass()} placeholder="Customer / Payee Name" />
                        <input name="department" className={inputClass()} placeholder="Company / Department" />
                        <input name="pos_code" className={inputClass()} placeholder="POS Code" />
                        <input name="date" className={inputClass()} placeholder="Date" />
                        <input name="address" className={inputClass()} placeholder="Address" />
                        <input name="tin" className={inputClass()} placeholder="Customer TIN" />
                        <input name="voucher_number" className={inputClass()} placeholder="Payment Voucher Number" />
                        <input name="invoice_number" className={inputClass()} placeholder="Invoice Number" />
                        <input name="request_number" className={inputClass()} placeholder="Request Number" />
                        <input name="invoice_date" className={inputClass()} placeholder="Invoice Date" />
                      </div>
                    </>
                  ))}
                </TabsContent>

                <TabsContent value="petty_cash" className="space-y-3">
                  {formShell('petty_cash', 'Petty Cash Voucher (Below TZS 100,000)', (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                      <input name="date" className={inputClass()} placeholder="Date" />
                      <input name="voucher_no" className={inputClass()} placeholder="Petty Cash Voucher Number" />
                      <input name="description" className={inputClass()} placeholder="Description" />
                      <input name="department" className={inputClass()} placeholder="Department" />
                      <input name="amount" className={inputClass()} placeholder="Amount" />
                      <input name="total" className={inputClass()} placeholder="Total" />
                      <input name="approved_by" className={inputClass()} placeholder="Approved By" />
                      <input name="cash_received" className={inputClass()} placeholder="Cash Received" />
                      <input name="designation" className={inputClass()} placeholder="Designation" />
                      <input name="signature" className={inputClass()} placeholder="Signature" />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="cash_request" className="space-y-3">
                  {formShell('cash_request', 'Cash Request Form', (
                    <>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        Cash request submissions are routed to the accountant first, then approved requests are forwarded to Managing Director.
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                        <input name="pef_no" className={inputClass()} placeholder="PEF No" />
                        <input name="date" className={inputClass()} placeholder="Date" />
                        <input name="full_name" className={inputClass()} placeholder="Full Name" />
                        <input name="designation" className={inputClass()} placeholder="Designation" />
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="grid grid-cols-5 gap-2 text-xs uppercase text-slate-500 font-semibold">
                          <p>No</p><p>Item</p><p>Qty</p><p>Price</p><p>Amount</p>
                        </div>
                        {[1,2,3,4].map((i) => (
                          <div key={i} className="mt-2 grid grid-cols-5 gap-2">
                            <input name={`row_${i}`} className={inputClass()} defaultValue={String(i)} />
                            <input name={`item_${i}`} className={inputClass()} />
                            <input name={`qty_${i}`} className={inputClass()} />
                            <input name={`price_${i}`} className={inputClass()} />
                            <input name={`amount_${i}`} className={inputClass()} />
                          </div>
                        ))}
                        <input name="total_requested" className={`${inputClass()} mt-2`} placeholder="Total Amount Requested (TZS)" />
                        <textarea name="amount_words" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} placeholder="Amount in Words" />
                        <textarea name="requester_declaration" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} placeholder="Requester Declaration" />
                      </div>
                    </>
                  ))}
                </TabsContent>

                <TabsContent value="hall_registration" className="space-y-3">
                  {formShell('hall_registration', 'Hall Registration Form (Fomu ya Usajili wa Ukumbi)', (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                        <input name="booking_date" className={inputClass()} placeholder="Booking Date" />
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">A. Client Information</p>
                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                          <input name="client_name" className={inputClass()} placeholder="Full Name / Jina Kamili" />
                          <input name="phone" className={inputClass()} placeholder="Phone No. / Simu" />
                          <input name="address" className={inputClass('md:col-span-2')} placeholder="Physical Address / Makazi" />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">B. Event Details</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-3 text-sm">
                          {['Wedding / Harusi','Kitchen Party','Birthday','Corporate Event','Graduation','Conference','Baby Shower / Bridal Shower','Religious Ceremony','Other'].map((x) => (
                            <label key={x} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><input name="event_type" type="checkbox" value={x} /> {x}</label>
                          ))}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <input name="event_date" className={inputClass()} placeholder="Event Date / Tarehe ya Tukio" />
                          <input name="guests" className={inputClass()} placeholder="No. of Guests / Idadi ya Wageni" />
                          <input name="start_time" className={inputClass()} placeholder="Start Time / Muda wa Kuanza" />
                          <input name="end_time" className={inputClass()} placeholder="End Time / Muda wa Kumaliza" />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">C. Hall Selection</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-4 text-sm">
                          {['700 Pax','400 Pax','300 Pax','70 Pax'].map((x) => (
                            <label key={x} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><input name="hall_selection" type="checkbox" value={x} /> {x}</label>
                          ))}
                        </div>
                        <input name="hall_charge" className={`${inputClass()} mt-3`} placeholder="Hall Charge (Ada ya Ukumbi): TZS" />
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">D. Services Required</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-3 text-sm">
                          {[
                            'Hall Only','Hall + Chairs + Tables','Hall + VIP Setup','Standard Decor','Gold Luxury','Royal Theme','Standard Buffet','Premium Buffet','Soft Drinks','Alcohol','Water','Juice','Cocktails','Bring Your Own (Charges Apply)','Bride/Groom Car','VIP Cars','Guest Shuttles','None','MC','DJ','LED & Premium Decor','External Decor (Approval required)','Live Cooking Station','Dessert Table','Security Enhancement','Generators Backup','Photography','Videography','LED Screen','Sound System Upgrade'
                          ].map((x) => (
                            <label key={x} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><input name="services" type="checkbox" value={x} /> {x}</label>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">E. Payment Details</p>
                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                          <input name="total_amount" className={inputClass()} placeholder="Total Amount (Jumla): TZS" />
                          <input name="deposit_40" className={inputClass()} placeholder="Deposit Required (40%): TZS" />
                          <input name="deposit_date" className={inputClass()} placeholder="Date Deposit Paid" />
                          <input name="remaining_balance" className={inputClass()} placeholder="Remaining Balance: TZS" />
                        </div>
                        <div className="mt-2 grid gap-2 md:grid-cols-3 text-sm">
                          {['Cash', 'MPESA', 'Bank Transfer'].map((x) => (
                            <label key={x} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><input name="payment_method" type="checkbox" value={x} /> {x}</label>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-2">
                        <input name="client_signature" className={inputClass()} placeholder="Client Signature" />
                        <input name="client_name_signed" className={inputClass()} placeholder="Client Name" />
                        <input name="company_rep" className={inputClass()} placeholder="Company Representative" />
                        <input name="company_date" className={inputClass()} placeholder="Date" />
                      </div>
                    </>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}

          {user?.role === 'accountant' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Accountant Cash Request Queue</p>
              <p className="mt-1 text-sm text-slate-600">
                Review cash request forms and forward approved requests to Managing Director.
              </p>
              <div className="mt-3 space-y-3">
                {pendingForController.length === 0 ? (
                  <p className="text-sm text-slate-500">No pending cash request forms.</p>
                ) : (
                  pendingForController.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="font-semibold text-slate-900">
                        {ROLE_LABELS[entry.submittedByRole]} | {new Date(entry.submittedAt).toLocaleString()}
                      </p>
                      <p className="text-slate-600">Requested: TZS {entry.fields.total_requested ?? '0'}</p>
                      <p className="text-slate-600">Requester: {entry.fields.full_name ?? '-'}</p>
                      <p className="text-slate-500">Details: {entry.fields.requester_declaration ?? '-'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          className={inputClass('h-9 w-[320px]')}
                          placeholder="Accountant comment"
                          value={accountantComment[entry.id] ?? ''}
                          onChange={(event) => setAccountantComment((prev) => ({ ...prev, [entry.id]: event.target.value }))}
                        />
                        <Button size="sm" onClick={() => void handleControllerCashDecision(entry.id, 'approve')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void handleControllerCashDecision(entry.id, 'decline')}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {user?.role === 'manager' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Managing Director Cash Request Decisions</p>
              <p className="mt-1 text-sm text-slate-600">
                Review accountant-forwarded cash requests and approve or decline with reason.
              </p>
              <div className="mt-3 space-y-3">
                {pendingForManager.length === 0 ? (
                  <p className="text-sm text-slate-500">No cash requests waiting for Managing Director.</p>
                ) : (
                  pendingForManager.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="font-semibold text-slate-900">
                        {ROLE_LABELS[entry.submittedByRole]} | {new Date(entry.submittedAt).toLocaleString()}
                      </p>
                      <p className="text-slate-600">Requested: TZS {entry.fields.total_requested ?? '0'}</p>
                      <p className="text-slate-600">Requester: {entry.fields.full_name ?? '-'}</p>
                      <p className="text-slate-500">Accountant note: {entry.reviewComment ?? '-'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          className={inputClass('h-9 w-[320px]')}
                          placeholder="Reason (required)"
                          value={managerComment[entry.id] ?? ''}
                          onChange={(event) => setManagerComment((prev) => ({ ...prev, [entry.id]: event.target.value }))}
                        />
                        <Button size="sm" onClick={() => void handleManagerCashDecision(entry.id, 'approve')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void handleManagerCashDecision(entry.id, 'decline')}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {user?.role === 'manager' ? null : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live Output (Read-only)</p>
            <p className="mt-1 text-sm text-slate-600">
              You only see completed outputs from other roles here. Editing is not available.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <select
                className={inputClass()}
                value={outputFormFilter}
                onChange={(event) => setOutputFormFilter(event.target.value as 'all' | FormId)}
              >
                <option value="all">All Forms</option>
                {manualForms.map((form) => (
                  <option key={form.id} value={form.id}>{form.title}</option>
                ))}
              </select>
              <input
                type="date"
                className={inputClass()}
                value={outputDateFrom}
                onChange={(event) => setOutputDateFrom(event.target.value)}
              />
              <input
                type="date"
                className={inputClass()}
                value={outputDateTo}
                onChange={(event) => setOutputDateTo(event.target.value)}
              />
            </div>
            <div className="mt-3 space-y-3">
              {filteredExternalOutputs.length === 0 ? (
                <p className="text-sm text-slate-500">No submitted outputs from other users yet.</p>
              ) : (
                filteredExternalOutputs.slice(0, 30).map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{entry.formTitle}</p>
                    <p className="text-xs text-slate-600">
                      {new Date(entry.submittedAt).toLocaleString()} | {ROLE_LABELS[entry.submittedByRole]}
                    </p>
                    <div className="mt-2 grid gap-1 text-xs text-slate-700 md:grid-cols-2">
                      {Object.entries(entry.fields).slice(0, 8).map(([key, value]) => (
                        <p key={key}><span className="font-semibold">{key.replace(/_/g, ' ')}:</span> {value}</p>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>
          )}

          {myRole ? null : (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Sign in to fill role-assigned forms.
            </div>
          )}
        </div>
      }
    />
  );
}



