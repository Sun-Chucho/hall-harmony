import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const bookingsStats = [
  { title: "Today's Bookings", value: '3 events', description: 'scheduled for today' },
  { title: 'Pending Approvals', value: '5 approvals', description: 'awaiting manager review' },
  { title: 'Monthly Revenue', value: 'TSh 15,750,000', description: '+12% from last month' },
  { title: 'Active Customers', value: '47 ongoing', description: 'clients with live bookings' },
];

const bookingsSections = [
  {
    title: 'Event Coverage',
    bullets: [
      'Witness Hall reserved for a multi-day wedding through Sunday evening.',
      'Kilimanjaro Hall is hosting a corporate offsite with hybrid streaming needs.',
      'Garden Deck blocked for an intimate panel and cocktail reception.',
    ],
  },
  {
    title: 'Operations Ready',
    bullets: [
      'Assistant team lining up deposit reminders and contract sign-offs.',
      'Venue setup briefs sent to catering, AV, and décor partners.',
      'Security and parking rosters aligned with each slot.',
    ],
  },
];

export default function Bookings() {
  return (
    <ManagementPageTemplate
      pageTitle="Bookings"
      subtitle="Monitor the day’s schedule, pending approvals, and formation tasks for every hall."
      stats={bookingsStats}
      sections={bookingsSections}
    />
  );
}
