import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const movementStats = [
  { title: 'Pending Movements', value: '2', description: 'awaiting approval' },
  { title: "Today's Deposits", value: '1', description: 'bank deposits made' },
  { title: 'Till Balance', value: 'TSh 850,000', description: 'current cash in till' },
  { title: 'Safe Balance', value: 'TSh 4,200,000', description: 'current cash in safe' },
];

const movementSections = [
  {
    title: 'Controls & Oversight',
    bullets: [
      'Cash movement authorizations require sign-off from the hall manager and Cashier 2.',
      'All physical transfers are logged with timestamps, amounts, and witnesses.',
      'Daily vault counts and deposit slips are attached to the digital register.',
    ],
  },
  {
    title: 'Cashier 2 Responsibilities',
    bullets: [
      'Coordinate bank deposits and vault replenishments.',
      'Track petty cash disbursements for supplies, rentals, and emergency needs.',
      'Confirm that every withdrawal is backed by an approved journal note.',
    ],
  },
];

export default function CashMovement() {
  return (
    <ManagementPageTemplate
      pageTitle="Cash Movement"
      subtitle="Back-office control over deposits, vaults, and float balances."
      stats={movementStats}
      sections={movementSections}
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
