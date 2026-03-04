import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalLevel, ApprovalModule } from '@/lib/authorization';
import { confirmAction } from '@/lib/confirmAction';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const approvalLevels: ApprovalLevel[] = ['minor', 'money', 'final'];
const approvalModules: ApprovalModule[] = [
  'booking',
  'event',
  'payment',
  'refund',
  'purchase',
  'allocation',
  'fund_transfer',
];

export default function AdminConsole() {
  const { user } = useAuth();
  const {
    policy,
    approvals,
    auditLog,
    createApprovalRequest,
    reviewApproval,
    overrideApproval,
    setTransactionsFrozen,
  } = useAuthorization();
  const [freezeReason, setFreezeReason] = useState(policy.freezeReason);
  const [decisionComment, setDecisionComment] = useState('');
  const [requestForm, setRequestForm] = useState({
    level: 'minor' as ApprovalLevel,
    module: 'booking' as ApprovalModule,
    title: '',
    description: '',
    targetReference: '',
    amount: '',
  });
  const [statusMessage, setStatusMessage] = useState('');

  const summary = useMemo(() => {
    return {
      total: approvals.length,
      pending: approvals.filter((item) => item.status === 'pending').length,
      finalLevel: approvals.filter((item) => item.level === 'final').length,
      blocked: policy.transactionsFrozen ? 'Frozen' : 'Active',
    };
  }, [approvals, policy.transactionsFrozen]);

  const handleFreezeToggle = () => {
    if (!confirmAction(policy.transactionsFrozen ? 'Are you sure you want to resume transactions?' : 'Are you sure you want to freeze transactions?')) return;
    const response = setTransactionsFrozen(!policy.transactionsFrozen, freezeReason);
    setStatusMessage(response.message);
  };

  const handleCreateRequest = () => {
    if (!confirmAction('Are you sure you want to submit this approval request?')) return;
    if (!requestForm.title || !requestForm.description || !requestForm.targetReference) {
      setStatusMessage('Title, description, and reference are required.');
      return;
    }
    const amount = requestForm.amount.trim() ? Number(requestForm.amount) : undefined;
    const response = createApprovalRequest({
      level: requestForm.level,
      module: requestForm.module,
      title: requestForm.title,
      description: requestForm.description,
      targetReference: requestForm.targetReference,
      amount: Number.isNaN(amount) ? undefined : amount,
    });
    setStatusMessage(response.message);
    if (response.ok) {
      setRequestForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        targetReference: '',
        amount: '',
      }));
    }
  };

  const handleDecision = (requestId: string, decision: 'approved' | 'rejected') => {
    if (!confirmAction(`Are you sure you want to ${decision} this request?`)) return;
    const response = reviewApproval(requestId, decision, decisionComment);
    setStatusMessage(response.message);
  };

  const handleOverride = (requestId: string, decision: 'approved' | 'rejected') => {
    if (!confirmAction(`Are you sure you want to override this request as ${decision}?`)) return;
    const response = overrideApproval(requestId, decision, decisionComment || 'Override by controller');
    setStatusMessage(response.message);
  };

  if (!user) return null;

  return (
    <DashboardLayout title="Controller Console">
      <div className="space-y-6 text-slate-900">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Authorization</p>
          <h1 className="text-3xl font-bold">Controller approvals and policy controls</h1>
          <p className="text-sm text-slate-600">
            Final approval authority, workflow overrides, and transaction freeze controls.
          </p>
        </div>

        {statusMessage ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Approvals</p>
              <p className="mt-2 text-2xl font-bold">{summary.total}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-bold">{summary.pending}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Final Level</p>
              <p className="mt-2 text-2xl font-bold">{summary.finalLevel}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Transactions</p>
              <p className="mt-2 text-2xl font-bold">{summary.blocked}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Transaction Freeze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                Freeze blocks transactional actions for all roles except controller.
              </p>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Reason for freeze or resume note"
                value={freezeReason}
                onChange={(event) => setFreezeReason(event.target.value)}
              />
              <Button onClick={handleFreezeToggle}>
                {policy.transactionsFrozen ? 'Resume Transactions' : 'Freeze Transactions'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Create Approval Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                <select
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={requestForm.level}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, level: event.target.value as ApprovalLevel }))}
                >
                  {approvalLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={requestForm.module}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, module: event.target.value as ApprovalModule }))}
                >
                  {approvalModules.map((moduleName) => (
                    <option key={moduleName} value={moduleName}>
                      {moduleName}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Title"
                value={requestForm.title}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Reference (e.g. EVT-102)"
                value={requestForm.targetReference}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, targetReference: event.target.value }))}
              />
              <input
                type="number"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Amount (optional)"
                value={requestForm.amount}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
              <textarea
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                rows={3}
                placeholder="Description"
                value={requestForm.description}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <Button onClick={handleCreateRequest}>Submit Request</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Approval Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Decision note or override note"
              value={decisionComment}
              onChange={(event) => setDecisionComment(event.target.value)}
            />
            {approvals.length === 0 ? (
              <p className="text-sm text-slate-600">No approvals yet.</p>
            ) : (
              approvals.map((request) => (
                <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{request.title}</p>
                    <div className="flex gap-2">
                      <Badge className="bg-slate-200 text-slate-900">{request.level}</Badge>
                      <Badge className="bg-slate-200 text-slate-900">{request.status}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{request.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ref: {request.targetReference} • Module: {request.module} • Requested by: {request.requestedByRole}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleDecision(request.id, 'approved')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecision(request.id, 'rejected')}>
                      Reject
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleOverride(request.id, 'approved')}>
                      Override Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleOverride(request.id, 'rejected')}>
                      Override Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Authorization Audit Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditLog.length === 0 ? (
              <p className="text-sm text-slate-600">No audit events yet.</p>
            ) : (
              auditLog.slice(0, 20).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{entry.action}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(entry.timestamp).toLocaleString()} • {entry.actorRole} • {entry.module}
                  </p>
                  <p className="text-sm text-slate-600">{entry.detail}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
