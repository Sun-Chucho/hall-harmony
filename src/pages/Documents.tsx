import { FormEvent, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { confirmAction } from '@/lib/confirmAction';
import { sanitizeFirestoreData } from '@/lib/firestoreData';
import { db } from '@/lib/firebase';
import { getTrimmedFormFields } from '@/lib/formFields';
import { DOCUMENT_OUTPUTS_COLLECTION } from '@/lib/requestWorkflows';
import { getFirestoreWriteErrorMessage } from '@/lib/firestoreWriteErrors';
import { UserRole } from '@/types/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

type FormId = 'lpo' | 'delivery_note' | 'grn' | 'stores_ledger' | 'tax_invoice' | 'petty_cash' | 'hall_registration';

interface ManualForm {
  id: FormId;
  title: string;
  roles: UserRole[];
}

const MANUAL_FORMS: ManualForm[] = [
  { id: 'lpo', title: 'Local Purchase Order', roles: ['accountant'] },
  { id: 'delivery_note', title: 'Delivery Note', roles: ['accountant', 'store_keeper'] },
  { id: 'grn', title: 'Goods Received Note (GRN)', roles: ['accountant', 'store_keeper'] },
  { id: 'stores_ledger', title: 'Stores Ledger Book', roles: ['accountant', 'store_keeper'] },
  { id: 'tax_invoice', title: 'Tax Invoice', roles: ['accountant', 'cashier_1'] },
  { id: 'petty_cash', title: 'Petty Cash Voucher', roles: ['accountant', 'cashier_1', 'manager'] },
  { id: 'hall_registration', title: 'Hall Registration Form', roles: ['cashier_1', 'manager'] },
];

function inputClass(extra = '') {
  return `h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm ${extra}`;
}

export default function Documents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savingFormId, setSavingFormId] = useState<FormId | null>(null);

  const allowedForms = useMemo(
    () => MANUAL_FORMS.filter((form) => user && form.roles.includes(user.role)),
    [user],
  );

  const saveOutput = async (formId: FormId, formTitle: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || savingFormId) return;
    if (!confirmAction(`Save ${formTitle}?`)) return;
    const formElement = event.currentTarget;
    const fields = getTrimmedFormFields(formElement);
    setSavingFormId(formId);

    try {
      await addDoc(collection(db, DOCUMENT_OUTPUTS_COLLECTION), sanitizeFirestoreData({
        formId,
        formTitle,
        submittedAt: new Date().toISOString(),
        submittedBy: user.id,
        submittedByRole: user.role,
        fields,
        updatedAt: serverTimestamp(),
      }));
      formElement.reset();
      toast({
        title: `${formTitle} saved`,
        description: 'Document output recorded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: getFirestoreWriteErrorMessage(error, {
          fallback: `Unable to save ${formTitle.toLowerCase()} right now.`,
          permissionDenied: `Backend rejected the ${formTitle.toLowerCase()} save. Please sign in again and retry.`,
        }),
        variant: 'destructive',
      });
    } finally {
      setSavingFormId((current) => (current === formId ? null : current));
    }
  };

  if (!user) return null;

  return (
    <ManagementPageTemplate
      pageTitle="Documents"
      subtitle="Manual document forms that still belong in the document register."
      stats={[
        { title: 'Available Forms', value: `${allowedForms.length}`, description: 'document forms assigned to your role' },
      ]}
      sections={[]}
      action={
        allowedForms.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            There are no document forms assigned to this role.
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <Tabs defaultValue={allowedForms[0].id} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                {allowedForms.map((form) => (
                  <TabsTrigger key={form.id} value={form.id}>{form.title}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="lpo">
                <form className="space-y-4" onSubmit={(event) => void saveOutput('lpo', 'Local Purchase Order', event)}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="supplier_name" className={inputClass()} placeholder="Supplier Name" />
                    <input name="date" className={inputClass()} placeholder="Date" />
                    <input name="contact_no" className={inputClass()} placeholder="Contact No" />
                    <input name="email" className={inputClass()} placeholder="Email" />
                    <input name="address" className={inputClass('md:col-span-2')} placeholder="Address" />
                    <input name="total" className={inputClass()} placeholder="Total Amount" />
                    <input name="payment_type" className={inputClass()} placeholder="Payment Type" />
                  </div>
                  <Button type="submit" disabled={savingFormId !== null}>{savingFormId === 'lpo' ? 'Saving...' : 'Save LPO'}</Button>
                </form>
              </TabsContent>

              <TabsContent value="delivery_note">
                <form className="space-y-4" onSubmit={(event) => void saveOutput('delivery_note', 'Delivery Note', event)}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="to" className={inputClass()} placeholder="To" />
                    <input name="order_number" className={inputClass()} placeholder="Order Number" />
                    <input name="address" className={inputClass()} placeholder="Address" />
                    <input name="invoice_number" className={inputClass()} placeholder="Invoice Number" />
                    <input name="shipping_date" className={inputClass()} placeholder="Shipping Date" />
                    <input name="contact_person" className={inputClass()} placeholder="Contact Person" />
                  </div>
                  <Button type="submit" disabled={savingFormId !== null}>{savingFormId === 'delivery_note' ? 'Saving...' : 'Save Delivery Note'}</Button>
                </form>
              </TabsContent>

              <TabsContent value="grn">
                <form className="space-y-4" onSubmit={(event) => void saveOutput('grn', 'Goods Received Note (GRN)', event)}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="grn_number" className={inputClass()} placeholder="GRN Number" />
                    <input name="date" className={inputClass()} placeholder="Date" />
                    <input name="delivery_note_number" className={inputClass()} placeholder="Delivery Note Number" />
                    <input name="supplier_name" className={inputClass()} placeholder="Supplier Name" />
                    <input name="received_by" className={inputClass()} placeholder="Received By" />
                    <input name="receiving_department" className={inputClass()} placeholder="Receiving Department" />
                  </div>
                  <Button type="submit" disabled={savingFormId !== null}>{savingFormId === 'grn' ? 'Saving...' : 'Save GRN'}</Button>
                </form>
              </TabsContent>

              <TabsContent value="stores_ledger">
                <form className="space-y-4" onSubmit={(event) => void saveOutput('stores_ledger', 'Stores Ledger Book', event)}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="date" className={inputClass()} placeholder="Date" />
                    <input name="grn_no" className={inputClass()} placeholder="GRN No" />
                    <input name="qty_in" className={inputClass()} placeholder="Qty In" />
                    <input name="qty_out" className={inputClass()} placeholder="Qty Out" />
                    <input name="balance" className={inputClass()} placeholder="Balance" />
                    <input name="remarks" className={inputClass()} placeholder="Remarks" />
                  </div>
                  <Button type="submit" disabled={savingFormId !== null}>{savingFormId === 'stores_ledger' ? 'Saving...' : 'Save Stores Ledger'}</Button>
                </form>
              </TabsContent>

              <TabsContent value="tax_invoice">
                <form className="space-y-4" onSubmit={(event) => void saveOutput('tax_invoice', 'Tax Invoice', event)}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="invoice_number" className={inputClass()} placeholder="Invoice Number" />
                    <input name="date" className={inputClass()} placeholder="Date" />
                    <input name="bill_to" className={inputClass()} placeholder="Bill To" />
                    <input name="for" className={inputClass()} placeholder="For" />
                    <input name="amount" className={inputClass()} placeholder="Amount" />
                    <input name="vat" className={inputClass()} placeholder="VAT" />
                  </div>
                  <textarea name="item_description" className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Item Description" />
                  <Button type="submit" disabled={savingFormId !== null}>{savingFormId === 'tax_invoice' ? 'Saving...' : 'Save Tax Invoice'}</Button>
                </form>
              </TabsContent>

              <TabsContent value="petty_cash">
                <form className="space-y-4" onSubmit={(event) => void saveOutput('petty_cash', 'Petty Cash Voucher', event)}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="date" className={inputClass()} placeholder="Date" />
                    <input name="voucher_no" className={inputClass()} placeholder="Voucher Number" />
                    <input name="description" className={inputClass()} placeholder="Description" />
                    <input name="department" className={inputClass()} placeholder="Department" />
                    <input name="amount" className={inputClass()} placeholder="Amount" />
                    <input name="approved_by" className={inputClass()} placeholder="Approved By" />
                  </div>
                  <Button type="submit" disabled={savingFormId !== null}>{savingFormId === 'petty_cash' ? 'Saving...' : 'Save Petty Cash Voucher'}</Button>
                </form>
              </TabsContent>

              <TabsContent value="hall_registration">
                <form className="space-y-4" onSubmit={(event) => void saveOutput('hall_registration', 'Hall Registration Form', event)}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="booking_date" className={inputClass()} placeholder="Booking Date" />
                    <input name="client_name" className={inputClass()} placeholder="Client Name" />
                    <input name="phone" className={inputClass()} placeholder="Phone" />
                    <input name="hall_selection" className={inputClass()} placeholder="Hall Selection" />
                    <input name="event_type" className={inputClass()} placeholder="Event Type" />
                    <input name="total_amount" className={inputClass()} placeholder="Total Amount" />
                  </div>
                  <Button type="submit" disabled={savingFormId !== null}>{savingFormId === 'hall_registration' ? 'Saving...' : 'Save Hall Registration'}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )
      }
    />
  );
}
