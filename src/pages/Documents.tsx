import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Documents() {
  return (
    <ManagementPageTemplate
      pageTitle="Documents"
      subtitle="Documents will appear here when production uploads are enabled."
      stats={[]}
      sections={[]}
      action={
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No documents yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              This section is intentionally empty until real document records are uploaded.
            </p>
          </CardContent>
        </Card>
      }
    />
  );
}
