import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Services() {
  return (
    <ManagementPageTemplate
      pageTitle="Services & Pricing"
      subtitle="Services and pricing records will appear when production data is available."
      stats={[]}
      sections={[]}
      action={
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No services data yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              This section is intentionally empty until real services and pricing records are published.
            </p>
          </CardContent>
        </Card>
      }
    />
  );
}
