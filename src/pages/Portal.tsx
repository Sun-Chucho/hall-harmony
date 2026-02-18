import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Portal() {
  return (
    <ManagementPageTemplate
      pageTitle="Web Portal"
      subtitle="Portal analytics and submissions will appear when live traffic starts."
      stats={[]}
      sections={[]}
      action={
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No portal data yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              This section is intentionally empty until the public portal generates real records.
            </p>
          </CardContent>
        </Card>
      }
    />
  );
}
