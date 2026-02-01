import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const portalStats = [
  { title: 'Web Visits', value: '324 this week', description: 'tracking online interest' },
  { title: 'Bookings via Portal', value: '8 confirmed', description: 'self-service reservations' },
  { title: 'Support Tickets', value: '4 open', description: 'handled by concierge' },
  { title: 'Live Catalog', value: '3 halls', description: 'always up-to-date availability' },
];

const portalSections = [
  {
    title: 'Portal Highlights',
    bullets: [
      'Customers can review availability, packages, and deposits.',
      'Status badges show events awaiting approval, payment, or setup.',
      'Team members update pricing, menus, and décor without redeploying.',
    ],
  },
  {
    title: 'Collaboration Notes',
    bullets: [
      'Assistant desk reviews incoming inquiries before handing them to bookings.',
      'Notifications ping managers when approvals or receipts are posted.',
      'Portal exports lead lists for marketing outreach and promotions.',
    ],
  },
];

export default function Portal() {
  return (
    <ManagementPageTemplate
      pageTitle="Web Portal"
      subtitle="Customer-facing gateway that feeds the management system."
      stats={portalStats}
      sections={portalSections}
    />
  );
}
