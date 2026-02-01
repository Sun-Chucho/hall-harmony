import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const reportStats = [
  { title: 'Monthly Insights', value: 'Revenue vs target', description: 'tracked every 30 days' },
  { title: 'Bookings Trend', value: 'Up 8%', description: 'year-over-year momentum' },
  { title: 'Customer Health', value: '93% repeat', description: 'repeat bookings & referrals' },
  { title: 'Finance Snapshot', value: '2 audits', description: 'scheduled this quarter' },
];

const reportSections = [
  {
    title: 'Report Cadence',
    bullets: [
      'Weekly scorecards highlight capacity and approvals.',
      'Monthly finance reports roll up payments, cash movement, and profits.',
      'Executive briefs summarize customer feedback and operations notes.',
    ],
  },
  {
    title: 'Distribution',
    bullets: [
      'Dashboards share via internal portal and email summaries.',
      'Management archive copies the final PDF in the documents library.',
      'Ad-hoc slices can be exported when auditors or partners request them.',
    ],
  },
];

export default function Reports() {
  return (
    <ManagementPageTemplate
      pageTitle="Reports"
      subtitle="Summaries and exports for finance, bookings, and operations."
      stats={reportStats}
      sections={reportSections}
    />
  );
}
