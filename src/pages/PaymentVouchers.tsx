import { useEffect, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { useAuth } from '@/contexts/AuthContext';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ROLE_LABELS, UserRole } from '@/types/auth';

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
}

const DOCUMENT_OUTPUTS_COLLECTION = 'document_form_outputs';
const DOCUMENT_OUTPUTS_CACHE_KEY = 'kuringe_documents_form_outputs_v1';

export default function PaymentVouchers() {
  const { user } = useAuth();
  const [outputs, setOutputs] = useState<FormSubmission[]>([]);

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

  const allPaymentVoucherOutputs = outputs
    .filter((entry) => entry.formId === 'payment_voucher')
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  if (!user || user.role !== 'accountant') {
    return (
      <ManagementPageTemplate
        pageTitle="Payment Vouchers"
        subtitle="Access Restricted"
        stats={[]}
        sections={[]}
        action={
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            You do not have permission to view the payment voucher register.
          </div>
        }
      />
    );
  }

  return (
    <ManagementPageTemplate
      pageTitle="Payment Vouchers Register"
      subtitle="View-only table of all distributed payment vouchers recorded by Cashiers."
      stats={[
        { title: 'Total Vouchers', value: String(allPaymentVoucherOutputs.length), description: 'recorded till date' },
      ]}
      sections={[]}
      action={
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Accountant Payment Voucher Register</p>
            <p className="mt-1 text-sm text-slate-600">
              Accountant-facing list of all recorded payment vouchers.
            </p>
            <div className="mt-3 space-y-3">
              {allPaymentVoucherOutputs.length === 0 ? (
                <p className="text-sm text-slate-500">No payment vouchers recorded yet.</p>
              ) : (
                allPaymentVoucherOutputs.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {entry.fields.voucher_number ?? '-'} | {entry.fields.payee_name ?? '-'}
                      </p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {ROLE_LABELS[entry.submittedByRole]}
                      </span>
                    </div>
                    <p className="text-slate-600">Amount: TZS {entry.fields.amount ?? '-'}</p>
                    <p className="text-slate-600">Request No: {entry.fields.request_number ?? '-'}</p>
                    <p className="text-slate-500">Description: {entry.fields.description ?? '-'}</p>
                    <p className="text-slate-500">Saved: {new Date(entry.submittedAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
