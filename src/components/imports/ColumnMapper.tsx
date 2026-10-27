/**
 * @fileoverview Mapeador de Colunas para Importação - DrGeFin
 * 
 * Componente que permite ao usuário mapear colunas do arquivo
 * importado para os campos do sistema (data, valor, produto, etc).
 * Suporta campos obrigatórios e opcionais com validação visual.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface de mapeamento de colunas.
 * Cada propriedade representa um campo do sistema e seu valor
 * é o índice da coluna do arquivo (-1 se não mapeado).
 */
export interface ColumnMapping {
  date: number;
  quantity: number;
  grossValue: number;
  discountValue: number;
  netValue: number;
  costValue: number;
  sku: number;
  productName: number;
  channel: number;
  customerName: number;
  sellerName: number;
  orderId: number;
  city: number;
  state: number;
  category: number;
  unitPrice: number;
  taxValue: number;
  paymentMethod: number;
  status: number;
}

/**
 * Definição dos campos do sistema com labels e obrigatoriedade.
 * Os campos obrigatórios (required: true) devem ser mapeados
 * para que a importação possa prosseguir.
 */
export const SYSTEM_FIELDS = [
  { key: 'date', label: 'Data da Venda', required: true },
  { key: 'netValue', label: 'Valor (Líquido ou Total)', required: true },
  { key: 'quantity', label: 'Quantidade', required: false },
  { key: 'grossValue', label: 'Valor Bruto', required: false },
  { key: 'discountValue', label: 'Desconto', required: false },
  { key: 'costValue', label: 'Custo', required: false },
  { key: 'sku', label: 'SKU / Código', required: false },
  { key: 'productName', label: 'Nome do Produto', required: false },
  { key: 'channel', label: 'Canal / Loja', required: false },
  { key: 'customerName', label: 'Cliente', required: false },
  { key: 'sellerName', label: 'Vendedor', required: false },
  { key: 'orderId', label: 'Número do Pedido', required: false },
  { key: 'city', label: 'Cidade', required: false },
  { key: 'state', label: 'Estado / UF', required: false },
  { key: 'category', label: 'Categoria', required: false },
  { key: 'unitPrice', label: 'Preço Unitário', required: false },
  { key: 'taxValue', label: 'Impostos', required: false },
  { key: 'paymentMethod', label: 'Forma de Pagamento', required: false },
  { key: 'status', label: 'Status da Venda', required: false },
] as const;

export const DEFAULT_MAPPING: ColumnMapping = {
  date: -1,
  quantity: -1,
  grossValue: -1,
  discountValue: -1,
  netValue: -1,
  costValue: -1,
  sku: -1,
  productName: -1,
  channel: -1,
  customerName: -1,
  sellerName: -1,
  orderId: -1,
  city: -1,
  state: -1,
  category: -1,
  unitPrice: -1,
  taxValue: -1,
  paymentMethod: -1,
  status: -1,
};

/**
 * Props do componente ColumnMapper.
 */
interface ColumnMapperProps {
  /** Cabeçalhos das colunas do arquivo importado */
  headers: string[];
  /** Estado atual do mapeamento */
  mapping: ColumnMapping;
  /** Callback para atualizar o mapeamento */
  onMappingChange: (mapping: ColumnMapping) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente de mapeamento de colunas.
 * Exibe campos obrigatórios e opcionais com seletores para
 * associar cada coluna do arquivo a um campo do sistema.
 */
export function ColumnMapper({ headers, mapping, onMappingChange }: ColumnMapperProps) {
  const handleChange = (fieldKey: string, value: string) => {
    const colIndex = value === 'none' ? -1 : parseInt(value, 10);
    onMappingChange({
      ...mapping,
      [fieldKey]: colIndex,
    });
  };

  const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
  const optionalFields = SYSTEM_FIELDS.filter(f => !f.required);

  const isRequiredMet = requiredFields.every(f => mapping[f.key as keyof ColumnMapping] !== -1);

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-2">
        {isRequiredMet ? (
          <>
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-success">Campos obrigatórios mapeados</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning">Mapeie os campos obrigatórios</span>
          </>
        )}
      </div>

      {/* Required Fields */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          Campos Obrigatórios
          <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          {requiredFields.map(field => (
            <FieldSelect
              key={field.key}
              field={field}
              headers={headers}
              value={mapping[field.key as keyof ColumnMapping]}
              onChange={(val) => handleChange(field.key, val)}
            />
          ))}
        </div>
      </div>

      {/* Optional Fields */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Campos Opcionais</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {optionalFields.map(field => (
            <FieldSelect
              key={field.key}
              field={field}
              headers={headers}
              value={mapping[field.key as keyof ColumnMapping]}
              onChange={(val) => handleChange(field.key, val)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FieldSelectProps {
  field: { key: string; label: string; required: boolean };
  headers: string[];
  value: number;
  onChange: (value: string) => void;
}

function FieldSelect({ field, headers, value, onChange }: FieldSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      <Select value={value === -1 ? 'none' : value.toString()} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Selecione a coluna" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="none">
            <span className="text-muted-foreground">— Ignorar —</span>
          </SelectItem>
          {headers.map((header, idx) => (
            <SelectItem key={idx} value={idx.toString()}>
              <span className="font-mono text-xs text-muted-foreground mr-2">
                Col {idx + 1}:
              </span>
              {header || <span className="italic">(sem nome)</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
