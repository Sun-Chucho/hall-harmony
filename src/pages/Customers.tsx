import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Customers() {
  return (
    <ManagementPageTemplate
      pageTitle="Customers"
      subtitle="Customer records will appear here once the website and intake flow are live."
      stats={[]}
      sections={[]}
      action={
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No customer data yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              The customer directory is intentionally empty until production data collection starts.
            </p>
          </CardContent>
        </Card>
      }
    />
  );
}
