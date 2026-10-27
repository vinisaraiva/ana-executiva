import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare, FileUp, AlertTriangle } from 'lucide-react';

interface UsageMeterProps {
  tenantId: string;
  type: 'messages' | 'imports';
  className?: string;
  showLabel?: boolean;
}

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  reason?: string;
  message?: string;
}

export function UsageMeter({ tenantId, type, className, showLabel = true }: UsageMeterProps) {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['usage-meter', tenantId, type],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_tenant_limits', {
        _tenant_id: tenantId,
        _limit_type: type,
      });

      if (error) throw error;
      return data as unknown as LimitCheckResult;
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !usage) {
    return null;
  }

  // If no limit is set (unlimited), don't show meter
  if (usage.limit === null) {
    return null;
  }

  const percentage = Math.min((usage.current / usage.limit) * 100, 100);
  const isWarning = percentage >= 50 && percentage < 80;
  const isCritical = percentage >= 80;
  const isBlocked = percentage >= 100;

  const Icon = type === 'messages' ? MessageSquare : FileUp;
  const label = type === 'messages' ? 'Mensagens' : 'Importações';

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="h-3 w-3" />
            <span>{label} este mês</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isBlocked && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Limite atingido
              </Badge>
            )}
            {isCritical && !isBlocked && (
              <AlertTriangle className="h-3 w-3 text-amber-500" />
            )}
            <span className={cn(
              'font-medium',
              isBlocked ? 'text-destructive' : isCritical ? 'text-amber-500' : 'text-foreground'
            )}>
              {usage.current}/{usage.limit}
            </span>
          </div>
        </div>
      )}
      <Progress
        value={percentage}
        className={cn(
          'h-1.5',
          isBlocked ? '[&>div]:bg-destructive' : 
          isCritical ? '[&>div]:bg-amber-500' : 
          isWarning ? '[&>div]:bg-yellow-500' : ''
        )}
      />
    </div>
  );
}
