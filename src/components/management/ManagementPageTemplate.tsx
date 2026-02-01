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
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Management System</p>
          <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
          <p className="text-sm text-white/70">{subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-white/10 bg-white/5">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-semibold text-white">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                {stat.description && <p className="text-xs text-white/70">{stat.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {sections?.length ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.title} className="border-white/10 bg-white/5">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold text-white">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-white/80">
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

        {action && <div>{action}</div>}
      </div>
    </DashboardLayout>
  );
}
