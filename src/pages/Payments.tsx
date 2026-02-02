import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const paymentStats = [
  { title: "Today's Payments", value: '4 payments', description: 'payments recorded' },
  { title: 'Pending Receipts', value: '2 to be printed', description: 'awaiting print and signatures' },
  { title: 'Total Received', value: 'TSh 3,500,000', description: "today's collections" },
  { title: 'Awaiting Approval', value: '3 payments', description: 'payments pending manager clearance' },
];

const paymentSections = [
  {
    title: 'Controls & Compliance',
    bullets: [
      'Every payment passes through the cashier two–tier review before posting to the ledger.',
      'Manager approvals are required for amounts above TSh 3,000,000 or for disputed invoices.',
      'Daily closeouts reconcile cash, floats, and mobile receipts against the portal ledger.',
    ],
  },
  {
    title: 'Cashier 1 Responsibilities',
    bullets: [
      'Record payments, issue receipts, and flag missing documents.',
      'Schedule customer follow-ups for partial or deferred payments.',
      'Assist finance with bank reconciliation slips each evening.',
    ],
  },
];

export default function Payments() {
  return (
    <ManagementPageTemplate
      pageTitle="Payments"
      subtitle="Monitor receipts, fulfillment status, and compliance for every payment."
      stats={paymentStats}
      sections={paymentSections}
      action={
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Recent Bookings</p>
            <p className="mt-1 text-base font-semibold text-slate-900">Latest booking activity</p>
            <p className="text-sm text-slate-600 mt-2">
              Booking data will appear here once you start creating bookings.
            </p>
          </div>
        </div>
      }
    />
  );
}
