import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";

type ComplianceVerdict = 'approved' | 'rejected' | 'requires_review';

interface ComplianceNoticeProps {
  verdict: ComplianceVerdict;
  reasons?: string[];
  platform?: string;
  checkId?: string;
  className?: string;
  checkedAt?: string;
}

const verdictConfig: Record<ComplianceVerdict, {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  icon: typeof CheckCircle2;
  badgeVariant: 'default' | 'destructive';
}> = {
  approved: {
    title: 'Action approved',
    description: 'This automation complies with platform policy and GDPR constraints.',
    variant: 'default',
    icon: CheckCircle2,
    badgeVariant: 'default',
  },
  requires_review: {
    title: 'Human review required',
    description: 'A human must validate this request before execution continues.',
    variant: 'default',
    icon: Shield,
    badgeVariant: 'default',
  },
  rejected: {
    title: 'Action blocked',
    description: 'The requested action violates compliance rules and was cancelled.',
    variant: 'destructive',
    icon: AlertTriangle,
    badgeVariant: 'destructive',
  },
};

export default function ComplianceNotice({
  verdict,
  reasons = [],
  platform,
  checkId,
  className,
  checkedAt,
}: ComplianceNoticeProps) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;

  return (
    <Alert
      variant={config.variant}
      className={cn(
        'border-l-4',
        verdict === 'approved' && 'border-green-500 bg-green-50 text-green-900',
        verdict === 'requires_review' && 'border-amber-500 bg-amber-50 text-amber-900',
        verdict === 'rejected' && 'border-red-500 bg-red-50 text-red-900',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Icon className={cn('h-5 w-5', verdict === 'approved' && 'text-green-600', verdict === 'requires_review' && 'text-amber-600', verdict === 'rejected' && 'text-red-600')} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <AlertTitle>{config.title}</AlertTitle>
            <Badge variant={config.badgeVariant}>
              {verdict === 'approved' ? 'Approved' : verdict === 'requires_review' ? 'Requires review' : 'Blocked'}
            </Badge>
            {platform && (
              <Badge className="bg-slate-200 text-slate-800">
                {platform.toUpperCase()}
              </Badge>
            )}
          </div>
          <AlertDescription className="space-y-2">
            <p>{config.description}</p>
            {reasons.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            {(checkId || checkedAt) && (
              <p className="text-xs opacity-70">
                {checkId && <>Compliance ID: <code>{checkId}</code>{checkedAt ? ' · ' : ''}</>}
                {checkedAt && `Checked at ${new Date(checkedAt).toLocaleString()}`}
              </p>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
