import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const customerStats = [
  { title: 'Total Profiles', value: '128 people', description: 'verified account holders' },
  { title: 'VIP Hosts', value: '12 families', description: 'priority concierge access' },
  { title: 'New Inquiries', value: '6 this week', description: 'from the web portal' },
  { title: 'Repeat Rate', value: '93%', description: 'clients booking again within 12 months' },
];

const customerSections = [
  {
    title: 'Engagement Channels',
    bullets: [
      'Web portal captures standardized contact and event preferences.',
      'Lead follow-ups happen via WhatsApp Business and direct calls.',
      'Customers receive status updates when approvals or invoices change.',
    ],
  },
  {
    title: 'Support Streams',
    bullets: [
      'Concierge chat links directly to the hall manager and assistant desk.',
      'A shared Slack space holds intake notes, contracts, and special requirements.',
      'Feedback forms are triggered seven days after every event wrap-up.',
    ],
  },
];

export default function Customers() {
  return (
    <ManagementPageTemplate
      pageTitle="Customers"
      subtitle="Understand demand, nurture relationships, and keep every party informed."
      stats={customerStats}
      sections={customerSections}
    />
  );
}
