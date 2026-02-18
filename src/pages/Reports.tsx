import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Reports() {
  return (
    <ManagementPageTemplate
      pageTitle="Reports"
      subtitle="Reports will appear here once production reporting pipelines are active."
      stats={[]}
      sections={[]}
      action={
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No reports yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              This section is intentionally empty until real report data is generated.
            </p>
          </CardContent>
        </Card>
      }
    />
  );
}
