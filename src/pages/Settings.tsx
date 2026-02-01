import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';

const settingsStats = [
  { title: 'Active Roles', value: '6 roles', description: 'hall manager, assistant, cashier, etc.' },
  { title: 'Notification Channels', value: 'Email · SMS · In-app', description: 'kept in sync' },
  { title: 'Access Rules', value: 'Role-based', description: 'granular control over each page' },
  { title: 'Audit Logs', value: 'Continuous', description: 'changes tracked across the system' },
];

const settingsSections = [
  {
    title: 'Configuration Areas',
    bullets: [
      'Permissions define who sees Finance, Operations, and Admin menus.',
      'Notification templates cover approval prompts, invoices, and reminders.',
      'Localisation tweaks (timezone, currency, language) tailor the portal.',
    ],
  },
  {
    title: 'Security Notes',
    bullets: [
      'Every login request is audited in the security log.',
      'Settings exports support internal reviews and compliance checks.',
      'Managers can temporarily disable users or reset MFA tokens.',
    ],
  },
];

export default function Settings() {
  return (
    <ManagementPageTemplate
      pageTitle="Settings"
      subtitle="Configure access, notifications, and security for the management system."
      stats={settingsStats}
      sections={settingsSections}
    />
  );
}
