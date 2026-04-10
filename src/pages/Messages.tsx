import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';

export default function Messages() {
  const { user } = useAuth();
  const { messages, unreadCount, markMessageRead } = useMessages();

  if (!user) return null;

  return (
    <DashboardLayout title="Messages">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
            <p className="text-sm text-slate-600">
              Request updates, approvals, and payment notifications are delivered here automatically.
            </p>
          </div>
          <Badge className={unreadCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}>
            {unreadCount} unread
          </Badge>
        </div>

        {messages.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No messages yet.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((entry) => (
              <div key={entry.id} className={`rounded-2xl border bg-white p-4 ${entry.read ? 'border-slate-200' : 'border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.18)]'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{entry.title}</p>
                    <Badge className={entry.source === 'manager_alert' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'}>
                      {entry.source === 'manager_alert' ? 'Manager Alert' : 'Notification'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.decision ? (
                      <Badge className={entry.decision === 'approve' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                        {entry.decision}
                      </Badge>
                    ) : null}
                    <Badge className={entry.read ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'}>
                      {entry.read ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-700">{entry.body}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    {entry.fromRole ? `From ${entry.fromRole}` : 'System update'} | {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  {!entry.read ? (
                    <Button size="sm" variant="outline" onClick={() => void markMessageRead(entry.id)}>
                      Mark Read
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
