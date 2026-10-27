/**
 * @fileoverview Preview de Arquivo Importado - DrGeFin
 * 
 * Componente que exibe uma prévia tabular do arquivo importado,
 * mostrando cabeçalhos e primeiras linhas para validação visual
 * antes do mapeamento de colunas.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Props do componente FilePreview.
 */
interface FilePreviewProps {
  headers: string[];
  rows: string[][];
  maxRows?: number;
}

export function FilePreview({ headers, rows, maxRows = 5 }: FilePreviewProps) {
  const displayRows = rows.slice(0, maxRows);

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {headers.map((header, idx) => (
                <TableHead 
                  key={idx} 
                  className="whitespace-nowrap font-medium text-xs px-3 py-2"
                >
                  <span className="text-muted-foreground mr-1">Col {idx + 1}:</span>
                  {header || <span className="text-muted-foreground italic">(vazio)</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {headers.map((_, colIdx) => (
                  <TableCell 
                    key={colIdx} 
                    className="whitespace-nowrap text-xs px-3 py-2 max-w-[200px] truncate"
                    title={row[colIdx] || ''}
                  >
                    {row[colIdx] || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {rows.length > maxRows && (
        <div className="text-xs text-muted-foreground text-center py-2 bg-muted/30 border-t">
          Mostrando {maxRows} de {rows.length} linhas
        </div>
      )}
    </div>
  );
}
