/**
 * @fileoverview Preview de Dados Mapeados - DrGeFin
 * 
 * Componente que exibe uma prévia dos dados após o mapeamento
 * de colunas, mostrando como os dados serão importados no sistema.
 * Inclui validação visual de campos obrigatórios.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileSpreadsheet } from 'lucide-react';
import { ColumnMapping, SYSTEM_FIELDS } from './ColumnMapper';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Props do componente MappedDataPreview.
 */
interface MappedDataPreviewProps {
  mapping: ColumnMapping;
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export function MappedDataPreview({ mapping, headers, rows, totalRows }: MappedDataPreviewProps) {
  // Get only mapped fields (value !== -1), sorted: required first, then optional
  const mappedFields = SYSTEM_FIELDS
    .filter(field => mapping[field.key as keyof ColumnMapping] !== -1)
    .sort((a, b) => {
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return 0;
    });

  // Transform rows using the mapping
  const transformedRows = rows.slice(0, 5).map(row => {
    return mappedFields.map(field => {
      const colIndex = mapping[field.key as keyof ColumnMapping];
      return colIndex >= 0 && colIndex < row.length ? row[colIndex] : '';
    });
  });

  const mappedCount = mappedFields.length;
  const requiredMapped = SYSTEM_FIELDS.filter(f => f.required && mapping[f.key as keyof ColumnMapping] !== -1).length;
  const totalRequired = SYSTEM_FIELDS.filter(f => f.required).length;

  if (mappedFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Nenhum campo mapeado ainda.</p>
        <p className="text-xs">Volte à aba anterior para mapear as colunas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <FileSpreadsheet className="h-3 w-3" />
          {totalRows.toLocaleString('pt-BR')} linhas serão importadas
        </Badge>
        <Badge variant="outline" className="gap-1">
          {mappedCount} campos mapeados
        </Badge>
        {requiredMapped === totalRequired && (
          <Badge variant="default" className="gap-1 bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3" />
            Campos obrigatórios OK
          </Badge>
        )}
      </div>

      {/* Preview note */}
      <p className="text-sm text-muted-foreground">
        Prévia das primeiras {Math.min(5, rows.length)} linhas com o mapeamento aplicado:
      </p>

      {/* Data table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                {mappedFields.map((field, idx) => (
                  <TableHead 
                    key={field.key} 
                    className={`whitespace-nowrap ${field.required ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </div>
                    <div className="text-xs font-normal text-muted-foreground mt-0.5">
                      ← {headers[mapping[field.key as keyof ColumnMapping]] || 'Coluna ' + (mapping[field.key as keyof ColumnMapping] + 1)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transformedRows.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <TableCell 
                      key={cellIdx} 
                      className={`whitespace-nowrap ${
                        mappedFields[cellIdx]?.required 
                          ? 'bg-primary/5' 
                          : ''
                      }`}
                    >
                      {cell || <span className="text-muted-foreground italic">—</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer note */}
      {rows.length > 5 && (
        <p className="text-xs text-muted-foreground text-center">
          ... e mais {(totalRows - 5).toLocaleString('pt-BR')} linhas
        </p>
      )}
    </div>
  );
}
