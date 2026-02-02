import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ManagementStat {
  title: string;
  value: string;
  description?: string;
}

export interface ManagementSection {
  title: string;
  bullets: string[];
}

interface ManagementPageTemplateProps {
  pageTitle: string;
  subtitle?: string;
  stats: ManagementStat[];
  sections?: ManagementSection[];
  action?: ReactNode;
}

export function ManagementPageTemplate({
  pageTitle,
  subtitle,
  stats,
  sections,
  action,
}: ManagementPageTemplateProps) {
  return (
    <DashboardLayout title={pageTitle}>
      <div className="space-y-6 text-slate-900">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Management System</p>
          <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-semibold text-slate-900">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                {stat.description && <p className="text-xs text-slate-600">{stat.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {sections?.length ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.title} className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold text-slate-900">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {section.bullets.map((bullet) => (
                      <li className="flex items-start gap-2" key={bullet}>
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {action && <div className="text-slate-900">{action}</div>}
      </div>
    </DashboardLayout>
  );
}
