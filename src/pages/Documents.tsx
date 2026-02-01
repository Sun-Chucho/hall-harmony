import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const documentStats = [
  { title: 'Active Agreements', value: '32 contracts', description: 'covering current bookings' },
  { title: 'Pending Signatures', value: '5 approvals', description: 'awaiting client initials' },
  { title: 'Uploaded Assets', value: '173 uploads', description: 'layouts, menus, and stage plans' },
  { title: 'Audit Access', value: 'Role-based', description: 'pixels and passwords protect each file' },
];

const documentSections = [
  {
    title: 'Document Types',
    bullets: [
      'Standard booking agreements locked to the original quote.',
      'Finance uploads receipts, deposit confirmations, and ledger exports.',
      'Operations keeps venue layouts, floorplans, and compliance checklists ready.',
    ],
  },
  {
    title: 'Compliance Notes',
    bullets: [
      'Every document change inherits an audit trail for sign-offs.',
      'Managers can lock or recall files for revisions.',
      'Key files replicate to the central archive for backup and legal review.',
    ],
  },
];

export default function Documents() {
  return (
    <ManagementPageTemplate
      pageTitle="Documents"
      subtitle="Central storage for contracts, approvals, and compliance records."
      stats={documentStats}
      sections={documentSections}
    />
  );
}
