import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error';

export interface IntegrationStatusProps {
  status: ConnectionStatus;
  className?: string;
}

const statusConfig = {
  connected: {
    label: 'Connected',
    icon: CheckCircle2,
    dotClass: 'bg-green-500',
    textClass: 'text-green-600 dark:text-green-400',
  },
  disconnected: {
    label: 'Not connected',
    icon: XCircle,
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-600 dark:text-gray-400',
  },
  expired: {
    label: 'Expired',
    icon: Clock,
    dotClass: 'bg-yellow-500',
    textClass: 'text-yellow-600 dark:text-yellow-400',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    dotClass: 'bg-red-500',
    textClass: 'text-red-600 dark:text-red-400',
  },
};

export function IntegrationStatus({ status, className }: IntegrationStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('h-2 w-2 rounded-full', config.dotClass)} />
      <span className={cn('text-xs font-medium', config.textClass)}>
        {config.label}
      </span>
    </div>
  );
}
