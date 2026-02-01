import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const servicesStats = [
  { title: 'Decor Packages', value: '7 curated sets', description: 'with tiered pricing' },
  { title: 'Food & Beverage', value: 'In-house & partners', description: 'buffet, plated & cocktail setups' },
  { title: 'AV & Tech Crew', value: '3 crews', description: 'lighting, sound, and streaming ready' },
  { title: 'Custom Requests', value: '100% accommodated', description: 'we build around client briefs' },
];

const servicesSections = [
  {
    title: 'What We Offer',
    bullets: [
      'Decor packages span minimalist, lush florals, and branded conference stages.',
      'Beverage menu includes mocktails, cocktails, premium mixers, and baristas.',
      'Catering partners deliver street-style platters, plated dinners, and afternoon teas.',
    ],
  },
  {
    title: 'Customization Workflow',
    bullets: [
      'Service coordinators confirm guest counts and dietary needs 14 days before events.',
      'Special equipment (LED walls, draping, pyrotechnics) requires site sign-off.',
      'All add-ons are tied to package approvals to keep totals transparent.',
    ],
  },
];

export default function Services() {
  return (
    <ManagementPageTemplate
      pageTitle="Services & Pricing"
      subtitle="Packages, add-ons, and workflows that keep hall operations consistent."
      stats={servicesStats}
      sections={servicesSections}
    />
  );
}
