import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const rentalStats = [
  { title: 'Vehicles Ready', value: '4 SUVs', description: 'transport & logistics' },
  { title: 'Equipment Kits', value: '20+ sets', description: 'tents, furniture, staging' },
  { title: 'Rental Bookings', value: '18 this month', description: 'included in event plans' },
  { title: 'Manager Sign-off', value: 'required', description: 'before any external hire' },
];

const rentalSections = [
  {
    title: 'Rental Options',
    bullets: [
      'Guest shuttles, VIP transfers, and crew transport from the fleet.',
      'A la carte décor, furniture layering, lighting rigs, and backyard tents.',
      'Audio visual equipment and presentation gear for conferences and webcasts.',
    ],
  },
  {
    title: 'Execution Notes',
    bullets: [
      'Rental fees are bundled into quotes and cleared during approvals.',
      'Drivers and crew are scheduled through the operations desk.',
      'Return inspections and damage waivers keep the inventory healthy.',
    ],
  },
];

export default function Rentals() {
  return (
    <ManagementPageTemplate
      pageTitle="Rentals"
      subtitle="Manage transport, décor rentals, and logistical extras for every event."
      stats={rentalStats}
      sections={rentalSections}
    />
  );
}
