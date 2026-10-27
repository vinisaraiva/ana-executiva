import { useState } from 'react';
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onConfirm: (subject: string, message: string) => void;
  isLoading?: boolean;
}

const TEMPLATES = [
  {
    id: 'trial_expiring',
    label: 'Aviso de Expiração do Trial',
    subject: 'Seu período de trial está expirando',
    message: `Olá,

Notamos que o período de trial da sua conta está prestes a expirar. Para continuar utilizando todos os recursos da plataforma, considere fazer o upgrade para um plano pago.

Caso tenha dúvidas ou precise de ajuda, estamos à disposição.

Atenciosamente,
Equipe de Suporte`,
  },
  {
    id: 'welcome',
    label: 'Boas-vindas',
    subject: 'Bem-vindo à plataforma!',
    message: `Olá,

Seja bem-vindo à nossa plataforma! Estamos muito felizes em tê-lo conosco.

Se precisar de ajuda para começar, nossa equipe está à disposição para auxiliá-lo.

Atenciosamente,
Equipe de Suporte`,
  },
  {
    id: 'action_required',
    label: 'Ação Necessária',
    subject: 'Ação necessária na sua conta',
    message: `Olá,

Identificamos que sua conta requer uma ação para continuar funcionando normalmente.

Por favor, acesse sua conta e verifique as pendências.

Atenciosamente,
Equipe de Suporte`,
  },
  {
    id: 'custom',
    label: 'Mensagem Personalizada',
    subject: '',
    message: '',
  },
];

export function SendNotificationDialog({
  open,
  onOpenChange,
  tenantName,
  onConfirm,
  isLoading,
}: SendNotificationDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.message);
    }
  };

  const handleConfirm = () => {
    if (subject.trim() && message.trim()) {
      onConfirm(subject, message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Notificação
          </DialogTitle>
          <DialogDescription>
            Enviar email para os administradores de <strong>{tenantName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assunto</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Digite o assunto do email"
            />
          </div>

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem do email"
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !subject.trim() || !message.trim()}
          >
            {isLoading ? 'Enviando...' : 'Enviar Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
