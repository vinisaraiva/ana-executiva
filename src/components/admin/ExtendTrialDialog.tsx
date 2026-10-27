import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ExtendTrialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEndDate: Date | null;
  onConfirm: (newEndDate: Date) => void;
  isLoading?: boolean;
}

export function ExtendTrialDialog({
  open,
  onOpenChange,
  currentEndDate,
  onConfirm,
  isLoading,
}: ExtendTrialDialogProps) {
  const baseDate = currentEndDate || new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(baseDate, 7));

  const quickOptions = [
    { label: '+7 dias', days: 7 },
    { label: '+14 dias', days: 14 },
    { label: '+30 dias', days: 30 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Estender Trial
          </DialogTitle>
          <DialogDescription>
            {currentEndDate ? (
              <>
                Trial atual expira em:{' '}
                <strong>{format(currentEndDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
              </>
            ) : (
              'Defina uma nova data de término do trial.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            {quickOptions.map((option) => (
              <Button
                key={option.days}
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(baseDate, option.days))}
                className={cn(
                  selectedDate.getTime() === addDays(baseDate, option.days).getTime() &&
                    'border-primary bg-primary/10'
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ou selecione uma data específica:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm">
              Nova data de expiração:{' '}
              <strong>{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(selectedDate)} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
